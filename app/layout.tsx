import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Translation & Glossary Manager",
  description: "Centralize translatable strings and glossary terms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
