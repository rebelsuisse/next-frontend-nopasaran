export function formatText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Remplace un espace suivi d'une ponctuation double par un espace insécable (\u00A0)
  // Signes traités : ! ? : ; »
  // Traite aussi le guillemet ouvrant « suivi d'un espace
  return text
    .replace(/\s+([?!:;»])/g, '\u00A0$1') // Espace avant ponctuation
    .replace(/([«])\s+/g, '$1\u00A0');     // Espace après guillemet ouvrant
}
