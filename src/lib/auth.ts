import { neon } from "@neondatabase/serverless";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

async function isEmailAllowed(email: string): Promise<boolean> {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  const sql = neon(url);
  await sql`
    CREATE TABLE IF NOT EXISTS allowed_users (
      email TEXT PRIMARY KEY,
      added_at TIMESTAMP DEFAULT NOW()
    )
  `;
  const rows = await sql`SELECT email FROM allowed_users WHERE email = ${email}`;
  return rows.length > 0;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      return isEmailAllowed(user.email);
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
