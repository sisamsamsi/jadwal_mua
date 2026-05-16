import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Hanya email yang terdaftar di ADMIN_EMAILS yang bisa masuk
    async signIn({ user }) {
      if (!user.email) return false;
      const isAllowed = ADMIN_EMAILS.includes(user.email.toLowerCase());
      return isAllowed;
    },
    async session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: "/",           // redirect ke halaman login custom
    error: "/?error=true", // jika login ditolak
  },
  secret: process.env.NEXTAUTH_SECRET,
};
