// tailwind.config.ts
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config = { // On enlève temporairement ': Config' pour ignorer l'erreur de type
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [ // 'safelist' EST BIEN UNE CLÉ DE PREMIER NIVEAU
    {
      pattern: /prose/,
    },
    // Vous pouvez aussi ajouter des classes spécifiques ici
    'prose-invert',
    'prose-lg',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    typography,
  ],
}
// On exporte en s'assurant que le type est compatible
export default config satisfies Config;