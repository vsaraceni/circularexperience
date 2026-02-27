

# Ajustes de Legibilidade e Espacamento no Hero

## Problemas Identificados

1. **Texto "Economia Circular" em roxo** -- a classe `text-gradient-primary` aplica um gradiente roxo escuro que nao tem contraste suficiente sobre a foto escura
2. **Cards na base** -- estao colados na parte inferior da secao, sem respiro
3. **Badge superior** -- esta colado na barra de navegacao, sem respiro

## Solucao

### 1. Cor do texto "Economia Circular" (`Hero.tsx`, linha 34)
- Trocar `text-gradient-primary` por `text-white` com um leve destaque visual
- Alternativa melhor: usar uma cor clara de destaque como o **amarelo/dourado** do branding (`text-[hsl(45,100%,50%)]`) ou simplesmente branco com underline/itálico
- Recomendacao: usar a cor accent (amarelo) que contrasta bem sobre fundo escuro e mantem identidade visual

### 2. Respiro inferior nos cards (`Hero.tsx`, linha 55)
- Adicionar `pb-16 md:pb-20` na secao principal para criar espaco entre os cards e a borda inferior

### 3. Respiro superior no badge (`Hero.tsx`, linha 23)
- Aumentar o `pt-20` da secao para `pt-28 md:pt-32` para dar mais espaco entre a navegacao e o badge

## Arquivo Afetado
- `src/components/landing/Hero.tsx` -- 3 ajustes pontuais de classes CSS
