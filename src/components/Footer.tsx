import { getTranslations } from 'next-intl/server';
import { FaGithub, FaFacebook, FaInstagram, FaYoutube, FaMedium, FaEnvelope, FaTwitter } from 'react-icons/fa';

interface FooterProps {
  lang: string;
}

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
const formattedVersion = appVersion?.replace('-', '+').replace('g', '');

export default async function Footer({ lang }: FooterProps) {
  const t = await getTranslations('Footer');

  return (
    <footer className="bg-gray-800 text-white p-6 mt-8">
      <div className="container mx-auto text-center">
        <div className="flex justify-center space-x-6 mb-4">
          <a href={t('instagram')} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram size={24} /></a>
          <a href={t('facebook')} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook size={24} /></a>
          <a href={t('x')} target="_blank" rel="noopener noreferrer" aria-label="X"><FaTwitter size={24} /></a>
          <a href={t('bluesky')} target="_blank" rel="noopener noreferrer" aria-label="Bluesky">
            <img src="/icons/bluesky.svg" alt="Bluesky" width={24} height={24} style={{ filter: 'brightness(0) invert(1)' }} />
          </a>
          <a href={t('medium')} target="_blank" rel="noopener noreferrer" aria-label="Medium"><FaMedium size={24} /></a>
          <a href={t('github')} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub size={24} /></a>
          <a href={`mailto:${t('contact')}`} aria-label="Email"><FaEnvelope size={24} /></a>
        </div>
        
        <p className="text-sm text-gray-400" style={{ whiteSpace: 'pre-line' }}>
          nopasaran.ch {formattedVersion && ` ${formattedVersion}`} | © {new Date().getFullYear()} Rebel Suisse{"\n"}
          Source code under <a href="https://www.mozilla.org/en-US/MPL/2.0/" target="_blank" rel="noopener noreferrer">Mozilla Public License 2.0{"\n"}</a>
          Data under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en" target="_blank" rel="noopener noreferrer">Creative Commons BY-NC-SA 4.0</a>
        </p>
      </div>
    </footer>
  );
}