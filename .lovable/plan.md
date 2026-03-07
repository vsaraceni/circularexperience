

## Correção: Logos no Marquee do Hero

### Problema
- `brightness-0 invert` elimina cores e detalhes dos logos (vira silhueta branca)
- `h-6 md:h-8` é pequeno demais — logos como Dow, Scania, Sebrae ficam ilegíveis

### Solução

**`src/components/landing/Hero.tsx`**:

1. Remover `brightness-0 invert` dos logos
2. Aumentar altura para `h-8 md:h-10` (compatível com o que já é usado na seção SocialProof)
3. Usar alturas individuais por logo (como faz o `SocialProof.tsx`) para equilibrar logos de proporções diferentes
4. Manter `opacity-70 hover:opacity-100` para harmonizar com o fundo escuro sem destruir as cores
5. Adicionar `drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]` para dar leve destaque/contraste sobre fundo escuro

O array `partnerLogos` passará a ter altura individual por logo, similar ao padrão já usado em `SocialProof.tsx`.

