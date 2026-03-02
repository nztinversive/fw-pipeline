import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FW Pipeline | Fading West',
  description: 'Visual pipeline management for modular construction',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#1a2332]">{children}</body>
    </html>
  );
}
