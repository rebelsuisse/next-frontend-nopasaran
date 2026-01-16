'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaTag, FaCalendar } from 'react-icons/fa';
import { Incident } from '@/types';

interface FeaturedCarouselProps {
  incidents: Incident[];
  lang: string;
}

export default function FeaturedCarousel({ incidents, lang }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false); // Pour pauser quand on survole

  const STRAPI_HOST = process.env.NEXT_PUBLIC_STRAPI_HOST || "https://api.nopasaran.ch";

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === incidents.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? incidents.length - 1 : prev - 1));
  };

  // Auto-play
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isPaused]);

  const getImageUrl = (incident: Incident) => {
    if (incident.evidence_image && incident.evidence_image.length > 0 && incident.evidence_image[0]?.url) {
      return `${STRAPI_HOST}${incident.evidence_image[0].url}`;
    } 
    
    // 2. Sinon, on prend la photo du politicien/sujet
    else if (incident.sujet?.picture?.url) {
      return `${STRAPI_HOST}${incident.sujet.picture.url}`;
    }
    
    // 3. Sinon, le logo par défaut
    return '/icon.png';
  };

  // Logique pour déterminer la position (Actif, Précédent, Suivant)
  const getSlideStyles = (index: number) => {
    if (index === currentIndex) {
      // SLIDE CENTRAL (Actif)
      return "left-1/2 -translate-x-1/2 z-30 scale-100 opacity-100 cursor-auto";
    }
    
    // Calcul des indices circulaires
    const prevIndex = (currentIndex - 1 + incidents.length) % incidents.length;
    const nextIndex = (currentIndex + 1) % incidents.length;

    if (index === prevIndex) {
      // SLIDE GAUCHE (Précédent)
      return "left-[10%] md:left-[15%] -translate-x-1/2 z-10 scale-85 opacity-60 cursor-pointer hover:opacity-80";
    }
    
    if (index === nextIndex) {
      // SLIDE DROIT (Suivant)
      return "right-[10%] md:right-[15%] translate-x-1/2 z-10 scale-85 opacity-60 cursor-pointer hover:opacity-80";
    }

    // SLIDES CACHÉS (Derrière le centre)
    return "left-1/2 -translate-x-1/2 z-0 scale-75 opacity-0 pointer-events-none";
  };

  if (!incidents || incidents.length === 0) return null;

  return (
    <div 
      className="relative w-full h-[450px] md:h-[550px] flex items-center justify-center mb-16 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      
      {/* ZONE DES SLIDES */}
      {incidents.map((incident, index) => {
        const isCenter = index === currentIndex;
        const styles = getSlideStyles(index);
        const imgUrl = getImageUrl(incident);

        return (
          <div
            key={incident.id}
            onClick={() => {
               if (index !== currentIndex) setCurrentIndex(index);
            }}
            className={`
              absolute top-0 transition-all duration-500 ease-in-out
              w-[85%] md:w-[70%] h-full 
              
              /* --- CHANGEMENT ICI : Bords et Contour --- */
              rounded-3xl                     /* Coins très arrondis */
              border-[4px] border-gray-600/50 /* Contour épais semi-transparent */
              shadow-2xl overflow-hidden      /* Ombre portée */
              /* ----------------------------------------- */
              
              ${styles}
            `}
          >
            {/* IMAGE DE FOND */}
            <div className="absolute inset-0 bg-gray-900">
               <Image
                  src={imgUrl}
                  alt={incident.title}
                  fill
                  className={`object-cover transition-transform duration-700 ${isCenter ? 'opacity-70 group-hover:scale-105' : 'opacity-50 grayscale-[50%]'}`}
                  priority={isCenter}
                />
                {/* Dégradé plus fort si c'est le slide central pour lire le texte */}
                <div className={`absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent ${isCenter ? 'opacity-100' : 'opacity-40'}`} />
            </div>

            {/* CONTENU (Visible uniquement sur le slide central pour ne pas surcharger) */}
            <div className={`absolute bottom-0 left-0 right-0 p-6 md:p-10 transition-opacity duration-300 ${isCenter ? 'opacity-100' : 'opacity-0'}`}>
              <div className="max-w-4xl mx-auto text-center md:text-left">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 md:gap-3 mb-3 justify-center md:justify-start">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                          <FaTag /> {incident.category}
                      </span>
                      <span className="bg-white/20 backdrop-blur-md text-gray-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                          <FaCalendar /> {new Date(incident.incident_date).toLocaleDateString(lang)}
                      </span>
                  </div>

                  {/* Titre avec lien (seul le titre central est cliquable vers la page) */}
                  {isCenter ? (
                    <Link href={`/${lang}/the-wall-of-shame/${incident.slug}`} className="block group/link">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-2 drop-shadow-lg group-hover/link:text-blue-400 transition-colors line-clamp-2">
                            {incident.title}
                        </h2>
                    </Link>
                  ) : (
                    <h2 className="text-2xl font-bold text-gray-300">{incident.title}</h2>
                  )}

                  {/* Sujet */}
                  {incident.sujet && (
                      <p className="text-base md:text-lg text-gray-300 font-medium line-clamp-1">
                          {incident.sujet.name} <span className="text-gray-500 mx-2">|</span> {incident.sujet.affiliation}
                      </p>
                  )}
              </div>
            </div>
          </div>
        );
      })}

      {/* BOUTONS DE NAVIGATION (Flottants sur les côtés de l'écran) */}
      <button 
        onClick={prevSlide}
        className="absolute left-2 md:left-8 z-40 bg-black/40 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all shadow-lg"
        aria-label="Précédent"
      >
        <FaChevronLeft size={24} />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-2 md:right-8 z-40 bg-black/40 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all shadow-lg"
        aria-label="Suivant"
      >
        <FaChevronRight size={24} />
      </button>

      {/* INDICATEURS (POINTS) */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
        {incidents.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-red-500' : 'w-2 bg-gray-600 hover:bg-gray-400'
            }`}
            aria-label={`Aller au slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}