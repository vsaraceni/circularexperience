

# Ajustes nos slides e editor rich-text para propostas

## Mudancas

### 1. ExpertsPrint -- aumentar altura das fotos
Alterar `h-44` para `h-56` no container de imagem dos cards em `ExpertsPrint.tsx`, para mostrar mais do rosto dos profissionais sem cortar.

### 2. ProposalSlide -- reduzir destaque do investimento e aumentar fontes
Em `ProposalSlide.tsx`:
- **Investimento**: reduzir de `text-4xl` para `text-2xl`, reduzir padding do card de `p-6` para `p-4`, tornar mais discreto na sidebar
- **Fontes maiores**: titulo de `text-3xl` para `text-4xl`, valores dos MetaCards de `text-lg` para `text-xl`, texto de escopo/consideracoes de `text-base` para `text-lg`, labels de `text-xs` para `text-sm`

### 3. Editor rich-text nos campos Escopo e Consideracoes
Instalar **tiptap** (editor rich-text leve para React) e criar um componente `RichTextEditor` com toolbar basica: bold, italic, bullet list, ordered list, indent. Substituir os `<Textarea>` de escopo e consideracoes no `ProposalForm.tsx` por este editor.

O conteudo sera salvo como HTML no banco (os campos `scope` e `considerations` ja sao `text`, entao suportam HTML).

Na renderizacao (ProposalSlide e ProposalView), substituir `whitespace-pre-wrap` por `dangerouslySetInnerHTML` com o HTML do editor, aplicando estilos basicos para `ul`, `ol`, `strong`, `em` via CSS.

### Pacotes a instalar
- `@tiptap/react`
- `@tiptap/starter-kit` (inclui bold, italic, lists, headings)
- `@tiptap/extension-underline` (opcional)

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/presentation/slides/ExpertsPrint.tsx` | `h-44` -> `h-56` |
| `src/components/presentation/slides/ProposalSlide.tsx` | Reduzir investimento, aumentar fontes, render HTML |
| `src/components/admin/RichTextEditor.tsx` | Criar -- editor tiptap com toolbar |
| `src/components/admin/ProposalForm.tsx` | Substituir Textarea por RichTextEditor |
| `src/pages/ProposalView.tsx` | Render HTML em escopo/consideracoes |

