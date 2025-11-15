import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Health Assistant',
  description: 'AI-powered health assistant for personalized health analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}

