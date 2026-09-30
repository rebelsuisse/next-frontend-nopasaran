// src/app/[lang]/privacy/page.tsx

import fs from 'fs/promises';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getCustomMDXComponents } from '@/mdx-components';
import { DEFAULT_LOCALE, localeAlternates } from '@/lib/seo';

// Privacy policy. Also required by Meta: its URL must be set before the
// social publishing app can switch to Live mode.

const TITLES: Record<string, string> = {
  'fr-CH': 'Politique de confidentialité',
  'de-CH': 'Datenschutzerklärung',
  'it-CH': 'Informativa sulla privacy',
  en: 'Privacy policy',
};

interface PrivacyPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PrivacyPageProps) {
  const { lang } = await params;
  return {
    title: `${TITLES[lang] ?? TITLES[DEFAULT_LOCALE]} | No pasarán`,
    alternates: localeAlternates(lang, '/privacy'),
  };
}

async function readContent(locale: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(process.cwd(), 'content', 'privacy', `${locale}.mdx`), 'utf-8');
  } catch {
    return null;
  }
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { lang } = await params;
  const source = (await readContent(lang)) ?? (await readContent(DEFAULT_LOCALE)) ?? '';

  const { content } = await compileMDX({
    source,
    components: getCustomMDXComponents(),
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });

  return (
    <div className="container mx-auto p-8">
      <article>{content}</article>
    </div>
  );
}
