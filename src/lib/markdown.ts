// src/lib/markdown.ts
import MarkdownIt from 'markdown-it';

// Rendu Markdown des champs d'incident (description, conséquence), partagé par
// la page d'incident et le flux RSS pour qu'ils affichent le même texte.
//
// html: false -- le HTML brut d'un champ Strapi est échappé et s'affiche comme
// du texte au lieu d'être injecté tel quel dans la page. Avec html: true, un
// seul compte éditeur compromis suffisait pour un XSS stocké servi à tous les
// visiteurs. Aucun incident publié n'utilise de HTML (vérifié le 29 sept. 2026
// sur les 2 792 incidents des quatre langues) : le rendu reste identique.
// Les liens javascript:, vbscript:, file: et data: sont déjà refusés par
// markdown-it (validateLink).
const md = new MarkdownIt({
  html: false,
  breaks: true,     // Convert '\n' in paragraphs into <br>
  linkify: true,    // Autoconvert URL-like text to links
});

export function renderMarkdown(source: string | null | undefined): string {
  return source ? md.render(source) : '';
}
