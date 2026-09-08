import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import {
  IconBold,
  IconH2,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconPilcrow,
  IconArrowForwardUp,
  IconUnderline,
  IconUnlink,
  IconArrowBackUp,
} from "@tabler/icons-react";
import { useEffect, useReducer, useState } from "react";

type RichTextEditorProps = {
  initialContent: JSONContent;
  disabled?: boolean;
  error?: string;
  onChange: (content: JSONContent, plainText: string) => void;
};

export function RichTextEditor({ initialContent, disabled = false, error, onChange }: RichTextEditorProps) {
  const [, refreshToolbar] = useReducer((value: number) => value + 1, 0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
    ],
    content: initialContent,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-[220px] px-4 py-3 text-[14px] font-semibold leading-[1.6] text-[#153244] outline-none break-words [overflow-wrap:anywhere] [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-[20px] [&_h2]:font-extrabold [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:font-bold [&_a]:text-[#0072BC] [&_a]:underline [&_a]:decoration-[#8DE2D6] [&_a]:decoration-2 [&_a]:underline-offset-2",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON(), currentEditor.getText({ blockSeparator: "\n\n" }));
      refreshToolbar();
    },
    onSelectionUpdate: refreshToolbar,
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return <div className="h-[280px] animate-pulse rounded-[8px] bg-[#EEF2F4]" />;

  const selectionEmpty = editor.state.selection.empty;
  const openLinkEditor = () => {
    setLinkValue(editor.getAttributes("link").href ?? "");
    setLinkError("");
    setLinkOpen(true);
  };
  const saveLink = () => {
    try {
      const href = normalizeLink(linkValue);
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
      setLinkOpen(false);
      setLinkError("");
    } catch (linkValidationError) {
      setLinkError(linkValidationError instanceof Error ? linkValidationError.message : "La URL no es válida.");
    }
  };

  return (
    <div className={`overflow-hidden rounded-[8px] border bg-white ${error ? "border-[#C83232]" : "border-[#C7D1DA] focus-within:border-[#21AFC0] focus-within:ring-4 focus-within:ring-[#8DE2D6]/30"}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-[#DCE3E8] bg-[#F7F9FA] p-2" aria-label="Herramientas de formato">
        <ToolbarButton label="Párrafo" active={editor.isActive("paragraph")} disabled={disabled} onClick={() => editor.chain().focus().setParagraph().run()}><IconPilcrow size={17} /></ToolbarButton>
        <ToolbarButton label="Título" active={editor.isActive("heading", { level: 2 })} disabled={disabled} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><IconH2 size={18} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="Negrita" active={editor.isActive("bold")} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()}><IconBold size={17} /></ToolbarButton>
        <ToolbarButton label="Cursiva" active={editor.isActive("italic")} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()}><IconItalic size={17} /></ToolbarButton>
        <ToolbarButton label="Subrayado" active={editor.isActive("underline")} disabled={disabled} onClick={() => editor.chain().focus().toggleUnderline().run()}><IconUnderline size={17} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="Lista" active={editor.isActive("bulletList")} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()}><IconList size={18} /></ToolbarButton>
        <ToolbarButton label="Lista numerada" active={editor.isActive("orderedList")} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()}><IconListNumbers size={18} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="Insertar link" active={editor.isActive("link")} disabled={disabled || (selectionEmpty && !editor.isActive("link"))} onClick={openLinkEditor}><IconLink size={17} /></ToolbarButton>
        <ToolbarButton label="Quitar link" disabled={disabled || !editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}><IconUnlink size={17} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="Deshacer" disabled={disabled || !editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}><IconArrowBackUp size={17} /></ToolbarButton>
        <ToolbarButton label="Rehacer" disabled={disabled || !editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}><IconArrowForwardUp size={17} /></ToolbarButton>
      </div>
      {linkOpen ? (
        <div className="flex flex-col gap-2 border-b border-[#DCE3E8] bg-[#EAF6FD] p-3 sm:flex-row sm:items-start">
          <label className="min-w-0 flex-1 text-[11px] font-extrabold text-[#153244]">
            URL del enlace
            <input value={linkValue} onChange={(event) => { setLinkValue(event.target.value); setLinkError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveLink(); } }} placeholder="https://..." autoFocus className="mt-1 min-h-10 w-full rounded-[6px] border border-[#AFC4D2] bg-white px-3 text-[13px] font-semibold outline-none focus:border-[#0072BC]" />
            {linkError ? <span role="alert" className="mt-1 block text-[11px] text-[#C83232]">{linkError}</span> : null}
          </label>
          <div className="flex gap-2 sm:pt-[18px]">
            <button type="button" onClick={() => setLinkOpen(false)} className="min-h-10 rounded-[6px] border border-[#AFC4D2] bg-white px-3 text-[12px] font-extrabold">Cancelar</button>
            <button type="button" onClick={saveLink} className="min-h-10 rounded-[6px] bg-[#0072BC] px-3 text-[12px] font-extrabold text-white">Aplicar link</button>
          </div>
        </div>
      ) : null}
      <EditorContent editor={editor} />
      {error ? <p role="alert" className="border-t border-[#F0B8B8] bg-[#FFF4F4] px-4 py-2 text-[11px] font-bold text-[#C83232]">{error}</p> : null}
    </div>
  );
}

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={active} disabled={disabled} onClick={onClick} className={`inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-[5px] px-2 text-[11px] font-extrabold transition disabled:cursor-not-allowed disabled:opacity-35 ${active ? "bg-[#153244] text-white" : "text-[#153244] hover:bg-[#E4EBF0]"}`}>{children}<span className="hidden xl:inline">{label === "Párrafo" || label === "Título" ? label : ""}</span></button>;
}

function ToolbarDivider() {
  return <span className="mx-1 h-6 w-px bg-[#CDD7DE]" aria-hidden="true" />;
}

function normalizeLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Ingresá una URL.");
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(candidate);
  if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) throw new Error("Usá un enlace web o de correo válido.");
  return parsed.toString();
}
