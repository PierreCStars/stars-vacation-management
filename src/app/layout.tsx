import './globals.css';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { assertRequiredEnv } from "@/lib/assertEnv";

// Validate environment variables at server start
assertRequiredEnv();

export const metadata = {
  title: 'Stars Vacation Management',
  description: 'Internal vacation management',
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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
// FORCE DEPLOYMENT Mon Oct  6 14:19:36 CEST 2025
