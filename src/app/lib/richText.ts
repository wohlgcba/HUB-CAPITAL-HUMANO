import type { JSONContent } from "@tiptap/react";

export const emptyRichTextDocument: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function legacyTextToRichText(value: string | null | undefined): JSONContent {
  const text = value?.trim();
  if (!text) return emptyRichTextDocument;

  return {
    type: "doc",
    content: text.split(/\n{2,}/).map((paragraph) => ({
      type: "paragraph",
      content: paragraph.split("\n").flatMap((line, index) => [
        ...(index > 0 ? [{ type: "hardBreak" }] : []),
        ...(line ? [{ type: "text", text: line }] : []),
      ]),
    })),
  };
}

export function richTextToPlainText(content: JSONContent): string {
  return readNode(content).trim();
}

export function hasRichTextContent(content: JSONContent): boolean {
  return richTextToPlainText(content).length > 0;
}

function readNode(node: JSONContent): string {
  if (typeof node.text === "string") return node.text;
  if (node.type === "hardBreak") return "\n";
  const separator = ["paragraph", "heading", "listItem"].includes(node.type ?? "") ? "\n" : "";
  return `${(node.content ?? []).map(readNode).join("")}${separator}`;
}
