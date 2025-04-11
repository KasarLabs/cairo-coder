import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/theme/Provider';
import PostHogProviderClient from '@/components/providers/PostHogProvider';
import GoogleAnalytics from '@/components/providers/GoogleAnalytics';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'The Starknet Agent - Unlock your Starknet expertise',
  description: 'AI-powered assistant for Starknet and Cairo.',
  icons: {
    icon: '/starknet_logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full" lang="en" suppressHydrationWarning>
      <body className={cn('h-full', ibmPlexSans.className)}>
        <GoogleAnalytics />
        <PostHogProviderClient>
          <ThemeProvider>
            <Sidebar>{children}</Sidebar>
            <Toaster
              toastOptions={{
                unstyled: true,
                classNames: {
                  toast:
                    'bg-light-primary dark:bg-dark-secondary dark:text-white/70 text-black-70 rounded-lg p-4 flex flex-row items-center space-x-2',
                },
              }}
            />
          </ThemeProvider>
        </PostHogProviderClient>
      </body>
    </html>
  );
}
