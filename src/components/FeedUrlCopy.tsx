// src/components/FeedUrlCopy.tsx
'use client';

import { useState } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

interface FeedUrlCopyProps {
  url: string;
  labels: { copy: string; copied: string };
}

export default function FeedUrlCopy({ url, labels }: FeedUrlCopyProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        readOnly
        value={url}
        onFocus={e => e.currentTarget.select()}
        aria-label="RSS"
        className="flex-grow min-w-0 px-4 py-2 rounded-full bg-gray-900 border border-gray-600 text-gray-200 font-mono text-sm"
      />
      <button
        onClick={handleCopy}
        className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors shadow-md"
      >
        {isCopied ? <FaCheck /> : <FaCopy />}
        <span>{isCopied ? labels.copied : labels.copy}</span>
      </button>
    </div>
  );
}
