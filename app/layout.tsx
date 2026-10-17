import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cetakprofit — Kalkulator Profit Percetakan',
  description: 'Hitung biaya produksi, biaya marketplace, dan keuntungan usaha percetakan.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
