// src/app/[lang]/manifesto/page.tsx

import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import ShareButton from '@/components/ShareButton';
import { getTranslations } from 'next-intl/server';
// On importe la fonction de style depuis notre fichier
import { getCustomMDXComponents } from '@/mdx-components';
import remarkGfm from 'remark-gfm';

interface ManifestoPageProps {
  params: any;
}

async function getPageTranslations(locale: string) {
  const t = await getTranslations({locale, namespace: 'ManifestoPage'});
  return {
    shareTitle: t('shareTitle'),
    shareText: t('shareText'),
    shareLabel: t('shareLabel'),
    copiedLabel: t('copiedLabel'),
  };
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

  const translations = await getPageTranslations(lang);

  // On compile le MDX et on extrait le 'frontmatter' en plus du 'content'
  const { content, frontmatter } = await compileMDX<{ title?: string; datePublished?: string }>({
    source: source,
    components: getCustomMDXComponents(),
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  // CRÉER L'OBJET JSON-LD POUR L'ARTICLE
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article', // On utilise 'Article'
    headline: frontmatter?.title || 'Manifesto',
    // On peut lire la date depuis le frontmatter pour plus de précision
    datePublished: frontmatter?.datePublished || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Rebel Suisse',
      url: 'https://www.instagram.com/rebel_suisse/',
    },
    publisher: {
      '@type': 'Organization',
      name: 'No pasarán - The Wall of Shame',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.nopasaran.ch/logo.png',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="container mx-auto p-8">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 pb-4 border-b border-gray-700">
          <h1 className="text-4xl font-bold">
            {frontmatter?.title || 'Manifesto'}
          </h1>
          <div className="flex-shrink-0">
            <ShareButton
              title={translations.shareTitle}
              text={translations.shareText}
              labels={{ share: translations.shareLabel, copied: translations.copiedLabel }}
            />
          </div>
        </header>
        <article>
          {content}
        </article>
      </div>
    </>
  );
}