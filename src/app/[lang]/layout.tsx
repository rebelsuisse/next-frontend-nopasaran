
// src/app/[lang]/layout.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from 'next-intl/server';

export default async function LangLayout({ children, params }: any) {
  const resolvedParams = await params;
  const t = await getTranslations('Header');

  return (
    <>
      <Header
        lang={resolvedParams.lang}
        searchLabel={t('search')}
        manifestoLabel={t('manifesto')}
        creditsLabel={t('credits')}
      />
      <main className="min-h-screen bg-gray-900 text-gray-200">
        {children}
      </main>
      <Footer lang={resolvedParams.lang} />
    </>
  );
}
