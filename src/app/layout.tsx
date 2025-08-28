import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Stars Vacation Management',
  description: 'Internal vacation management'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
