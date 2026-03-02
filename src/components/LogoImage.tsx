import * as React from "react";

type LogoImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

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

function isWhiteOrTransparent(r: number, g: number, b: number, a: number, threshold = 240) {
  return a < 10 || (r >= threshold && g >= threshold && b >= threshold);
}

async function autocrop(src: string) {
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
  const { data } = ctx.getImageData(0, 0, w, h);

  const px = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]] as const;
  };

  let top = 0, bottom = h - 1, left = 0, right = w - 1;

  // scan top
  outer: for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = px(x, y);
      if (!isWhiteOrTransparent(r, g, b, a)) { top = y; break outer; }
    }
  }

  // scan bottom
  outer: for (let y = h - 1; y >= top; y--) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = px(x, y);
      if (!isWhiteOrTransparent(r, g, b, a)) { bottom = y; break outer; }
    }
  }

  // scan left
  outer: for (let x = 0; x < w; x++) {
    for (let y = top; y <= bottom; y++) {
      const [r, g, b, a] = px(x, y);
      if (!isWhiteOrTransparent(r, g, b, a)) { left = x; break outer; }
    }
  }

  // scan right
  outer: for (let x = w - 1; x >= left; x--) {
    for (let y = top; y <= bottom; y++) {
      const [r, g, b, a] = px(x, y);
      if (!isWhiteOrTransparent(r, g, b, a)) { right = x; break outer; }
    }
  }

  const cw = right - left + 1;
  const ch = bottom - top + 1;

  if (cw <= 0 || ch <= 0 || (cw === w && ch === h)) {
    processedSrcCache.set(src, src);
    return src;
  }

  const cropped = ctx.getImageData(left, top, cw, ch);
  canvas.width = cw;
  canvas.height = ch;
  ctx.putImageData(cropped, 0, 0);

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
    if (cached) { setFinalSrc(cached); return; }

    autocrop(src)
      .then((url) => { if (!cancelled) setFinalSrc(url); })
      .catch(() => { if (!cancelled) setFinalSrc(src); });

    return () => { cancelled = true; };
  }, [src]);

  return <img src={finalSrc} {...imgProps} />;
}
