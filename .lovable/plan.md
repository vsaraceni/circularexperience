

# Adicionar logo do Movimento Circular no slide 2 (apenas print)

## Abordagem
Overlay do logo no canto superior esquerdo do slide 2 (SocialProof, index 1) diretamente no `PrintablePresentation.tsx`, sem tocar no componente `SocialProof.tsx`.

## Mudanças

### 1. Copiar o asset
Copiar `user-uploads://Movimento-Circular_logotipo_horizontal_5.png` para `src/assets/movimento-circular-logo-horizontal.png`.

### 2. `src/pages/PrintablePresentation.tsx`
- Importar o novo logo
- No loop de renderização, quando `index === 1`, adicionar um `<img>` com `position: absolute; top: 40px; left: 60px; height: 50px` (tamanho de assinatura corporativa) por cima do slide, sem afetar os demais

O `slide-container` já tem `position: relative`, então o logo absoluto funciona diretamente.

