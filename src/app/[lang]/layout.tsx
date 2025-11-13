// src/app/[lang]/layout.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from 'next-intl/server';

export default async function LangLayout({ children, params }: any) {
  const resolvedParams = await params;
  // On récupère la fonction 't' pour le namespace 'Header'
  const t = await getTranslations('Header');

  return (
    <>
      {/* On passe la langue ET la fonction 't' en prop */}
      <Header lang={resolvedParams.lang} t={t} />
      <main className="min-h-screen bg-gray-900 text-gray-200">
        {children}
      </main>
      <Footer lang={resolvedParams.lang} />
    </>
  );
}
