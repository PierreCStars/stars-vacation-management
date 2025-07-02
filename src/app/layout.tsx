import "./globals.css";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import type { ReactNode } from "react";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: "Stars Vacation Management",
  description: "Vacation management system for Stars Group companies",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${montserrat.variable} font-montserrat antialiased`} 
        style={{ 
          backgroundColor: '#FFFFFF', 
          margin: 0, 
          padding: 0,
          minHeight: '100vh',
          fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 400,
          lineHeight: 1.6,
          color: '#1f2937'
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
