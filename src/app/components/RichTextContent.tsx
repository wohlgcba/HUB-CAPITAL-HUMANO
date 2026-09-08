import type { JSONContent } from "@tiptap/react";
import type { ReactNode } from "react";
import { richTextToPlainText } from "../lib/richText";

type RichTextContentProps = {
  content: JSONContent | null;
  fallback?: string | null;
  emptyText?: string;
  className?: string;
};

export function RichTextContent({ content, fallback, emptyText = "Sin contenido.", className = "" }: RichTextContentProps) {
  if (!content || !richTextToPlainText(content)) {
    return <p className={`break-words [overflow-wrap:anywhere] ${className}`}>{fallback || emptyText}</p>;
  }

  return (
    <div className={`min-w-0 break-words [overflow-wrap:anywhere] ${className}`}>
      {(content.content ?? []).map((node, index) => renderNode(node, `root-${index}`))}
    </div>
  );
}

function renderNode(node: JSONContent, key: string): ReactNode {
  const children = (node.content ?? []).map((child, index) => renderNode(child, `${key}-${index}`));

  switch (node.type) {
    case "text":
      return applyMarks(node.text ?? "", node.marks ?? [], key);
    case "paragraph":
      return <p key={key} className="mb-3 last:mb-0">{children.length ? children : <br />}</p>;
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      if (level === 3) return <h3 key={key} className="mb-2 mt-5 text-[17px] font-extrabold leading-tight text-[#153244]">{children}</h3>;
      return <h2 key={key} className="mb-2 mt-5 text-[20px] font-extrabold leading-tight text-[#061947]">{children}</h2>;
    }
    case "bulletList":
      return <ul key={key} className="mb-3 list-disc space-y-1 pl-6">{children}</ul>;
    case "orderedList":
      return <ol key={key} className="mb-3 list-decimal space-y-1 pl-6">{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "hardBreak":
      return <br key={key} />;
    default:
      return <span key={key}>{children}</span>;
  }
}

function applyMarks(text: string, marks: NonNullable<JSONContent["marks"]>, key: string) {
  let content: ReactNode = text;
  marks.forEach((mark, index) => {
    const markKey = `${key}-mark-${index}`;
    if (mark.type === "bold") content = <strong key={markKey}>{content}</strong>;
    if (mark.type === "italic") content = <em key={markKey}>{content}</em>;
    if (mark.type === "underline") content = <u key={markKey}>{content}</u>;
    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
      content = <a key={markKey} href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-[#0072BC] underline decoration-[#8DE2D6] decoration-2 underline-offset-2 hover:text-[#00518A]">{content}<span className="sr-only"> (abre en una pestaña nueva)</span></a>;
    }
  });
  return <span key={key}>{content}</span>;
}
