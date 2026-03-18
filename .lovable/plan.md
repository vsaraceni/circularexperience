

## Plano: Adicionar modo HTML ao editor de email

Adicionar um toggle "Visual / HTML" no `RichTextEditor.tsx` que alterna entre o editor Tiptap (WYSIWYG) e um `<textarea>` com o código HTML bruto.

### Mudança única: `src/components/admin/RichTextEditor.tsx`

- Adicionar estado `htmlMode` (boolean, default `false`).
- Na toolbar, adicionar botão `</>` HTML à direita que alterna o modo.
- Quando `htmlMode = true`: esconder toolbar de formatação e o `EditorContent`, mostrar `<textarea>` com o HTML bruto. O `onChange` dispara no `onChange` do textarea.
- Quando volta para modo visual: sincronizar o conteúdo editado no textarea de volta para o editor Tiptap via `editor.commands.setContent(rawHtml)`.

Nenhuma outra mudança necessária — o componente já é usado no `EmailTemplateEditor`.

