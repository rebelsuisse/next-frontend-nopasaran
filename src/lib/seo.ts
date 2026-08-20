// src/lib/seo.ts

import type { Metadata } from 'next';

// Doit rester aligné sur `locales` dans middleware.ts et sur
// generateStaticParams() de src/app/[lang]/layout.tsx.
export const LOCALES = ['fr-CH', 'de-CH', 'it-CH', 'en'] as const;
export const DEFAULT_LOCALE = 'fr-CH';

/**
 * Construit le bloc `alternates` d'une page : canonique auto-référente +
 * jeu hreflang complet (x-default inclus).
 *
 * À définir sur CHAQUE page. Next.js fusionne les métadonnées de façon
 * superficielle : un `alternates` de page écrase donc *entièrement* celui du
 * layout parent, il n'est pas fusionné champ par champ. C'est ce qui faisait
 * disparaître les hreflang de l'accueil (la page ne déclarait qu'une
 * canonique), et, à l'inverse, ce qui faisait canoniser /fr-CH/manifesto vers
 * /fr-CH (la page ne déclarait rien et héritait du `canonical: /${lang}` du
 * layout). Le layout ne déclare plus d'`alternates` du tout, pour supprimer
 * ce piège.
 *
 * @param lang Locale courante.
 * @param path Chemin après la locale : '' pour l'accueil, '/contact', ...
 */
export function localeAlternates(lang: string, path = ''): Metadata['alternates'] {
  return {
    canonical: `/${lang}${path}`,
    languages: {
      ...Object.fromEntries(LOCALES.map(locale => [locale, `/${locale}${path}`])),
      // Version servie aux visiteurs dont la langue ne correspond à aucune
      // des nôtres.
      'x-default': `/${DEFAULT_LOCALE}${path}`,
    },
  };
}
