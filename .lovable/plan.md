

## Adicionar botão "PDF da proposta" no slide final do ProposalView

### Alteração: `src/pages/ProposalView.tsx`

1. Reutilizar a mesma lógica de geração de PDF do `PdfExporter` — chamar a edge function `generate-pdf` com o slug, baixar o blob como arquivo.
2. Adicionar estado `generatingPdf` no componente.
3. No `div` do slide da proposta (linha 129, `id="contato"`), posicionar um botão absoluto no canto superior direito com ícone `FileDown` + texto "PDF da proposta".
4. Estilo discreto: `absolute top-4 right-4`, fundo semi-transparente ou ghost, texto pequeno, `z-index` alto para não ser coberto.
5. Importar `FileDown` e `Loader2` de lucide-react, e `toast` de sonner (já usados no projeto).

Nenhuma alteração em outros arquivos. A lógica é idêntica ao `PdfExporter.tsx` — fetch para a edge function, download do blob.

