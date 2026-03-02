

# Ajustes nos slides Hero e Agenda

## Problema 1: Agenda cortando no topo
O `SlideWrapper` usa `flex items-center justify-center`, o que centraliza verticalmente. Quando o conteudo da Agenda e maior que 1080px, o flexbox centraliza e corta igualmente em cima e embaixo -- perdendo o topo. Com `overflow-y-auto` o scroll comeca do meio, nao do topo.

**Solucao**: Adicionar uma prop `align` ao `SlideWrapper` que permite controlar o alinhamento vertical. Para a Agenda, usar `align="top"` com um padding-top, trocando `items-center` por `items-start` e adicionando `pt-8`. O scroll comecara do topo naturalmente.

## Problema 2: Hero nao ocupa toda a tela do slide
O Hero tem `min-h-screen` mas esta contido dentro do container de 1920x1080 com `flex items-center justify-center`. Ele nao preenche o slide todo -- fica centralizado com espaco ao redor.

**Solucao**: Adicionar uma prop `fullBleed` ao `SlideWrapper` que remove o flex centering e faz o children ocupar 100% do espaco. Para o Hero, usar `fullBleed={true}`. O Hero ja tem `min-h-screen` que dentro do container de 1080px de altura vai preencher tudo.

## Alteracoes

### `src/components/presentation/SlideWrapper.tsx`
- Adicionar props opcionais: `align?: "center" | "top"` e `fullBleed?: boolean`
- Quando `fullBleed=true`: container interno usa `w-full h-full` sem flex centering
- Quando `align="top"`: trocar `items-center` por `items-start pt-8`
- Default continua `align="center"` e `fullBleed=false`

### `src/components/presentation/PresentationMode.tsx`
- Atualizar a definicao dos slides para incluir props extras:
  - Hero: `{ component: Hero, label: "Capa", fullBleed: true }`
  - Agenda: `{ component: Agenda, label: "Agenda", align: "top" }`
- Passar essas props ao `SlideWrapper`

## Detalhes tecnicos

```text
SlideWrapper props:
  children: ReactNode
  isActive: boolean
  align?: "center" | "top"    (default: "center")
  fullBleed?: boolean          (default: false)

Container interno:
  fullBleed=true  -> "w-full h-full"
  align="top"     -> "w-full h-full overflow-y-auto flex items-start pt-8 justify-center ..."
  align="center"  -> "w-full h-full overflow-y-auto flex items-center justify-center ..." (atual)
```

