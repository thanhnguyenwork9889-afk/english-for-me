import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { PushListener } from "@/components/push-listener";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "vietnamese"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: dict.meta.title, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = { themeColor: "#4f46e5" };

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const dict = await getDictionary();
  return (
    <html
      lang={await getLocale()}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <PushListener openLabel={dict.notify.open} closeLabel={dict.notify.close} />
      </body>
    </html>
  );
}
