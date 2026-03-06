

# Centralizar imagem no centro da página A4

## Alteração

**`src/components/pdf/PdfExporter.tsx`**, linhas 85-91 — substituir por:

```typescript
const canvasRatio = canvas.width / canvas.height;
const imgW = pageWidth * 0.9;
const imgH = imgW / canvasRatio;
const offsetX = (pageWidth - imgW) / 2;
const offsetY = (pageHeight - imgH) / 2;
pdf.addImage(imgData, "JPEG", offsetX, offsetY, imgW, imgH);
```

A imagem ocupará 90% da largura (conforme solicitado anteriormente), com altura proporcional, e será centralizada tanto horizontal quanto verticalmente na página A4.

