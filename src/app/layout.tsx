// src/app/layout.tsx
import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "No pasaran - The Wall of Shame",
  description: "Un projet citoyen pour la transparence politique en Suisse.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
