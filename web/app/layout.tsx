import "./globals.css";

export const metadata = {
  title: "TherapyAI Trainer",
  description:
    "Practice Therapy Skills with Local AI - A safe environment to practice therapeutic conversations using local Ollama with Llama 3.",
  keywords: "therapy, AI, training, mental health, counseling, practice",
  authors: [{ name: "TherapyAI Team" }],
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
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
