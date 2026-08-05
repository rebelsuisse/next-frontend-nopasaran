"use client";

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { FaInstagram } from 'react-icons/fa';

interface InstagramButtonProps {
  title: string;
  subjectName: string;
  category: string;
  date: string;
  readOnLabel: string;
  imageUrl?: string;
}

export default function InstagramButton({
  title,
  subjectName,
  category,
  date,
  readOnLabel,
  imageUrl,
}: InstagramButtonProps) {
  const storyRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const readOnDomain = 'nopasaran.ch';
  const [readOnPrefix, readOnSuffix] = readOnLabel.split(readOnDomain);

  const handleGenerateStory = async () => {
    if (!storyRef.current) return;
    setLoading(true);

    try {
      const dataUrl = await toPng(storyRef.current, {
        quality: 0.85,
        fontEmbedCSS: '',
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `story-nopasaran-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erreur génération story', err);
      alert('Erreur lors de la génération. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleGenerateStory}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1 text-sm bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-full transition-colors"
        title="Générer une Story"
      >
        <FaInstagram />
        <span>{loading ? '...' : 'Story'}</span>
      </button>

      {/* --- ZONE CACHÉE --- */}
      <div style={{ position: 'fixed', top: '-3000px', left: '-3000px' }}>
        <div
          ref={storyRef}
          className="w-[1080px] h-[1350px] bg-gray-900 text-white flex flex-col items-center relative"
          style={{ background: 'linear-gradient(135deg, #111827 0%, #374151 100%)' }}
        >
          {/* 1. Header */}
          <div className="mt-24 flex flex-col items-center gap-4">
            <div className="flex gap-6">
              <span className="bg-red-600 text-white px-8 py-3 rounded-xl text-3xl font-bold uppercase tracking-wider shadow-lg border border-red-500">
                {category}
              </span>
              <span className="bg-white/20 text-gray-200 px-8 py-3 rounded-xl text-3xl font-medium shadow-lg backdrop-blur-sm">
                {date}
              </span>
            </div>
          </div>

          {/* 2. SUJET ET TITRE */}
          <div className="px-20 mt-12 mb-8 w-full text-center">
            <p className="text-4xl font-bold text-gray-300 uppercase tracking-widest mb-5 drop-shadow-md">
              {subjectName}
            </p>
            <h1 className="text-5xl md:text-6xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)]">
              {title}
            </h1>
          </div>

          {/* 3. Image */}
          {imageUrl && (
            <div className="w-[640px] h-[640px] relative rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.7)] border-4 border-gray-600/50 mt-4 mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Incident"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* 4. FOOTER COMPACT */}
          <div className="flex flex-col items-center pb-10">
            <div className="flex flex-col items-center rounded-[2.5rem] border border-white/10 bg-white/5 px-8 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white rounded-full p-2 shadow-xl flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
                </div>

                <div className="flex flex-col justify-center text-left">
                  <p className="text-3xl font-semibold tracking-[0.08em] leading-none text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                    {readOnPrefix}
                    <strong className="font-bold">{readOnDomain}</strong>
                    {readOnSuffix}
                  </p>
                  <p className="mt-3 text-lg font-semibold tracking-[0.22em] leading-none text-gray-300">
                    The Wall of Shame
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
