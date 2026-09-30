// src/social/slides.ts

import { formatText, plainTextParagraphs } from '@/lib/format';
import type { Incident, StrapiMedia } from '@/types';
import { textWidth, type Face } from './metrics';
import { markdownBlocks, textBlock, trimBreaks, type Block, type Piece, type Word } from './richtext';

/**
 * Layout of the Instagram images of a fiche, 1080×1350 each (4:5, the
 * tallest format the feed shows whole). A fiche is posted as a carousel:
 * the cover, then its text, then its evidence images, one per image.
 *
 * This module decides what goes on which image; card.tsx draws them. It is
 * shared with the publisher, which needs the list of images beforehand.
 * The renderer cannot measure text in advance: text is wrapped here with
 * the widths of the font (metrics.ts), as the renderer will wrap it.
 */

export const IMAGE = { width: 1080, height: 1350 };
// Instagram lays its buttons over the edges of an image: nothing important
// goes near them.
export const MARGIN = { top: 120, bottom: 110, side: 80 };
export const CONTENT_WIDTH = IMAGE.width - 2 * MARGIN.side;
const MAX_SLIDES = 10; // Instagram carousel limit
// Room left for what the widths do not account for (kerning, rounding).
const WIDTH_SAFETY = 0.98;

// Small logo and address at the bottom of every image but the closing one.
export const SIGNATURE = { height: 70, logo: 52 };

// Cover: the picture has the same size and position whatever the title.
export const COVER = {
  badgesHeight: 66,
  badgePadding: 32, // left and right, each
  badgeGap: 24,
  textBoxTop: 20, // below the badges
  textBoxHeight: 376, // the title, centered vertically
  titleLineHeight: 1.1,
  pictureTop: 30, // below the title
  pictureSize: 400,
  subjectTop: 22, // below the picture: "Name (party - canton)", then the role
  // Then the signature, at the bottom, as on the other images.
};

// Text and evidence images: a header line, a box, the signature.
export const PAGE = {
  headerHeight: 50,
  headerLetterSpacing: 4,
  gap: 36,
};
export const PAGE_BOX = {
  width: CONTENT_WIDTH,
  height: IMAGE.height - MARGIN.top - MARGIN.bottom - PAGE.headerHeight - SIGNATURE.height - 2 * PAGE.gap,
};

// Text of the fiche, in em of its font size.
export const TEXT = {
  lineHeight: 1.45,
  paragraphGap: 0.7,
  itemGap: 0.35, // between two list items
  sectionScale: 0.7, // "Conséquences"
  headingScale: 1.1, // subheadings of the text
  itemIndent: 1.5, // room for "•" or "1."
  quoteBorder: 4, // px
  quoteIndent: 0.9,
};

const TITLE_SIZES = [80, 76, 72, 68, 64, 60, 56, 52, 48];
const BADGE_SIZES = [34, 30, 26, 22];
// Text as large as it fits on one image; below the last size, the text
// continues on the next images, a little smaller if that saves one.
const TEXT_SIZES = [42, 38, 34];
const CONTINUED_TEXT_SIZES = [34, 32];

// ---- Measuring ----

function wordWidth(word: Word, fontSize: number): number {
  return word.reduce((sum, segment) => sum + textWidth(segment.text, fontSize, segment.face), 0);
}

// Gap between two words: the renderer lays words out one by one.
export function wordGap(fontSize: number): number {
  return textWidth(' ', fontSize, 500);
}

// Lines taken by words wrapped in a box of the given width. A word too long
// for a line is broken over several lines.
function lineCount(pieces: Piece[], fontSize: number, width: number): number {
  const available = width * WIDTH_SAFETY;
  const gap = wordGap(fontSize);
  let lines = 1;
  let used = -1; // -1: nothing on the line yet
  for (const piece of pieces) {
    if (piece === 'break') {
      lines++;
      used = -1;
      continue;
    }
    const pieceWidth = wordWidth(piece, fontSize);
    if (used >= 0 && used + gap + pieceWidth <= available) {
      used += gap + pieceWidth;
      continue;
    }
    if (used >= 0) lines++;
    lines += Math.max(0, Math.ceil(pieceWidth / available) - 1);
    used = pieceWidth > available ? pieceWidth % available : pieceWidth;
  }
  return lines;
}

