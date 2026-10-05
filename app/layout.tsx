import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "Priscilla & Olivier | 17 juillet 2027",
  description: "Mariage de Priscilla et Olivier à l'Estérel Resort."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body><LanguageProvider>{children}</LanguageProvider></body></html>;
}
