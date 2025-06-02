const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID;

import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            <Navbar /> {/* Render the Navbar component */}
            <Toaster position="top-right" />
            {children}
          </GoogleOAuthProvider>
        ) : (
          <>
            <Navbar /> {/* Render the Navbar component */}
            <Toaster position="top-right" />
            {children}
          </>
        )}
      </body>
    </html>
  );
}
