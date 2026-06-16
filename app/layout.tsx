import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Archivo } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
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
      <html lang="en" className={archivo.variable} suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#ff4b35" />
        </head>
        <body className={`${archivo.className} antialiased`}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
