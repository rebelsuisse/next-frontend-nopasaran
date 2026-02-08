// src/app/[lang]/contact/page.tsx

import { getTranslations } from 'next-intl/server';
import ContactForm from '@/components/ContactForm';

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || "";

interface ContactPageProps {
  params: { lang: string } | Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: ContactPageProps) {
  const resolvedParams = await params;
  const t = await getTranslations({ locale: resolvedParams.lang, namespace: 'ContactPage' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${resolvedParams.lang}/contact`,
    },
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  // On attend toujours la résolution des params pour avoir la langue courante
  const resolvedParams = await params;
  
  // Récupération des traductions
  const t = await getTranslations({ locale: resolvedParams.lang, namespace: 'ContactPage' });

  // Préparation des labels pour le composant client
  const translations = {
    emailLabel: t('emailLabel'),
    messageLabel: t('messageLabel'),
    attachmentLabel: t('attachmentLabel'),
    sendButton: t('sendButton'),
    sending: t('sending'),
    successMessage: t('successMessage'),
    errorMessage: t('errorMessage'),
    emailPlaceholder: t('emailPlaceholder'),
    messagePlaceholder: t('messagePlaceholder'),
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 max-w-3xl">
      {/* Le lien de retour a été supprimé ici pour un design plus épuré */}

      <div className="bg-gray-700/50 rounded-xl shadow-2xl p-6 md:p-10 backdrop-blur-sm">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-gray-300 leading-relaxed">
            {t('intro')}
          </p>
        </div>

        {FORMSPREE_ID ? (
          <ContactForm translations={translations} formId={FORMSPREE_ID} />
        ) : (
          <div className="text-red-400 border border-red-500 p-4 rounded bg-red-900/20">
            <p><strong>Configuration Error:</strong></p>
            <p>Please set <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_FORMSPREE_ID</code> in your Vercel environment variables.</p>
          </div>
        )}
      </div>
    </div>
  );
}