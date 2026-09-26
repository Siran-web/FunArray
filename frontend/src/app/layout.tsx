import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Virtual Furniture Store | AR Room Preview & Omnichannel Showroom",
  description:
    "Curated modern furniture shopping with interactive 3D and Augmented Reality room visualization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerifDisplay.variable} h-full antialiased`}>
      <body className="min-h-full w-full max-w-full overflow-x-hidden flex flex-col bg-[#FAF9F7] text-[#24211E]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
