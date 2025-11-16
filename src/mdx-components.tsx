// src/mdx-components.tsx
import type { MDXComponents } from 'mdx/types';
import { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';

// Cette fonction surcharge les composants par défaut utilisés par MDX.
export function getCustomMDXComponents(components: MDXComponents = {}): MDXComponents {
      return {
    ...components, // On garde les composants par défaut qu'on ne surcharge pas.

    // On applique des classes Tailwind directement sur chaque balise.
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mt-8 mb-4 text-white">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-200 border-b border-gray-700 pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-200">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 leading-relaxed text-gray-300">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 pl-4 space-y-2 text-gray-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 pl-4 space-y-2 text-gray-300">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="mb-2">
        {children}
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-white">{children}</strong>
    ),
    a: ({ href, children }) => {
      const className = "text-blue-400 hover:underline";
      if (href?.startsWith("/")) {
        return <Link href={href} className={className}>{children}</Link>;
      }
      if (href?.startsWith("#")) {
        return <a href={href} className={className}>{children}</a>;
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
    },
    // Vous pouvez continuer pour d'autres balises comme <blockquote>, <code>, etc.
  };
}