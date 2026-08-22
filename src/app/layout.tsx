import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/context/ThemeContext";
import { DataProvider } from "@/context/DataContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { MainLayout } from "@/components/MainLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Knowledge Hub & Organizer",
  description: "Personal Knowledge Hub for links, PDFs, WhatsApp messages, and tasks.",
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
            <LoadingScreen />
            <MainLayout>
              {children}
            </MainLayout>
          </DataProvider>
        </AppProvider>
      </body>
    </html>
  );
}
