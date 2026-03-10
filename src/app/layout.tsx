import type { Metadata } from 'next';
import { Bricolage_Grotesque, Outfit } from 'next/font/google';
import './globals.css';

const headingFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const bodyFont = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FW Pipeline | Fading West',
  description: 'Visual pipeline management for modular construction',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable} min-h-screen`}>{children}</body>
    </html>
  );
}
