

# Corrigir logos: remover processamento destrutivo e mostrar em cores originais

## Problema
O componente `LogoImage` usa um algoritmo de flood-fill que remove pixels baseado nas cores dos cantos da imagem. Isso esta corrompendo os logos (removendo partes do conteudo). Alem disso, o filtro CSS `grayscale` deixa os logos com aparencia degradada.

## Solucao

### 1. Reescrever `LogoImage` com autocrop nao-destrutivo
Em vez de flood-fill (que invade o conteudo do logo), usar uma abordagem de **autocrop por bordas**:
- Detectar linhas/colunas nas bordas que sao compostas apenas por pixels brancos ou quase-brancos (ou transparentes)
- Recortar o canvas apenas nessas bordas externas
- Isso remove o espaco em branco ao redor sem tocar no conteudo interno do logo

### 2. Remover filtro `grayscale` do CSS
- Trocar `filter grayscale hover:grayscale-0` por `opacity-70 hover:opacity-100` para manter um efeito sutil sem destruir as cores
- Alternativa: remover qualquer filtro e mostrar os logos em cores originais

### 3. Manter tamanhos individuais por logo
- Manter a estrutura atual com `height` por item
- Ajustar valores conforme necessario apos ver o resultado do autocrop

## Arquivos afetados
- `src/components/LogoImage.tsx` -- reescrever algoritmo de processamento (autocrop por bordas em vez de flood-fill)
- `src/components/landing/SocialProof.tsx` -- remover `grayscale` das classes CSS, usar `opacity-70 hover:opacity-100`

## Detalhes tecnicos

O novo algoritmo de `LogoImage`:

```text
1. Carregar imagem no canvas
2. Escanear da borda para dentro:
   - Top: encontrar primeira linha com pixel nao-branco
   - Bottom: encontrar ultima linha com pixel nao-branco
   - Left/Right: idem para colunas
3. Recortar canvas para essa bounding box
4. Exportar como PNG com transparencia preservada
```

Isso preserva 100% do conteudo original do logo, removendo apenas margens em branco.

