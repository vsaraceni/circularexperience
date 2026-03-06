

# Unificar Metodologia Steps + Benefits em um único slide

## Ideia
Concordo — compactando os cards das 3 etapas e colocando "O que seu time vai aprender" logo abaixo, tudo cabe em 1080px. Isso elimina 1 slide e melhora o fluxo.

## Mudanças

### 1. Criar `MethodologyFullPrint.tsx` (versão print unificada)
Componente único para o PDF com:
- Logo Circular Experience menor (`h-14`)
- Título "Nossa Metodologia" + subtítulo compactos (`mb-4`)
- 3 cards em `grid-cols-3` com padding reduzido (`p-4`), número inline menor (`w-12 h-12 mb-3`), fontes menores (`text-lg` título, `text-sm` descrição)
- Separador visual discreto
- Seção "O que seu time vai aprender" com `grid-cols-3 gap-3`, items compactos (`p-3`, `text-xs`)

### 2. Criar `MethodologyFull.tsx` (versão online unificada)
Mesmo conceito para o modo apresentação online:
- Usa classes Tailwind com tokens do tema (sem cores inline)
- Cards compactos + benefícios abaixo no mesmo slide

### 3. Atualizar `PrintablePresentation.tsx`
- Substituir `MethodologySteps` + `MethodologyBenefits` por `MethodologyFullPrint` (1 slide em vez de 2)

### 4. Atualizar `PresentationMode.tsx`
- Substituir os 2 slides (`MethodologySteps` + `MethodologyBenefits`) por `MethodologyFull` (1 slide)

### 5. Landing page
- Manter `MethodologySteps` e `MethodologyBenefits` separados na landing (são seções distintas com scroll), sem alteração.

## Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `src/components/presentation/slides/MethodologyFullPrint.tsx` | Criar |
| `src/components/presentation/slides/MethodologyFull.tsx` | Criar |
| `src/pages/PrintablePresentation.tsx` | Trocar 2 imports por 1 |
| `src/components/presentation/PresentationMode.tsx` | Trocar 2 slides por 1 |

