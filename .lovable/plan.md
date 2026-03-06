

# Centralizar slides e padronizar títulos (print + online)

## Contexto
O `SlideWrapper` da versão online já centraliza com `items-center` por padrão. O problema é que os componentes têm `py-20`, `py-16`, `py-5` etc. que ocupam altura variável — mas o conteúdo não preenche os 1080px, ficando visualmente desalinhado no topo por causa do padding desigual.

A versão printável (`PrintablePresentation`) não tem nenhuma centralização no `.slide-container`.

## Mudanças

### 1. `PrintablePresentation.tsx` — centralizar `.slide-container`
Adicionar `display: flex; align-items: center; justify-content: center;` ao CSS do `.slide-container`.

### 2. Padronizar títulos nos 4 componentes (afeta online e print)

Referência do ExpertsPrint: `text-4xl font-bold` + subtítulo `text-lg`.

| Componente | Título atual | Subtítulo atual | Título novo | Subtítulo novo |
|---|---|---|---|---|
| `SocialProof.tsx` | `text-2xl md:text-3xl` | (badges) | `text-3xl md:text-4xl` | manter |
| `Stats.tsx` | `text-3xl md:text-4xl` | `text-lg` | `text-3xl md:text-4xl` (ok) | ok |
| `MethodologyBenefits.tsx` | `text-2xl` | nenhum | `text-3xl md:text-4xl` | adicionar `text-lg` |
| `Agenda.tsx` | `text-xl md:text-2xl` | `text-xs` | `text-3xl md:text-4xl` | `text-base md:text-lg` |

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/pages/PrintablePresentation.tsx` | Flex centering no `.slide-container` |
| `src/components/landing/SocialProof.tsx` | Título `text-3xl md:text-4xl` |
| `src/components/presentation/slides/MethodologyBenefits.tsx` | Título `text-3xl md:text-4xl` + subtítulo |
| `src/components/landing/Agenda.tsx` | Título `text-3xl md:text-4xl`, subtítulo `text-base md:text-lg` |

Stats já está no padrão correto, sem alteração necessária.

