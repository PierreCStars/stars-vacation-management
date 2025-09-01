import './globals.css';

export const metadata = {
  title: 'Stars Vacation Management',
  description: 'Internal vacation management'
};

export default function RootLayout({ children }: any) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
