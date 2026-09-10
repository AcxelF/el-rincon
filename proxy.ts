import { NextRequest, NextResponse } from "next/server";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  // Defense-in-depth CSRF check: state-changing API calls must originate from this same origin.
  // The session cookie is already SameSite=Lax (blocks this for browsers that honor it), this
  // catches the rest. Only enforced when the browser actually sends an Origin header, so it
  // never breaks legitimate same-origin requests that omit it.
  if (request.nextUrl.pathname.startsWith("/api/") && STATE_CHANGING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== request.nextUrl.host) {
          return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
      }
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  // Next.js dev mode needs eval() for its debugging features (never used in production builds).
  const scriptSrc = process.env.NODE_ENV === "production" ? `'self' 'nonce-${nonce}' 'strict-dynamic'` : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`;
  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
