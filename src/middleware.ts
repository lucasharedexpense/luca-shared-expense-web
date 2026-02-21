import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Cek apakah user punya cookie sesi (tanda sudah login)
  // Nanti saat login beneran pake Firebase, ini diganti cek token asli.
  // Untuk sekarang, kita cek cookie dummy bernama "luca_session".
  const isLoggedIn = request.cookies.has("luca_session");

  // 2. Tentukan halaman mana yang sedang diakses
  const { pathname } = request.nextUrl;

  // 3. Daftar halaman yang HARUS login (Protected Routes)
  // Kalau user belum login coba buka ini, tendang ke Greeting
  const protectedRoutes = ["/home", "/event", "/account", "/settings", "/scan", "/contacts"];
  
  // Cek apakah path saat ini adalah salah satu protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // 4. LOGIC REDIRECT

  // KASUS A: User BELUM login, tapi maksa masuk halaman protected
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // KASUS B: User SUDAH login, tapi malah buka halaman Greeting atau Login
  if (isLoggedIn && (pathname === "/" || pathname === "/auth/login" || pathname === "/auth/signup" || pathname === "/auth/verify-email")) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Lanjut seperti biasa
  return NextResponse.next();
}

// Konfigurasi path mana saja yang kena middleware ini
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. api (API routes)
     * 2. _next/static (static files)
     * 3. _next/image (image optimization files)
     * 4. favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};