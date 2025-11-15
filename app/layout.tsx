import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NotificationPrompt from "@/components/NotificationPrompt";
import NotificationTest from "@/components/NotificationTest";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BHFE Dashboard - CPE Course Management",
  description: "Manage your CPE course business operations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BHFE Dashboard",
  },
  icons: {
    apple: "/apple-icon-180x180.png",
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  themeColor: "#3b82f6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* iOS-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BHFE Dashboard" />
        <link rel="apple-touch-icon" href="/apple-icon-180x180.png" />
        {/* Prevent automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        {children}
        <NotificationPrompt />
        <NotificationTest />
      </body>
    </html>
  );
}
