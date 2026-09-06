import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// The only destinations this route is ever asked to send someone to.
// next is untrusted input (it's a query param on a link we generate, but
// nothing stops it being tampered with before a user clicks it) — matching
// against a fixed allowlist instead of using it directly avoids building an
// open redirect, e.g. a crafted next=@evil.com turning
// `${origin}${next}` into a URL whose host is actually evil.com.
const ALLOWED_NEXT_PATHS = new Set(["/browse", "/reset-password"]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext && ALLOWED_NEXT_PATHS.has(requestedNext) ? requestedNext : "/browse";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not verify link`);
}
