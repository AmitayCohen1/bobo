import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const SITE_URL = "https://bobo-xi-five.vercel.app/";
const COVER_URL = "https://bobo-xi-five.vercel.app/meitar_cover.png";
const TITLE = "בובו — קהילה יקרה";
const DESCRIPTION =
  "אי אפשר להסביר מה עברנו ביחד. אז בואו לפחות נלבש את זה עלינו ונבלבל את כולם!";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  icons: {
    icon: "/assets/favicon.ico",
    apple: COVER_URL,
  },
  openGraph: {
    type: "website",
    siteName: "בובו",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "he_IL",
    images: [
      {
        url: COVER_URL,
        secureUrl: COVER_URL,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: COVER_URL, alt: TITLE }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-white text-ink antialiased overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