const plainWords = (text: string, face: Face): Piece[] =>
  text.split(/\s+/).filter(Boolean).map(word => [{ text: word, face, link: false }]);

function fitsOneLine(text: string, fontSize: number, face: Face, letterSpacing = 0): boolean {
  return textWidth(text, fontSize, face, letterSpacing) <= CONTENT_WIDTH * WIDTH_SAFETY;
}

// ---- Cover ----

// The largest title that fits its box, never breaking a word (long German
// compounds included).
export function coverTitleSize(title: string): number {
  const words = title.split(/\s+/);
  return (
    TITLE_SIZES.find(
      size =>
        words.every(word => fitsOneLine(word, size, 900)) &&
        lineCount(plainWords(title, 900), size, CONTENT_WIDTH) * size * COVER.titleLineHeight <= COVER.textBoxHeight
    ) ?? TITLE_SIZES[TITLE_SIZES.length - 1]
  );
}

// Category and date badges share one line.
export function coverBadgeSize(category: string | null, date: string): number {
  return (
    BADGE_SIZES.find(size => {
      const padding = 2 * COVER.badgePadding;
      const categoryWidth = category
        ? textWidth(category.toUpperCase(), size, 700, 2) + padding + COVER.badgeGap
        : 0;
      return categoryWidth + textWidth(date, size, 500) + padding <= CONTENT_WIDTH * WIDTH_SAFETY;
    }) ?? BADGE_SIZES[BADGE_SIZES.length - 1]
  );
}

// "Name (party - canton)" under the picture, on one line.
export function coverNameSize(name: string, suffix: string): number {
  const fits = (size: number) =>
    textWidth(name, size, 700) + (suffix ? textWidth(` ${suffix}`, size, 500) : 0) <= CONTENT_WIDTH * WIDTH_SAFETY;
  return [42, 40, 38, 36, 34, 32, 30, 28].find(fits) ?? 28;
}

// The subject's role, below the name, on one line.
export function coverRoleSize(role: string): number {
  return [36, 34, 32, 30, 28, 26, 24].find(size => fitsOneLine(role, size, 500)) ?? 24;
}

// Closing image: "À lire sur nopasaran.ch", on one line.
export function endLabelSize(label: string): number {
  return [60, 56, 52, 48, 44, 40].find(size => fitsOneLine(label, size, 900)) ?? 40;
}

// A subject's name on one line: smaller when it is long.
export function subjectSize(name: string, max: number, letterSpacing: number): number {
  for (let size = max; size > 20; size -= 2) {
    if (fitsOneLine(name.toUpperCase(), size, 700, letterSpacing)) return size;
  }
  return 20;
}

// ---- Text ----

export interface TextSection {
  heading: string | null;
  paragraphs: string[];
}

export interface TextPage {
  fontSize: number;
  blocks: Block[];
}

// Plain text of a fiche, for the caption: the description, then the
// consequences under their heading.
export function textSections(incident: Incident, consequencesTitle: string): TextSection[] {
  return [
    { heading: null, paragraphs: plainTextParagraphs(incident.description).map(formatText) },
    { heading: consequencesTitle, paragraphs: plainTextParagraphs(incident.consequence).map(formatText) },
  ].filter(section => section.paragraphs.length > 0);
}

// Formatted text of a fiche, for the images, as the site shows it.
export function textBlocks(incident: Incident, consequencesTitle: string): Block[] {
  const consequence = markdownBlocks(incident.consequence);
  return [
    ...markdownBlocks(incident.description),
    ...(consequence.length > 0 ? [textBlock('section', consequencesTitle, 700), ...consequence] : []),
  ];
}

// Font size of a block, relative to the text.
export function blockScale(block: Block): number {
  if (block.kind === 'section') return TEXT.sectionScale;
  if (block.kind === 'heading') return TEXT.headingScale;
  return 1;
}

// Width left to the words of a block (lists and quotes are indented).
export function blockIndent(block: Block, fontSize: number): number {
  if (block.kind === 'item') return fontSize * TEXT.itemIndent;
  if (block.kind === 'quote') return TEXT.quoteBorder + fontSize * TEXT.quoteIndent;
  return 0;
}

