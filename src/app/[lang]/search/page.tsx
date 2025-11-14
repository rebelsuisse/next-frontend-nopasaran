// src/app/[lang]/search/page.tsx

import { getTranslations } from 'next-intl/server';
import { FaWrench } from 'react-icons/fa'; // On importe une icône appropriée

// On définit les props pour recevoir la langue, nécessaire pour les traductions
interface SearchPageProps {
  params: { lang: string };
}

// On peut créer un namespace "Placeholder" pour les textes de ces pages
async function getPageTranslations(locale: string) {
    // Si le fichier de messages n'a pas cette section, on met des textes par défaut
    try {
        const t = await getTranslations({locale, namespace: 'Placeholder'});
        return {
            title: t('searchTitle'),
            message: t('searchMessage'),
        };
    } catch (error) {
        return {
            title: "Page en Construction",
            message: "La fonctionnalité de recherche est en cours de développement et sera bientôt disponible. Merci pour votre patience !",
        };
    }
}


export default async function SearchPage({ params }: SearchPageProps) {
  // On récupère les textes traduits
  const { title, message } = await getPageTranslations(params.lang);

  return (
    <div className="container mx-auto p-8 flex flex-col items-center justify-center text-center min-h-[60vh]">
      <FaWrench className="text-6xl text-yellow-400 mb-6" />

      <h1 className="text-4xl font-bold text-white mb-4">
        {title}
      </h1>

      <p className="text-lg text-gray-400 max-w-xl">
        {message}
      </p>
    </div>
  );
}