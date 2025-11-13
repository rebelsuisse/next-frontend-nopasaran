// tailwind.config.ts

import type { Config } from 'tailwindcss'

// On importe le plugin en haut du fichier
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ON AJOUTE CETTE SECTION
      typography: ({ theme }) => ({
        // On crée une nouvelle classe "prose-invert" que l'on pourra utiliser sur fond sombre
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.gray[300]'), // Couleur du texte principal
            '--tw-prose-headings': theme('colors.white'),   // Couleur des titres (h1, h2...)
            '--tw-prose-lead': theme('colors.gray[400]'),
            '--tw-prose-links': theme('colors.blue[400]'),    // Couleur des liens
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-counters': theme('colors.gray[400]'),
            '--tw-prose-bullets': theme('colors.gray[600]'),
            '--tw-prose-hr': theme('colors.gray[700]'),
            '--tw-prose-quotes': theme('colors.gray[200]'),
            '--tw-prose-quote-borders': theme('colors.gray[700]'),
            '--tw-prose-captions': theme('colors.gray[400]'),
            '--tw-prose-code': theme('colors.white'),
            '--tw-prose-pre-code': theme('colors.gray[300]'),
            '--tw-prose-pre-bg': theme('colors.gray[900]'),
            '--tw-prose-th-borders': theme('colors.gray[600]'),
            '--tw-prose-td-borders': theme('colors.gray[700]'),

            // Variables spécifiques pour un thème sombre
            '--tw-prose-invert-body': theme('colors.gray[300]'),
            '--tw-prose-invert-headings': theme('colors.white'),
            '--tw-prose-invert-links': theme('colors.blue[400]'),
            // ... vous pouvez continuer pour tous les éléments si besoin
          },
        },
      }),
    },
  },
  plugins: [
    typography
  ],
}
export default config
