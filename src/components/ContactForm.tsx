"use client";

import { useState, FormEvent } from "react";
import { FaPaperPlane } from "react-icons/fa";

interface ContactFormProps {
  translations: {
    emailLabel: string;
    messageLabel: string;
    sendButton: string;
    sending: string;
    successMessage: string;
    errorMessage: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
  };
  formId: string; // We will pass the Formspree ID here
}

export default function ContactForm({ translations, formId }: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setStatus("success");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-900/30 border border-green-600 text-green-200 p-6 rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">✓ {translations.successMessage}</h3>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field (Optional) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          {translations.emailLabel} <span className="text-gray-500 text-xs">(Optional)</span>
        </label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder={translations.emailPlaceholder}
          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Message Field (Required) */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
          {translations.messageLabel} <span className="text-red-400">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder={translations.messagePlaceholder}
          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Error Message */}
      {status === "error" && (
        <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-800">
          {translations.errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg"
      >
        {status === "submitting" ? (
          <span>{translations.sending}...</span>
        ) : (
          <>
            <FaPaperPlane size={16} />
            <span>{translations.sendButton}</span>
          </>
        )}
      </button>
    </form>
  );
}