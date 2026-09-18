import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsApp Web",
  description: "Real-time WhatsApp Web clone built with Next.js and WebSockets",
  icons: {
    icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0c1317] text-[#e9edef] antialiased h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
