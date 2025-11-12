// src/app/[lang]/layout.tsx

import Header from "@/components/Header";
import Footer from "@/components/Footer";

// On utilise 'any' temporairement pour les props pour contourner les erreurs de type pendant le débogage
export default async function LangLayout({
  children,
  params,
}: any) {
  
  // ÉTAPE CLÉ : On résout la promesse 'params' explicitement
  const resolvedParams = await params;

  // Maintenant, on peut utiliser resolvedParams.lang en toute sécurité
  return (
    <>
      <Header lang={resolvedParams.lang} />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer lang={resolvedParams.lang} />
    </>
  );
}
