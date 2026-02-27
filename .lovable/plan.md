

# Plano: Nova Foto de Fundo no Hero com Overlay Humanizado

## Resumo

Substituir a imagem de fundo atual do Hero pela foto da oficina (pessoas trabalhando com ferramentas), aplicar uma pelicula escura semitransparente por cima para garantir legibilidade, e ajustar as cores dos textos para branco/claro sobre a imagem.

## Alteracoes

### 1. Copiar a imagem para o projeto
- Copiar `user-uploads://IMG_6999.jpg` para `src/assets/hero-workshop.jpg`

### 2. Atualizar `Hero.tsx`

**Imagem de fundo:**
- Trocar o import de `hero-circular-new.png` para `hero-workshop.jpg`

**Overlay (pelicula):**
- Substituir o gradiente lateral atual por uma pelicula escura uniforme com leve gradiente:
  - `bg-gradient-to-r from-black/70 via-black/50 to-black/40`
  - Isso escurece a foto o suficiente para o texto branco se destacar sem perder a humanizacao da imagem

**Cores dos textos (sobre fundo escuro):**
- Headline: de `text-foreground` para `text-white`
- Span "Economia Circular": manter gradiente ou usar cor clara de destaque (ex: amarelo/teal do branding)
- Subheadline: de `text-muted-foreground` para `text-white/80`
- Badge: fundo `bg-white/10 border-white/20` com texto `text-white`
- Cards info: `bg-white/10 backdrop-blur-md border-white/15` com textos em `text-white` e sublabels em `text-white/70`
- Icones nos cards: manter os gradientes atuais (eles ja tem contraste proprio)

**Botoes:**
- "Solicitar Proposta" (hero variant): ja deve ter bom contraste, verificar
- "Saiba Mais" (heroOutline): ajustar borda e texto para branco se necessario

**Elementos decorativos:**
- Ajustar blobs para `bg-white/10` e `bg-primary/20` para nao competir com a foto

## Resultado Esperado

Hero com foto real da oficina ao fundo, transmitindo a experiencia pratica e humana do Circular Experience. Pelicula escura sutil garante legibilidade. Textos em branco/claro criam contraste elegante sobre a imagem.

## Arquivo Afetado
- `src/components/landing/Hero.tsx` (import + overlay + cores)
- Nova imagem: `src/assets/hero-workshop.jpg`

