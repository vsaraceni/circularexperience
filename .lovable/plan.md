

## Plano: Social Proof no Hero — Marquee + Métrica

### O que será feito

Adicionar um bloco abaixo dos 4 cards informativos no Hero contendo:
1. Uma linha de texto centralizada: **"Confiado por +500 profissionais de empresas como:"** com badge "NPS +98%"
2. Uma faixa marquee com logos dos parceiros (DOW, Scania, SEBRAE, COOPERCAPS, Avery Dennison, SEMIL, InvestSP) deslizando continuamente

Tudo dentro de um container glassmorphism (`bg-white/10 backdrop-blur-md border-white/15`), consistente com os cards existentes.

### Arquivo alterado

**`src/components/landing/Hero.tsx`**
- Importar logos de `src/assets/partners/`
- Adicionar bloco após o grid de cards (após linha ~100)
- Logos com filtro `brightness(0) invert(1)` + opacidade 60% para ficarem brancos/translúcidos sobre fundo escuro

**`src/index.css`**
- Adicionar keyframe `marquee` para animação infinita de scroll horizontal

### Detalhes técnicos

- Marquee: duplicação do array de logos para loop contínuo via CSS `translateX(0) → translateX(-50%)`
- Velocidade: ~30s por ciclo
- Responsivo: logos menores em mobile (`h-6` vs `h-8`)
- Não altera o componente `SocialProof.tsx` existente

