import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";
import { updateSession } from "@/lib/supabase/proxy";

function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && hasLocale(cookie)) return cookie;

  // Very small Accept-Language parser: "vi-VN,vi;q=0.9,en;q=0.8"
  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => hasLocale(r.lang))?.lang as Locale ?? defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes (e.g. the reminder cron) authenticate themselves; no locale or session work.
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Auth callback lives outside the [lang] tree.
  if (pathname.startsWith("/auth")) {
    return updateSession(request, NextResponse.next({ request }));
  }

  const hasPrefix = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (!hasPrefix) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return updateSession(request, NextResponse.next({ request }));
}

export const config = {
  matcher: [
    // Skip Next internals and static files.
    // .js = service worker (/sw.js), manifest.webmanifest = PWA manifest.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|js)$).*)",
  ],
};
