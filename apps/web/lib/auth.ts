import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
// Prisma 7: PrismaClient is in the generated client, not the main package
import { PrismaClient } from ".prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import jwt from "jsonwebtoken";

// Create a Prisma client using the pg adapter (Prisma 7 style)
// DATABASE_URL must be set in the web environment variables at runtime
function makePrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Return a stub during build time — will throw at runtime if not set
    console.warn("DATABASE_URL not set — Prisma client will not be active");
    return {} as PrismaClient;
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter } as any);
}

// Singleton pattern to avoid multiple connections in dev hot-reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? makePrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  // JWT sessions — avoids a DB lookup on every request
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, persist userId into the JWT token
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) {
        session.user.id = token.userId as string;
        // Sign an API-compatible JWT for Express Bearer auth
        const secret =
          process.env.AUTH_SECRET ||
          process.env.JWT_SECRET ||
          "secret-jwt-key";
        (session as any).apiToken = jwt.sign(
          { userId: token.userId },
          secret,
          { expiresIn: "7d" }
        );
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};

const nextAuth = NextAuth(authConfig);

export const handlers: typeof nextAuth.handlers = nextAuth.handlers;
export const signIn: typeof nextAuth.signIn = nextAuth.signIn;
export const signOut: typeof nextAuth.signOut = nextAuth.signOut;
export const auth: typeof nextAuth.auth = nextAuth.auth;