// Space above a block, below the previous one.
export function blockGap(previous: Block | undefined, block: Block, fontSize: number): number {
  if (!previous) return 0;
  const listGoesOn = previous.kind === 'item' && block.kind === 'item';
  return fontSize * (listGoesOn ? TEXT.itemGap : TEXT.paragraphGap);
}

function blockHeight(block: Block, fontSize: number): number {
  const size = fontSize * blockScale(block);
  return lineCount(block.pieces, size, PAGE_BOX.width - blockIndent(block, fontSize)) * size * TEXT.lineHeight;
}

function fitsPage(blocks: Block[], fontSize: number): boolean {
  const height = blocks.reduce(
    (sum, block, index) => sum + blockGap(blocks[index - 1], block, fontSize) + blockHeight(block, fontSize),
    0
  );
  return height <= PAGE_BOX.height;
}

// Where a block may continue on the next image: after a sentence, or at a
// line break.
function sentences(pieces: Piece[]): Piece[][] {
  const groups: Piece[][] = [[]];
  pieces.forEach((piece, index) => {
    groups[groups.length - 1].push(piece);
    const text = piece === 'break' ? '' : piece.map(segment => segment.text).join('');
    const ends = piece === 'break' || /[.!?…][»")]?$/.test(text);
    if (ends && index < pieces.length - 1) groups.push([]);
  });
  return groups;
}

// Fills the images one after the other, cutting blocks between sentences.
// Headings stay with the start of what follows them.
function paginate(blocks: Block[], fontSize: number): Block[][] {
  const pages: Block[][] = [[]];
  const current = () => pages[pages.length - 1];

  blocks.forEach((block, index) => {
    if (block.kind === 'section' || block.kind === 'heading') {
      const next = blocks[index + 1];
      const start = next ? [{ ...next, pieces: trimBreaks(sentences(next.pieces)[0]) }] : [];
      if (current().length > 0 && !fitsPage([...current(), block, ...start], fontSize)) pages.push([]);
      current().push(block);
      return;
    }

    let rest = sentences(block.pieces);
    let first = true;
    while (rest.length > 0) {
      const part = (count: number): Block => ({
        ...block,
        pieces: trimBreaks(rest.slice(0, count).flat()),
        marker: first ? block.marker : undefined,
      });
      let taken = 0;
      while (taken < rest.length && fitsPage([...current(), part(taken + 1)], fontSize)) taken++;
      if (taken === 0 && current().length > 0) {
        pages.push([]);
        continue;
      }
      // A sentence longer than a whole image is cut off by the renderer.
      taken = Math.max(taken, 1);
      current().push(part(taken));
      rest = rest.slice(taken);
      first = false;
      if (rest.length > 0) pages.push([]);
    }
  });
  return pages.filter(page => page.length > 0);
}

export function textPages(blocks: Block[]): TextPage[] {
  if (blocks.length === 0) return [];

  for (const fontSize of TEXT_SIZES) {
    if (fitsPage(blocks, fontSize)) return [{ fontSize, blocks }];
  }
  // As few images as possible, then the largest text.
  const options = CONTINUED_TEXT_SIZES.map(fontSize => ({ fontSize, pages: paginate(blocks, fontSize) }));
  const fewest = Math.min(...options.map(option => option.pages.length));
  const { fontSize, pages } = options.find(option => option.pages.length === fewest)!;
  return pages.map(page => ({ fontSize, blocks: page }));
}

// ---- Slides ----

export function evidenceImages(incident: Incident): StrapiMedia[] {
  return (incident.evidence_image ?? []).filter(
    image => image?.url && (!image.mime || image.mime.startsWith('image/'))
  );
}

// Closing image of every carousel, the same for all fiches.
export const END_SLIDE = 'end';

/**
 * Images of the carousel of a fiche, as ids of the image route:
 * "cover", "text-1"…, "evidence-1"…, "end".
 */
export function slideIds(incident: Incident, consequencesTitle: string): string[] {
  const text = Math.min(textPages(textBlocks(incident, consequencesTitle)).length, MAX_SLIDES - 2);
  const evidence = Math.min(evidenceImages(incident).length, MAX_SLIDES - 2 - text);
  return [
    'cover',
    ...Array.from({ length: text }, (_, i) => `text-${i + 1}`),
    ...Array.from({ length: evidence }, (_, i) => `evidence-${i + 1}`),
    END_SLIDE,
  ];
}
