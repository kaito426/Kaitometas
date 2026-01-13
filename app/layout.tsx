import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kaito Vision",
  description: "Sistema pessoal de disciplina e visão",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kaito Vision",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Navigation } from "@/components/Navigation";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={cn(inter.className, "min-h-screen pb-20 md:pb-0 md:pl-64")}>
        <ServiceWorkerRegistrar />
        <Navigation />
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </main>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
