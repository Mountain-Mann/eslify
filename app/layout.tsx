import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import Nav from "@/components/Nav";
import UpgradeModal from "@/components/UpgradeModal";
import { UpgradeProvider } from "@/components/UpgradeProvider";
import { UserProvider } from "@/components/UserProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "ESLify — AI Tools for ESL Teachers",
  description:
    "Purpose-built AI tools for ESL teachers. Lesson plans, worksheets, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${syne.variable}`} style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        <UserProvider>
          <UpgradeProvider>
            <Nav />
            {children}
            <UpgradeModal />
          </UpgradeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
