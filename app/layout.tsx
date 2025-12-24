import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'STREAKD.',
    template: '%s · STREAKD.',
  },
  description: 'Stay consistent with your gym routine through streak-based challenges',
  applicationName: 'STREAKD.',
  icons: {
    // Place these files at: public/streakd_logo.png and public/title.png
    icon: [
      { url: '/streakd_logo.png', type: 'image/png' },
      { url: '/title.png', type: 'image/png' },
    ],
    shortcut: ['/streakd_logo.png', '/title.png'],
    apple: [{ url: '/streakd_logo.png', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

