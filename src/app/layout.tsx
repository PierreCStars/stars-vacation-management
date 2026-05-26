import './globals.css';
import { Montserrat } from 'next/font/google';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { assertRequiredEnv } from "@/lib/assertEnv";

// Validate environment variables at server start
assertRequiredEnv();

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata = {
  title: 'Stars Vacation Management',
  description: 'Internal vacation management — Star Luxury Group',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
    apple: '/favicon-48.png',
  },
};

export default function RootLayout({ children }: any) {
  return (
    <html lang="en" suppressHydrationWarning className={montserrat.variable}>
      <body className={montserrat.className} suppressHydrationWarning>
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
// DEPLOYMENT TRIGGER Mon Oct  6 14:56:37 CEST 2025
