import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MenuButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}> = ({ onClick, active, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
      active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] px-3 py-2 text-sm text-foreground focus:outline-none prose prose-sm max-w-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  const toggleHtmlMode = () => {
    if (htmlMode) {
      // Switching back to visual: sync raw HTML into Tiptap
      editor?.commands.setContent(rawHtml);
      onChange(rawHtml);
    } else {
      // Switching to HTML: capture current editor HTML
      setRawHtml(editor?.getHTML() || "");
    }
    setHtmlMode(!htmlMode);
  };

  if (!editor) return null;

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-input bg-muted/30">
        {!htmlMode && (
          <>
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Negrito"
            >
              <strong>B</strong>
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Itálico"
            >
              <em>I</em>
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
              title="Sublinhado"
            >
              <span className="underline">U</span>
            </MenuButton>

            <div className="w-px h-5 bg-border mx-1" />

            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="Lista com marcadores"
            >
              • Lista
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Lista numerada"
            >
              1. Lista
            </MenuButton>

            <div className="w-px h-5 bg-border mx-1" />

            <MenuButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              title="Citação"
            >
              ❝ Citação
            </MenuButton>
          </>
        )}

        <div className="flex-1" />

        <MenuButton
          onClick={toggleHtmlMode}
          active={htmlMode}
          title="Editar HTML"
        >
          &lt;/&gt;
        </MenuButton>
      </div>

      {/* Editor */}
      {htmlMode ? (
        <textarea
          className="w-full min-h-[180px] px-3 py-2 text-sm font-mono text-foreground bg-background focus:outline-none resize-y"
          value={rawHtml}
          onChange={(e) => {
            setRawHtml(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
};

export default RichTextEditor;
