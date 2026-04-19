import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Minus H Card',
  description: 'Collect, trade, and unlock the cutest cards in the universe',
  icons: {
    icon: '/title/title.png',
    apple: '/title/title.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
