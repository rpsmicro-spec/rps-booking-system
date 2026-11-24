import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { fontScaleInitScript } from "@/lib/font-scale";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import "./globals.css";

// The UI font. globals.css points --font-sans at --font-inter.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Only used by a few `font-mono` spots (job number pattern, activity JSON),
// so it is not preloaded.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "RPS Booking System",
  description: "Booking System",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#3b82f6" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // Font variables live on <html> so the :root-level --font-sans/--font-mono
      // tokens in globals.css can resolve them.
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Apply the saved text size before first paint */}
        <script dangerouslySetInnerHTML={{ __html: fontScaleInitScript }} />
        {/* Prevent browser's native PWA install banner - must run before React loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  window.addEventListener('beforeinstallprompt', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Store the event for later use
                    window.deferredInstallPrompt = e;
                  }, { passive: false, capture: true });
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <ServiceWorkerRegistration />
          <UpdateNotification />
        </ThemeProvider>
      </body>
    </html>
  );
}
