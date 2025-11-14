// src/app/[lang]/credits/page.tsx

import MarkdownContent from '@/components/MarkdownContent';

// On utilise 'any' pour le patch
interface CreditsPageProps {
  params: any;
}

// La page doit être 'async' pour pouvoir utiliser 'await'
export default async function CreditsPage({ params }: CreditsPageProps) {
  const resolvedParams = await params;

  return (
    <div className="container mx-auto p-8 text-gray-300">
      {/* 
        On appelle notre composant spécialisé 'MarkdownContent'.
        - Il est 'async' et s'occupe de lire le fichier.
        - Il utilise 'ReactMarkdown' à l'intérieur.
        - On lui dit simplement quel dossier de contenu utiliser.
      */}
      <MarkdownContent contentFolder="credits" lang={resolvedParams.lang} />
    </div>
  );
}
