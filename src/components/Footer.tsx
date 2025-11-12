// src/components/Footer.tsx
import { FaGithub, FaTwitter, FaFacebook, FaInstagram, FaYoutube, FaMedium } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white p-6 mt-8">
      <div className="container mx-auto text-center">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="https://github.com/rebelsuisse/nopasaran" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub size={24} /></a>
          <a href="https://www.instagram.com/rebel_suisse/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram size={24} /></a>
          <a href="https://www.facebook.com/people/Rebel-Suisse/61560481049078/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook size={24} /></a>
          <a href="https://www.youtube.com/@Rebel-ch" target="_blank" rel="noopener noreferrer" aria-label="Youtube"><FaYoutube size={24} /></a>
          <a href="https://medium.com/@rebel.suisse" target="_blank" rel="noopener noreferrer" aria-label="Medium"><FaMedium size={24} /></a>
          <a href="https://x.com/Rebel_Suisse" target="_blank" rel="noopener noreferrer" aria-label="X"><FaTwitter size={24} /></a>
        </div>
        <p>© {new Date().getFullYear()} nopasaran.ch - Rebel Suisse</p>
      </div>
    </footer>
  );
}
