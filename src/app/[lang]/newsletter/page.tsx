// src/app/[lang]/newsletter/page.tsx

import { getTranslations } from 'next-intl/server';
import NewsletterForm from '@/components/NewsletterForm';

// 1. On définit une interface propre pour les props
interface NewsletterPageProps {
  params: Promise<{ lang: string }>;
}

// 2. Correction de generateMetadata
export async function generateMetadata({ params }: NewsletterPageProps) {
  // ON "AWAIT" LES PARAMS AVANT DE LES UTILISER
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  const t = await getTranslations({ locale: lang, namespace: 'NewsletterPage' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

// 3. Correction du composant principal
export default async function NewsletterPage({ params }: NewsletterPageProps) {
  // ICI AUSSI, ON "AWAIT" LES PARAMS
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  const t = await getTranslations({ locale: lang, namespace: 'NewsletterPage' });

  const labels = {
    title: t('title'),
    description: t('description'),
    emailPlaceholder: t('emailPlaceholder'),
    buttonLabel: t('buttonLabel'),
    successMessage: t('successMessage'),
    errorMessage: t('errorMessage'),
    privacyNote: t('privacyNote'),
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 max-w-2xl text-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h1 className="text-3xl font-bold text-white mb-4">{labels.title}</h1>
        <p className="text-gray-300 mb-8 text-lg">
          {labels.description}
        </p>
        
        {/* On passe bien la langue résolue au formulaire */}
        <NewsletterForm labels={labels} lang={lang} />
        
        <p className="text-xs text-gray-500 mt-6">
          {labels.privacyNote}
        </p>
      </div>
    </div>
  );
}