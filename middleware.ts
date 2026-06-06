import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    // Additional protection: if no secret is configured in production, block access
    // (this helps catch misconfigured Vercel env vars)
    if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
      return NextResponse.json(
        { error: "Authentication not configured" },
        { status: 503 }
      );
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect the entire application except for auth-related and static paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth/* (NextAuth handlers must remain public)
     * - /login (the sign-in page)
     * - Static assets and Next.js internals
     */
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
