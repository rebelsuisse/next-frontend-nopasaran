/**
 * Plain-text excerpt of a Markdown field, cut at a word boundary: for places
 * that cannot render Markdown (link previews, meta descriptions).
 */
export function plainTextExcerpt(markdown: string | null | undefined, maxLength: number): string {
  if (!markdown) return '';

  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links: keep their text
    .replace(/<[^>]+>/g, '') // HTML tags
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/^\s*>\s?/gm, '') // quotes
    .replace(/\*\*|__|~~|`|\*/g, '') // emphasis and code marks
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
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
