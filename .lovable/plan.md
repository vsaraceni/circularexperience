## Ajustes no Hero

### `src/components/landing/Hero.tsx`

1. **Badge de duração**: Trocar `"4 Horas"` por `"Compacto"` (linha ~68). Linha de baixo trocar de: "Duração" para: A partir de 2h de duração
2. **Botão "Saiba Mais"**: Trocar `scrollToSection("sobre")` por `scrollToSection("social-proof")` (linha ~56).

### `src/components/landing/SocialProof.tsx`

3. Adicionar `id="social-proof"` na `<section>` (linha ~41) para que o scroll funcione.