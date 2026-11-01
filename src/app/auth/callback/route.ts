import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { defaultLocale } from "@/i18n/config";

/** Magic-link / OAuth redirect target: exchanges the code for a session cookie. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? `/${defaultLocale}/dashboard`;
  // Only allow same-origin relative redirects.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("[auth/callback]", error.message);
  }

  return NextResponse.redirect(`${origin}/${defaultLocale}/login`);
}
