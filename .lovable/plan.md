

# Corrigir distorção de imagens no PDF

## Problema

O slide tem proporção 16:9 (1920×1080 = 1.778), mas o A4 paisagem tem proporção 297×210mm (= 1.414). O código atual força a imagem a preencher toda a página A4 (`pdf.addImage(imgData, "JPEG", 0, 0, 297, 210)`), esticando verticalmente.

## Solução

**`src/components/pdf/PdfExporter.tsx`** — Calcular dimensões da imagem preservando aspect ratio e centralizar na página:

```typescript
const canvasRatio = canvas.width / canvas.height; // 16:9
const pageRatio = pageWidth / pageHeight;          // ~1.414

let imgW, imgH, offsetX, offsetY;
if (canvasRatio > pageRatio) {
  // Slide é mais largo que A4 → fit by width, center vertically
  imgW = pageWidth;
  imgH = pageWidth / canvasRatio;
  offsetX = 0;
  offsetY = (pageHeight - imgH) / 2;
} else {
  imgH = pageHeight;
  imgW = pageHeight * canvasRatio;
  offsetX = (pageWidth - imgW) / 2;
  offsetY = 0;
}

pdf.addImage(imgData, "JPEG", offsetX, offsetY, imgW, imgH);
```

As barras restantes (topo/baixo) ficarão brancas, mantendo a proporção correta dos slides. Também preencher o fundo da página com preto para slides escuros, se desejado — mas começamos com branco simples.

