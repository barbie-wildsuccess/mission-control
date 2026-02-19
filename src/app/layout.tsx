import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Real-time AI agent squad monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#0a0a0a] text-white">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
