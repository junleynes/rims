
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
        {/* System fonts are used for optimal offline performance */}
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <BrandingProvider>
          {children}
          <Toaster />
        </BrandingProvider>
      </body>
    </html>
  );
}
