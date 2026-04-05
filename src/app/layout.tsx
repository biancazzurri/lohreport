import type { Metadata, Viewport } from "next";
import { SplashScreen } from "@/components/splash-screen";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loh Report",
  description: "Track your daily meals and macros",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Loh Report",
    startupImage: "/splash.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#1a1a2e] text-gray-200 min-h-screen max-w-[375px] mx-auto font-sans">
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
