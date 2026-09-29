// src/lib/seo.ts

import type { Metadata } from 'next';

// Doit rester aligné sur `locales` dans middleware.ts et sur
// generateStaticParams() de src/app/[lang]/layout.tsx.
export const LOCALES = ['fr-CH', 'de-CH', 'it-CH', 'en'] as const;
export const DEFAULT_LOCALE = 'fr-CH';

// Public origin of the site, for absolute URLs (feeds, social posts).
export const SITE_URL = 'https://www.nopasaran.ch';

export type Locale = (typeof LOCALES)[number];

/**
 * Ramène une valeur d'origine externe à une locale supportée.
 *
 * À appliquer sur TOUT « lang » qui vient du client (query string, params de
 * route) avant de le réinjecter dans une URL ou dans une requête Strapi.
 * Une valeur arbitraire y ouvrait deux trous :
 *   - « ?lang=/example.com » donnait « //example.com/... », que new URL()
 *     résout en URL absolue : redirection ouverte depuis notre propre domaine,
 *     donc du phishing qui emprunte la réputation de nopasaran.ch ;
 *   - la même valeur partant vers Strapi, un « & » suffisait à y greffer des
 *     paramètres de requête arbitraires.
 */
/**
 * Sérialise un objet pour un <script type="application/ld+json">.
 *
 * JSON.stringify n'échappe pas « < » : un titre d'incident contenant
 * « </script> » fermerait la balise, et la suite serait lue comme du HTML --
 * un XSS stocké à partir d'un simple champ texte de Strapi. On échappe donc
 * <, > et & en séquences \u, que le parseur JSON relit à l'identique.
 * À utiliser pour tout JSON-LD qui contient du contenu venu du CMS.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export function resolveLocale(value: string | null | undefined): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

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
