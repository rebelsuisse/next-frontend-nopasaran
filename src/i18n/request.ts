// i18n.ts

import {getRequestConfig} from 'next-intl/server';

const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'];

export default getRequestConfig(async ({locale}) => {
  let finalLocale: string;
  if (locale && locales.includes(locale)) {
    finalLocale = locale;
  } else {
    // 2. Sinon, on utilise la langue par défaut
    finalLocale = 'fr-CH';
  }

  return {
    // ON FORCE LE TYPE ICI
    locale: finalLocale, 
    messages: (await import(`../../messages/${finalLocale}.json`)).default
  };
});
