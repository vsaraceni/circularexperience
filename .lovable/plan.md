

# Reduzir logos do header e footer para proporcao equilibrada

## Problema
Os logos no header e footer estao usando `h-16 md:h-20`, que e a altura total do header (64px / 80px). Isso faz o logo ocupar 100% da altura sem respiro visual.

## Solucao

Reduzir as dimensoes dos logos e adicionar padding adequado para criar respiro.

### `src/components/landing/Header.tsx`
- Alterar classe do logo de `h-16 md:h-20` para `h-10 md:h-12` (40px / 48px)
- Isso deixa respiro vertical dentro do header de 64px / 80px

### `src/components/landing/Footer.tsx`
- Alterar classe do logo de `h-16 md:h-20` para `h-10 md:h-12` (40px / 48px)
- Manter consistencia visual entre header e footer

## Resultado
Logos proporcionais com respiro nas margens, mantendo boa visibilidade sem dominar o espaco.

