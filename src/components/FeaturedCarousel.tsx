'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaChevronLeft, FaChevronRight, FaTag, FaCalendar } from 'react-icons/fa';
import { Incident } from '@/types';
import { formatText } from '@/lib/format';

interface FeaturedCarouselProps {
  incidents: Incident[];
  lang: string;
  translations: Record<string, string>;
}

export default function FeaturedCarousel({ incidents, lang, translations }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();

  const STRAPI_HOST = process.env.NEXT_PUBLIC_STRAPI_HOST || "https://api.nopasaran.ch";

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === incidents.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? incidents.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex, isPaused]);

  const getImageUrl = (incident: Incident) => {
    if (incident.evidence_image && incident.evidence_image.length > 0 && incident.evidence_image[0]?.url) {
      return `${STRAPI_HOST}${incident.evidence_image[0].url}`;
    } else if (incident.sujet?.picture?.url) {
      return `${STRAPI_HOST}${incident.sujet.picture.url}`;
    }
    return '/icon.png';
  };

  const getSlideStyles = (index: number) => {
    if (index === currentIndex) {
      return "left-1/2 -translate-x-1/2 z-30 scale-100 opacity-100 cursor-pointer shadow-[0_20px_60px_rgba(0,0,0,0.8)]";
    }

    const prevIndex = (currentIndex - 1 + incidents.length) % incidents.length;
    const nextIndex = (currentIndex + 1) % incidents.length;

    if (index === prevIndex) {
      return "left-[5%] md:left-[15%] -translate-x-1/2 z-10 scale-85 opacity-70 cursor-pointer hover:opacity-90";
    }

    if (index === nextIndex) {
      return "right-[5%] md:right-[15%] translate-x-1/2 z-10 scale-85 opacity-70 cursor-pointer hover:opacity-90";
    }

    return "left-1/2 -translate-x-1/2 z-0 scale-75 opacity-0 pointer-events-none";
  };

  if (!incidents || incidents.length === 0) return null;

  return (
    <div
      className="relative w-full h-[450px] md:h-[550px] flex items-center justify-center mb-16 overflow-hidden py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >

      {incidents.map((incident, index) => {
        const isCenter = index === currentIndex;
        const styles = getSlideStyles(index);
        const imgUrl = getImageUrl(incident);

        return (
          <div
            key={incident.id}
            onClick={() => {
              if (index !== currentIndex) {
                setCurrentIndex(index);
              } else {
                router.push(`/${lang}/the-wall-of-shame/${incident.slug}`);
              }
            }}
            className={`
              absolute top-0 transition-all duration-500 ease-in-out
              w-[88%] md:w-[70%] h-full 
              rounded-3xl border-[3px] border-gray-600/50 
              overflow-hidden ${styles}
            `}
          >

            {/* IMAGE */}
            <div className="absolute inset-0 bg-gray-900">
              <Image
                src={imgUrl}
                alt={incident.title}
                fill
                className={`object-cover transition-transform duration-700 ${
                  isCenter ? 'opacity-95' : 'opacity-70 grayscale-[30%]'
                }`}
                priority={isCenter}
              />

              {/* SCRIM PLUS LÉGER */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent" />
            </div>

            {/* FOND VERRE DÉPOLI POUR LE TEXTE */}
            <div className="absolute bottom-0 left-0 right-0 min-h-32 md:min-h-40 bg-black/20 backdrop-blur-md z-10" />

            {/* CONTENU */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 md:p-10 z-20 pb-5 md:pb-6">
              <div className="max-w-4xl mx-auto text-center md:text-left">

                {/* BADGES */}
                <div className="flex flex-wrap gap-1.5 md:gap-3 mb-1.5 md:mb-3 justify-center md:justify-start">
                  <span className="bg-red-600 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <FaTag /> {translations[incident.category] || incident.category}
                  </span>

                  <span className="bg-white/20 backdrop-blur-md text-gray-100 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm font-medium flex items-center gap-1 shadow-sm">
                    <FaCalendar /> {new Date(incident.incident_date).toLocaleDateString(lang)}
                  </span>
                </div>

                {/* TITRE */}
                <h2 className="
                  text-lg sm:text-xl md:text-3xl lg:text-4xl 
                  font-black text-white 
                  leading-tight md:leading-tight 
                  mb-1 md:mb-2 
                  drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]
                  hover:text-blue-400 transition-colors
                  line-clamp-4 md:line-clamp-2
                ">
                  {formatText(incident.title)}
                </h2>

                {/* SUJET */}
                {incident.sujet && (
                  <p className="text-xs md:text-lg text-gray-300 font-medium line-clamp-1 drop-shadow-md mt-0.5 md:mt-0">
                    {incident.sujet.name}
                    <span className="text-gray-500 mx-1 md:mx-2">|</span>
                    {translations[incident.sujet.affiliation] || incident.sujet.affiliation}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* BOUTONS */}
      <button
        onClick={prevSlide}
        className="absolute left-1 md:left-8 z-40 bg-black/40 hover:bg-white/20 text-white p-2 md:p-3 rounded-full backdrop-blur-sm transition-all shadow-lg border border-white/10"
        aria-label="Précédent"
      >
        <FaChevronLeft size={20} className="md:w-6 md:h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-1 md:right-8 z-40 bg-black/40 hover:bg-white/20 text-white p-2 md:p-3 rounded-full backdrop-blur-sm transition-all shadow-lg border border-white/10"
        aria-label="Suivant"
      >
        <FaChevronRight size={20} className="md:w-6 md:h-6" />
      </button>

      {/* INDICATEURS */}
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
