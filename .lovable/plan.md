

# Ajuste de tamanho individual dos logos e reducao do espacamento

## Problema
- Os logos tem tamanhos visuais diferentes porque as imagens originais variam em proporcao e dimensao
- O `gap-8` (32px) entre os itens do grid esta deixando os logos muito espacados

## Solucao

### 1. Tamanho individual por logo
Adicionar uma propriedade `height` customizada para cada logo no array `partners` e `events`, ajustando visualmente para que todos aparentem o mesmo tamanho:

```text
Parceiros:
- DOW: h-8 md:h-10 (logo compacto, precisa ser menor)
- Scania: h-8 md:h-10
- SEBRAE: h-10 md:h-14 (logo mais horizontal, precisa de mais altura)
- COOPERCAPS: h-10 md:h-14
- Avery Dennison: h-8 md:h-10
- SEMIL: h-12 md:h-16 (logo com selo, precisa de mais espaco)
- InvestSP: h-10 md:h-14

Eventos:
- WCEF: h-10 md:h-14
- Agenda Verde: h-10 md:h-14
- Semana Futuro: h-10 md:h-14
```

Cada item tera uma classe CSS individual aplicada ao `LogoImage`.

### 2. Reduzir espacamento
- Parceiros: trocar `gap-8` por `gap-4 md:gap-6`
- Eventos: trocar `gap-8` por `gap-4 md:gap-6`
- Usar `flex flex-wrap justify-center` em vez de `grid` para que os logos fiquem agrupados naturalmente sem espacos vazios forcados pelo grid

## Arquivo afetado
- `src/components/landing/SocialProof.tsx` — ajustar array de dados com classe individual + trocar layout de grid para flex com gap menor
