// Password gate for the whole app (HTTP Basic Auth: the browser asks once and remembers it).
// Only on when APP_PASSWORD is set, so local dev stays open. Any username works.
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

function passwordMatches(header: string | null, expected: string): boolean {
  if (!header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const given = Buffer.from(decoded.slice(decoded.indexOf(":") + 1));
  const want = Buffer.from(expected);
  return given.length === want.length && timingSafeEqual(given, want);
}

export function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD?.trim();
  if (!password || passwordMatches(request.headers.get("authorization"), password)) {
    return NextResponse.next();
  }
  return new NextResponse("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CS2 Skins Portfolio Tracker", charset="UTF-8"' },
  });
}

export const config = {
  // Build assets carry no data; leaving them out keeps the icon and CSS loading on the prompt.
  matcher: ["/((?!_next/static|_next/image|icon.svg).*)"],
};
