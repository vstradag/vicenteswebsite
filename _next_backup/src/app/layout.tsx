import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const siteUrl = "https://vicenteestradagonzalez.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vicente Estrada Gonzalez",
    template: "%s | Vicente Estrada Gonzalez",
  },
  description:
    "Personal website of Vicente Estrada Gonzalez. Research, publications, and interactive demos including gaze tracking.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Vicente Estrada Gonzalez",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
