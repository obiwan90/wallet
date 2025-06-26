import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Web3Provider } from "@/contexts/Web3Context";
import { Toaster } from "@/components/ui/sonner";
import { BackgroundGradient } from "@/components/background-gradient";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web3 Wallet",
  description: "A modern Web3 wallet built with Next.js and shadcn/ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('wallet-theme') || 'dark';
                document.documentElement.className = theme;
                document.documentElement.style.colorScheme = theme;
              } catch (e) {
                document.documentElement.className = 'dark';
                document.documentElement.style.colorScheme = 'dark';
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={true}
          storageKey="wallet-theme"
          forcedTheme={undefined}
        >
          <Web3Provider>
            <BackgroundGradient>
              {children}
            </BackgroundGradient>
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
