// src/app/[lang]/manifesto/page.tsx

import MarkdownContent from '@/components/MarkdownContent';

interface ManifestoPageProps {
  params: { lang: string };
}

export default function ManifestoPage({ params }: ManifestoPageProps) {
  return (
    <div className="container mx-auto p-8">
      {/* On appelle notre composant en lui disant quel dossier lire */}
      <MarkdownContent contentFolder="manifesto" lang={params.lang} />
    </div>
  );
}
