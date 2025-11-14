// src/components/MarkdownContent.tsx

import fs from 'fs/promises';
import path from 'path';
import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  contentFolder: string;
  lang: string;
}

export default async function MarkdownContent({ contentFolder, lang }: MarkdownContentProps) {
  const defaultLocale = 'fr-CH';
  
  // Fonction pour lire un fichier Markdown
  const getMarkdownContent = async (locale: string) => {
    // On construit le chemin vers le fichier
    const filePath = path.join(process.cwd(), 'content', contentFolder, `${locale}.md`);
    try {
      // On essaie de lire le fichier
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      // Si le fichier n'existe pas, on retourne null
      return null;
    }
  };

  // On essaie de charger le contenu pour la langue demandée
  let content = await getMarkdownContent(lang);

  // Si le contenu n'existe pas pour cette langue, on se rabat sur la langue par défaut
  if (!content) {
    content = await getMarkdownContent(defaultLocale);
  }

  // Si même le contenu par défaut n'existe pas, on affiche un message d'erreur
  if (!content) {
    return <p className="text-red-500">Contenu non trouvé.</p>;
  }

  return (
    // La classe 'prose' de Tailwind va joliment styliser notre HTML
    <article className="prose prose-lg max-w-none prose-invert">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}