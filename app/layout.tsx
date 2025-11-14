import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Raleway } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

const raleway = Raleway({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-raleway",
});

export const metadata = {
  title: "Vesh AI",
  description:
    "Practice Therapy Skills with Local AI - A safe environment to practice therapeutic conversations using local Ollama with Llama 3.",
  keywords: "therapy, AI, training, mental health, counseling, practice",
  authors: [{ name: "Vesh Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={raleway.variable}>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#4f46e5" />
        </head>
        <body className={`${raleway.className} antialiased`}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
