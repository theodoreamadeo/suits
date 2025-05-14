// src/app/layout.tsx
import { Inter } from 'next/font/google';
import '../globals.css';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fashion Recommendation System',
  description: 'Get personalized outfit recommendations based on your skin tone, gender, occasion, and preferences.',
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