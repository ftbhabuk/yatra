// app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth"; // Import AuthOptions
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = { // Use AuthOptions type
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT for session management
  },
  secret: process.env.NEXTAUTH_SECRET, // Add a secret for JWT
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
