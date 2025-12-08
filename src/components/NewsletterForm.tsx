"use client";

import { useState, FormEvent } from "react";
import { FaPaperPlane, FaCheck } from "react-icons/fa";

// On ajoute 'lang' dans les props
export default function NewsletterForm({ labels, lang }: { labels: any, lang: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        // ON ENVOIE LA LANGUE ICI
        body: JSON.stringify({ email, lang }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-900/30 text-green-300 p-4 rounded-lg flex items-center justify-center gap-2">
        <FaCheck /> {labels.successMessage}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        name="email"
        required
        placeholder={labels.emailPlaceholder}
        className="flex-grow px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {status === "loading" ? "..." : <><FaPaperPlane /> {labels.buttonLabel}</>}
      </button>
      {status === "error" && <div className="text-red-400 mt-2 text-sm">{labels.errorMessage}</div>}
    </form>
  );
}
