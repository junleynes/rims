
import type {Metadata} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { BrandingProvider } from '@/components/branding-context';
import * as db from '@/lib/server-db';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await db.getBranding();
  return {
    title: `${branding.appAcronym} - ${branding.appName}`,
    description: 'Secure and efficient budget and resource tracking system.',
  };
}

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
