import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const pjs = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700', '800'],
  variable: '--font-pjs',
  display:  'swap',
});

export const metadata: Metadata = {
  title:       'Always On — The Follow Through System',
  description: 'AI-powered lead follow-up for real estate agents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={pjs.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
