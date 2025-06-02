// src/components/AuthProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Using the client ID from your environment variables
const GOOGLE_CLIENT_ID = "559503926657-gs4e0lj3toiat73l25re8oajjc2rl056.apps.googleusercontent.com";

export default function AuthProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <SessionProvider>{children}</SessionProvider>
    </GoogleOAuthProvider>
  );
}