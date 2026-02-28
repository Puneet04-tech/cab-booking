import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "rideswift_super_secret_jwt_key_2026"
);

// Routes anyone can visit without being logged in
const PUBLIC_PATHS = ["/", "/sign-in", "/sign-up", "/api/"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get token from cookie
  const token = req.cookies.get("auth_token")?.value;

  let payload: { userId?: string; role?: string } | null = null;
  if (token) {
    try {
      const { payload: p } = await jwtVerify(token, JWT_SECRET);
      payload = p as { userId?: string; role?: string };
    } catch {
      // invalid / expired — treat as unauthenticated
    }
  }

  const isLoggedIn = Boolean(payload?.userId);

  // Redirect signed-in users away from auth pages
  if (isLoggedIn && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
    const dest = payload?.role === "driver" ? "/driver/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Allow public routes
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Protect everything else
  if (!isLoggedIn) {
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(signIn);
  }

  // Guard driver routes
  if (pathname.startsWith("/driver") && payload?.role !== "driver") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
