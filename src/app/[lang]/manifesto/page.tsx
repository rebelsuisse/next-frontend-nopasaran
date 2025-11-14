// src/app/[lang]/manifesto/page.tsx

import MarkdownContent from '@/components/MarkdownContent';

// On utilise 'any' pour le patch
interface ManifestoPageProps {
  params: any;
}

// La page doit être 'async' pour pouvoir utiliser 'await'
export default async function ManifestoPage({ params }: ManifestoPageProps) {
  const resolvedParams = await params;

  return (
    <div className="container mx-auto p-8 text-gray-300">
      {/* 
        On appelle notre composant spécialisé 'MarkdownContent'.
        - Il est 'async' et s'occupe de lire le fichier.
        - Il utilise 'ReactMarkdown' à l'intérieur.
        - On lui dit simplement quel dossier de contenu utiliser.
      */}
      <MarkdownContent contentFolder="manifesto" lang={resolvedParams.lang} />
    </div>
  );
}
