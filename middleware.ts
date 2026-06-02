import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // You can add additional logic here if needed
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

// Protect everything except login and auth API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login
     * - /api/auth/*
     * - /_next/static
     * - /_next/image
     * - favicon.ico
     * - public files
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
