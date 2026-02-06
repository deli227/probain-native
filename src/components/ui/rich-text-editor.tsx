
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Toggle } from './toggle';
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type RichTextEditorProps = {
  content: string;
  onChange: (richText: string) => void;
  placeholder?: string;
  darkMode?: boolean;
};

type MenuBarProps = {
  editor: Editor | null;
  darkMode?: boolean;
}

const MenuBar = ({ editor, darkMode }: MenuBarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <div className={cn(
      "border rounded-t-md p-1 flex flex-wrap gap-1",
      darkMode
        ? "bg-white/10 border-white/20"
        : "bg-background border-input"
    )}>
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Texte en gras"
        className={darkMode ? "hover:bg-white/20 text-white/70 data-[state=on]:bg-white/20 data-[state=on]:text-white" : ""}
      >
        <Bold className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Texte en italique"
        className={darkMode ? "hover:bg-white/20 text-white/70 data-[state=on]:bg-white/20 data-[state=on]:text-white" : ""}
      >
        <Italic className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Titre"
        className={darkMode ? "hover:bg-white/20 text-white/70 data-[state=on]:bg-white/20 data-[state=on]:text-white" : ""}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Liste à puces"
        className={darkMode ? "hover:bg-white/20 text-white/70 data-[state=on]:bg-white/20 data-[state=on]:text-white" : ""}
      >
        <List className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Liste numérotée"
        className={darkMode ? "hover:bg-white/20 text-white/70 data-[state=on]:bg-white/20 data-[state=on]:text-white" : ""}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>

    </div>
  );
};

export function RichTextEditor({ content, onChange, placeholder, darkMode }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: darkMode ? 'text-cyan-400 underline' : 'text-primary underline',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[150px] rounded-b-md p-3 focus:outline-none',
          darkMode
            ? 'border-x border-b border-white/20 text-white bg-white/5'
            : 'border-x border-b border-input'
        ),
      },
    },
  });

  return (
    <div className="w-full">
      <MenuBar editor={editor} darkMode={darkMode} />
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
