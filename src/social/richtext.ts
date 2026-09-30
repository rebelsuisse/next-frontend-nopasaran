// src/social/richtext.ts

import MarkdownIt from 'markdown-it';
import { formatText } from '@/lib/format';
import type { Face } from './metrics';

/**
 * The text of a fiche for the Instagram images, formatted as on the site:
 * paragraphs and line breaks, subheadings, italics, bold, links, lists and
 * quotes, parsed with the same Markdown options as src/lib/markdown.ts.
 *
 * Text is cut into words that keep their style, so that slides.ts can wrap
 * them exactly as the renderer will.
 */

const md = new MarkdownIt({ html: false, breaks: true, linkify: true });
type MarkdownToken = ReturnType<typeof md.parse>[number];

// Part of a word in one style ("_«Jede_ Liebe»": "«Jede" italic, then "»"...).
export interface Segment {
  text: string;
  face: Face;
  link: boolean;
}

export type Word = Segment[];

// A word, or a line break inside a block.
export type Piece = Word | 'break';

export interface Block {
  // section: a heading of the fiche's page ("Conséquences").
  kind: 'section' | 'heading' | 'paragraph' | 'item' | 'quote';
  pieces: Piece[];
  // List item: "•" or "1.". None on the rest of an item cut between images.
  marker?: string;
}

export function faceOf(bold: boolean, italic: boolean): Face {
  if (bold) return italic ? '700i' : 700;
  return italic ? '500i' : 500;
}

interface Run {
  text: string;
  face: Face;
  link: boolean;
}

function toPieces(runs: Run[]): Piece[] {
  const pieces: Piece[] = [];
  let word: Word = [];
  const endWord = () => {
    if (word.length > 0) pieces.push(word);
    word = [];
  };

  for (const run of runs) {
    for (const part of run.text.split(/([ \t\n])/)) {
      if (part === '\n') {
        endWord();
        pieces.push('break');
      } else if (part === ' ' || part === '\t') {
        endWord();
      } else if (part) {
        word.push({ text: part, face: run.face, link: run.link });
      }
    }
  }
  endWord();
  return trimBreaks(pieces);
}

// No line break at the start or the end of a block.
export function trimBreaks(pieces: Piece[]): Piece[] {
  let start = 0;
  let end = pieces.length;
  while (start < end && pieces[start] === 'break') start++;
  while (end > start && pieces[end - 1] === 'break') end--;
  return pieces.slice(start, end);
}

function inlineRuns(children: MarkdownToken[], bold: boolean, italic: boolean): Run[] {
  const runs: Run[] = [];
  let strong = 0;
  let em = 0;
  let link = 0;
  for (const token of children) {
    switch (token.type) {
      case 'strong_open': strong++; break;
      case 'strong_close': strong--; break;
      case 'em_open': em++; break;
      case 'em_close': em--; break;
      case 'link_open': link++; break;
      case 'link_close': link--; break;
      case 'softbreak':
      case 'hardbreak':
        runs.push({ text: '\n', face: 500, link: false });
        break;
      case 'text':
      case 'code_inline':
        runs.push({ text: token.content, face: faceOf(bold || strong > 0, italic || em > 0), link: link > 0 });
        break;
    }
  }
  return runs;
}

export function textBlock(kind: Block['kind'], text: string, face: Face): Block {
  return { kind, pieces: toPieces([{ text, face, link: false }]) };
}

// Blocks of a Markdown field. Nested lists are shown at the same level.
export function markdownBlocks(markdown: string | null | undefined): Block[] {
  if (!markdown) return [];

  const blocks: Block[] = [];
  const lists: { ordered: boolean; next: number }[] = [];
  let quote = 0;
  let heading = false;
  let marker: string | undefined;

  for (const token of md.parse(formatText(markdown), {})) {
    switch (token.type) {
      case 'bullet_list_open':
        lists.push({ ordered: false, next: 1 });
        break;
      case 'ordered_list_open':
        lists.push({ ordered: true, next: Number(token.attrGet('start') ?? 1) });
        break;
      case 'bullet_list_close':
      case 'ordered_list_close':
        lists.pop();
        break;
      case 'list_item_open': {
        const list = lists[lists.length - 1];
        marker = list.ordered ? `${list.next++}.` : '•';
        break;
      }
      case 'blockquote_open': quote++; break;
      case 'blockquote_close': quote--; break;
      case 'heading_open': heading = true; break;
      case 'heading_close': heading = false; break;
      case 'inline': {
        // Quotes are in italics, as on the site.
        const pieces = toPieces(inlineRuns(token.children ?? [], heading, quote > 0));
        if (pieces.length === 0) break;
        if (heading) {
          blocks.push({ kind: 'heading', pieces });
        } else if (lists.length > 0) {
          blocks.push({ kind: 'item', pieces, marker });
          marker = undefined;
        } else {
          blocks.push({ kind: quote > 0 ? 'quote' : 'paragraph', pieces });
        }
        break;
      }
    }
  }
  return blocks;
}
