
import type {Metadata} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { BrandingProvider } from '@/components/branding-context';

export const metadata: Metadata = {
  title: 'R.I.M.S - Resource Inventory Management System',
  description: 'Secure and efficient budget and resource tracking system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <BrandingProvider>
          {children}
          <Toaster />
        </BrandingProvider>
      </body>
    </html>
  );
}
