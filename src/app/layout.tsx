import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/context/ThemeContext";
import { DataProvider } from "@/context/DataContext";
import { MagicPortalProvider } from "@/context/MagicPortalContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { MainLayout } from "@/components/MainLayout";
import { MagicPortalDock } from "@/components/magic-portal/MagicPortalDock";
import { MagicActionResultModal } from "@/components/magic-portal/MagicActionResultModal";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "dpocket",
  description: "Personal dpocket for links, PDFs, WhatsApp messages, and tasks.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "dpocket",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <AppProvider>
          <DataProvider>
            <MagicPortalProvider>
              <LoadingScreen />
              <MainLayout>
                {children}
              </MainLayout>
              <MagicPortalDock />
              <MagicActionResultModal />
            </MagicPortalProvider>
          </DataProvider>
        </AppProvider>
      </body>
    </html>
  );
}
