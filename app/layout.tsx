import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nullum — AI Decision Audit Agent",
  description:
    "No AI decision without a record. Tamper-proof, on-chain audit infrastructure for AI systems on Hedera.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
