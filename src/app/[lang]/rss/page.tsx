// src/app/[lang]/rss/page.tsx

import { getTranslations } from 'next-intl/server';
import { FaRss } from 'react-icons/fa';
import FeedUrlCopy from '@/components/FeedUrlCopy';
import { localeAlternates } from '@/lib/seo';

const BASE_URL = 'https://www.nopasaran.ch';

interface RssPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: RssPageProps) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'RssPage' });

  return {
    title: `${t('title')} | No pasarán`,
    description: t('description'),
    alternates: localeAlternates(lang, '/rss'),
  };
}

// L'icône RSS du footer mène ici plutôt qu'au flux lui-même : un clic sur
// /feed.xml affiche du XML brut, incompréhensible pour la plupart des
// visiteurs. Les lecteurs RSS, eux, trouvent le flux via le
// <link rel="alternate"> du layout.
export default async function RssPage({ params }: RssPageProps) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'RssPage' });

  const feedUrl = `${BASE_URL}/${lang}/feed.xml`;
  const encodedFeedUrl = encodeURIComponent(feedUrl);

  const readers = [
    { name: 'Feedly', href: `https://feedly.com/i/subscription/feed/${encodedFeedUrl}` },
    { name: 'Inoreader', href: `https://www.inoreader.com/?add_feed=${encodedFeedUrl}` },
  ];

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 max-w-2xl">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-bold text-white mb-4">
          <FaRss className="text-orange-500" />
          {t('title')}
        </h1>
        <p className="text-gray-300 mb-8 text-lg text-center">
          {t('description')}
        </p>

        <h2 className="text-xl font-semibold text-gray-100 mb-3">{t('feedUrlTitle')}</h2>
        <p className="text-gray-400 mb-4">{t('feedUrlHelp')}</p>
        <FeedUrlCopy url={feedUrl} labels={{ copy: t('copy'), copied: t('copied') }} />

        <h2 className="text-xl font-semibold text-gray-100 mt-10 mb-3">{t('readersTitle')}</h2>
        <div className="flex flex-wrap gap-3">
          {readers.map(reader => (
            <a
              key={reader.name}
              href={reader.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-full transition-colors"
            >
              {reader.name}
            </a>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-10">
          {t('rawFeedPrefix')}{' '}
          <a href={`/${lang}/feed.xml`} className="underline hover:text-gray-300">
            {t('rawFeedLink')}
          </a>
        </p>
      </div>
    </div>
  );
}
