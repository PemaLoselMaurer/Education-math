import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/auth", "/_next", "/api", "/favicon.ico"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = [...PUBLIC_PATHS].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  const hasToken = Boolean(req.cookies.get("access_token")?.value);
  if (!hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
