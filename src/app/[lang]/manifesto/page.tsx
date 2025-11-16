// src/app/[lang]/manifesto/page.tsx

import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
// On importe la fonction de style depuis notre fichier
import { getCustomMDXComponents } from '@/mdx-components';

interface ManifestoPageProps {
  params: any;
}

export default async function ManifestoPage({ params }: ManifestoPageProps) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const defaultLocale = 'fr-CH';

  const getMarkdownContent = async (locale: string) => {
    const filePath = path.join(process.cwd(), 'content', 'manifesto', `${locale}.mdx`);
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return null;
    }
  };

  let source = await getMarkdownContent(lang);
  if (!source) {
    source = await getMarkdownContent(defaultLocale);
  }

  if (!source) {
    return notFound();
  }

  // On compile le MDX EN LUI PASSANT NOS COMPOSANTS PERSONNALISÉS
  const { content } = await compileMDX({
    source: source,
    components: getCustomMDXComponents(), // On appelle la nouvelle fonction
    options: {
      parseFrontmatter: true,
    },
  });

  return (
    <div className="container mx-auto p-8">
      <article>
        {content}
      </article>
    </div>
  );
}