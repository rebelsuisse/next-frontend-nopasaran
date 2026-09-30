// Removes the Markdown marks of a field; line breaks are kept.
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n?/g, '\n')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links: keep their text
    .replace(/<[^>]+>/g, '') // HTML tags
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '') // headings
    .replace(/^[ \t]*>[ \t]?/gm, '') // quotes
    .replace(/\*\*|__|~~|`|\*/g, '') // emphasis and code marks
    .replace(/(^|[\s(«"'])_(?=\S)/g, '$1') // _italics_: opening mark
    .replace(/(\S)_(?=[\s)»"'.,;:!?]|$)/g, '$1'); // _italics_: closing mark
}

/**
 * Plain-text excerpt of a Markdown field, cut at a word boundary: for places
 * that cannot render Markdown (link previews, meta descriptions).
 */
export function plainTextExcerpt(markdown: string | null | undefined, maxLength: number): string {
  if (!markdown) return '';

  const text = stripMarkdown(markdown).replace(/\s+/g, ' ').trim();

  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Full plain text of a Markdown field, paragraph by paragraph: for places
 * that show the whole text but cannot render Markdown (image slides,
 * captions). Line breaks inside a paragraph are kept, as the site shows
 * them; list items become "• " lines.
 */
export function plainTextParagraphs(markdown: string | null | undefined): string[] {
  if (!markdown) return [];

  return stripMarkdown(markdown.replace(/^[ \t]*[-*+][ \t]+/gm, '• '))
    .split(/\n[ \t]*\n/)
    .map(paragraph =>
      paragraph
        .split('\n')
        .map(line => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
    )
    .filter(Boolean);
}

export function formatText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Remplace un espace suivi d'une ponctuation double par un espace insécable (\u00A0)
  // Signes traités : ! ? : ; »
  // Traite aussi le guillemet ouvrant « suivi d'un espace
  return text
    .replace(/\s+([?!:;»])/g, '\u00A0$1') // Espace avant ponctuation
    .replace(/([«])\s+/g, '$1\u00A0');     // Espace après guillemet ouvrant
}
