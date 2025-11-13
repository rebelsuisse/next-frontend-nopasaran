// i18n.ts

import {getRequestConfig} from 'next-intl/server';

const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'];

export default getRequestConfig(async ({locale}) => {
  let finalLocale: string;
  if (locale && locales.includes(locale)) {
    finalLocale = locale;
  } else {
    finalLocale = 'fr-CH';
  }

  return {
    locale: finalLocale, 
    messages: (await import(`../../messages/${finalLocale}.json`)).default
  };
});
