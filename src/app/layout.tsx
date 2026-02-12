import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/UI/NavBar";
import ContactFooter from "@/components/about/ContactFooter";
import { getCurrentUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/userMapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACM X",
  description: "ACM's Website",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dbUser = await getCurrentUser();
  const user = dbUser ? toSafeUser(dbUser) : null;
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {" "}
        <NavBar user={user} />
        {children}
        <ContactFooter />
      </body>
    </html>
  );
}
