import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Always On — The Follow Through System',
  description: 'AI-powered lead follow-up for real estate agents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
