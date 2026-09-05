import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ThemeInitScript from "@/components/ThemeInitScript";
import ToastContainer from "@/components/ToastContainer";
import InactivityLogout from "@/components/InactivityLogout";
import PageTransition from "@/components/PageTransition";
import AmbientBackground from "@/components/AmbientBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusCircle — Your Campus Marketplace",
  description: "Buy and sell with verified students on your own campus.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeInitScript nonce={nonce} />
        <AmbientBackground />
        <Header />
        <main className="flex-1 pb-16 sm:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
        <ToastContainer />
        <InactivityLogout />
      </body>
    </html>
  );
}
