// src/app/[lang]/credits/page.tsx

import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
// On importe la fonction de style depuis notre fichier
import { getCustomMDXComponents } from '@/mdx-components';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

interface CreditsPageProps {
  params: any;
}

export default async function CreditsPage({ params }: CreditsPageProps) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const defaultLocale = 'fr-CH';

  const getMarkdownContent = async (locale: string) => {
    const filePath = path.join(process.cwd(), 'content', 'credits', `${locale}.mdx`);
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
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return (
    <div className="container mx-auto p-8">
      <article>
        {content}
      </article>
      <div className="mt-6 flex flex-col items-center justify-center">
          <Image 
            src="/icon.png" 
            alt="Logo No Pasaran"
            width={100} 
            height={100}
            className="mb-2"
          />
          <p className="text-center text-sm text-gray-200">Rebel Suisse</p>
      </div>
    </div>
  );
}
