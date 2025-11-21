import Link from 'next/link'; // Don't forget to import Link!
import { FaGithub, FaTwitter, FaFacebook, FaInstagram, FaYoutube, FaMedium, FaEnvelope } from 'react-icons/fa';

interface HeaderProps {
  lang: string;
}

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
const formattedVersion = appVersion?.replace('-', '+').replace('g', '');

export default function Footer({ lang }: HeaderProps) {
  return (
    <footer className="bg-gray-800 text-white p-6 mt-8">
      <div className="container mx-auto text-center">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="https://github.com/rebelsuisse" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub size={24} /></a>
          <a href="https://www.instagram.com/rebel_suisse/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram size={24} /></a>
          <a href="https://www.facebook.com/people/Rebel-Suisse/61560481049078/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook size={24} /></a>
          <a href="https://www.youtube.com/@Rebel-ch" target="_blank" rel="noopener noreferrer" aria-label="Youtube"><FaYoutube size={24} /></a>
          <a href="https://medium.com/@rebel.suisse" target="_blank" rel="noopener noreferrer" aria-label="Medium"><FaMedium size={24} /></a>
          
          {/* NEW CONTACT LINK */}
          <Link href={`/${lang}/contact`} aria-label="Contact">
            <FaEnvelope size={24} className="hover:text-blue-400 transition-colors" />
          </Link>
        </div>
        
        <p className="text-sm text-gray-400" style={{ whiteSpace: 'pre-line' }}>
          nopasaran.ch {formattedVersion && ` ${formattedVersion}`} | © {new Date().getFullYear()} Rebel Suisse{"\n"}
          Licensed under the <a href="https://www.mozilla.org/en-US/MPL/2.0/" target="_blank" rel="noopener noreferrer">Mozilla Public License 2.0</a>
        </p>
      </div>
    </footer>
  );
}