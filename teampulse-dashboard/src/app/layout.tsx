import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SwarmProvider } from "@/context/SwarmContext";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TeamPulse - AI Work Intelligence",
  description: "A multi-agent swarm that delivers one clear morning brief.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className={inter.className}>
        <SwarmProvider>
          <Navbar />
          {children}
        </SwarmProvider>
      </body>
    </html>
  );
}
