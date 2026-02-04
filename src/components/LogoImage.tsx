import * as React from "react";

type LogoImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

// Cache to avoid re-processing the same asset multiple times (header/footer)
const processedSrcCache = new Map<string, string>();

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function distSq(r: number, g: number, b: number, c: [number, number, number]) {
  const dr = r - c[0];
  const dg = g - c[1];
  const db = b - c[2];
  return dr * dr + dg * dg + db * db;
}

function isNearGray(r: number, g: number, b: number, maxChroma: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min <= maxChroma;
}

async function removeBakedCheckerboard(src: string) {
  const cached = processedSrcCache.get(src);
  if (cached) return cached;

  const img = await loadImage(src);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) return src;

  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  const cornerPoints: Array<[number, number]> = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  const cornerColors: Array<[number, number, number]> = cornerPoints.map(([x, y]) => {
    const i = (y * w + x) * 4;
    return [d[i], d[i + 1], d[i + 2]];
  });

  // Only remove pixels that are (a) close to one of the corner background colors
  // and (b) low-chroma (near-gray), to avoid eating teal/orange/purple gradients.
  const thresholdSq = 42 * 42;
  const maxChroma = 18;
  const matchesBackground = (i: number) => {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    if (!isNearGray(r, g, b, maxChroma)) return false;
    return cornerColors.some((c) => distSq(r, g, b, c) <= thresholdSq);
  };

  const visited = new Uint8Array(w * h);
  const stack: Array<[number, number]> = [...cornerPoints];

  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const idx = y * w + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const i = idx * 4;
    if (!matchesBackground(i)) continue;

    // Make pixel fully transparent
    d[i + 3] = 0;

    // 4-neighborhood flood fill
    if (x > 0) stack.push([x - 1, y]);
    if (x < w - 1) stack.push([x + 1, y]);
    if (y > 0) stack.push([x, y - 1]);
    if (y < h - 1) stack.push([x, y + 1]);
  }

  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b as Blob), "image/png");
  });

  const url = URL.createObjectURL(blob);
  processedSrcCache.set(src, url);
  return url;
}

export function LogoImage({ src, ...imgProps }: LogoImageProps) {
  const [finalSrc, setFinalSrc] = React.useState(() => processedSrcCache.get(src) ?? src);

  React.useEffect(() => {
    let cancelled = false;

    const cached = processedSrcCache.get(src);
    if (cached) {
      setFinalSrc(cached);
      return;
    }

    removeBakedCheckerboard(src)
      .then((url) => {
        if (!cancelled) setFinalSrc(url);
      })
      .catch(() => {
        if (!cancelled) setFinalSrc(src);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return <img src={finalSrc} {...imgProps} />;
}
