import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#dc2626",
  colorScheme: "dark",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "MICROSLOP STATUS — Infrastructure Slop Monitor",
  description:
    "Real-time monitoring of Microsoft infrastructure slop. Track outages, degraded services, and the eternal loading spinner.",
  keywords: [
    "MICROSLOP",
    "status",
    "Microsoft",
    "outage",
    "infrastructure",
    "Teams",
    "Outlook",
    "Azure",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SLOP STATUS",
  },
  openGraph: {
    title: "MICROSLOP STATUS — Infrastructure Slop Monitor",
    description:
      "Real-time monitoring of Microsoft infrastructure slop.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="d822f387-2517-4972-aa30-346a1ea22b69"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

// ============================================================================
// SERVICE WORKER REGISTRATION (Client Component)
// ============================================================================
function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `,
      }}
    />
  );
}