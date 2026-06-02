import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Username & Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        // Load users from environment variable.
        // Format (JSON array):
        // AUTH_USERS='[{"email":"admin@example.com","passwordHash":"$2a$10$...","name":"Admin"}]'
        const usersEnv = process.env.AUTH_USERS;
        if (!usersEnv) {
          // Fallback demo user for development (remove in production)
          const demoEmail = "demo@example.com";
          const demoPassword = "demo1234";
          if (email === demoEmail && password === demoPassword) {
            return {
              id: "demo",
              email: demoEmail,
              name: "Demo User",
            };
          }
          return null;
        }

        let users: Array<{ email: string; passwordHash: string; name?: string }> = [];
        try {
          users = JSON.parse(usersEnv);
        } catch (e) {
          console.error("Failed to parse AUTH_USERS env var. It must be valid JSON.");
          return null;
        }

        const user = users.find((u) => u.email.toLowerCase() === email);

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.email,
          email: user.email,
          name: user.name || user.email.split("@")[0],
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper to generate a password hash (run this locally when adding new users)
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}
