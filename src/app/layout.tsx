import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prediction market",
  description: "Created by Noah Broome",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
