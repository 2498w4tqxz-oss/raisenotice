import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Libre_Baskerville } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  // alias consumed by some components

  display: "swap",
});

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RaiseNotice — NYC rent-increase notice, filled. $19.",
  description:
    "Fill a New York rent-increase notice: Real Property Law §226-c timing and Good Cause Eviction §231-c disclosure. PDF in minutes. $19. No account.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${libre.variable} ${plexMono.variable}`}
    >
      <body className="bg-cream font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
