// src/app/api/newsletter/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, lang } = await request.json();

    // Validation basique
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    
    // Sélection de la liste en fonction de la langue
    const listId = lang === 'de-CH' 
      ? Number(process.env.BREVO_LIST_ID_DE) 
      : Number(process.env.BREVO_LIST_ID_FR);

    if (!apiKey || !listId || isNaN(listId)) {
      console.error('Configuration Brevo manquante ou invalide.');
      return NextResponse.json({ error: 'Erreur configuration serveur' }, { status: 500 });
    }

    // Appel à l'API Brevo
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: email,
        listIds: [listId],
        updateEnabled: true, // Permet de mettre à jour si le contact existe déjà (évite des erreurs 400)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Si l'utilisateur est déjà inscrit, on renvoie un succès pour ne pas l'inquiéter
      if (errorData.code === 'duplicate_parameter') {
         return NextResponse.json({ message: 'Déjà inscrit' }, { status: 200 });
      }
      
      console.error('Erreur API Brevo:', errorData);
      throw new Error('Erreur lors de l\'inscription Brevo');
    }

    return NextResponse.json({ message: 'Succès' }, { status: 201 });

  } catch (error) {
    console.error('Erreur Newsletter Route:', error);
    return NextResponse.json({ error: 'Erreur technique' }, { status: 500 });
  }
}