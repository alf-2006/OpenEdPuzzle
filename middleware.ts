import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = new Set(["/app/login", "/app/register"]);

/**
 * Session gate for /app/*.
 * - Refreshes the auth cookie on every request (sliding sessions).
 * - Unauthenticated → /app/login.
 * - Authenticated on login/register → /app.
 * - Exactly /app → role-based redirect, with the role read from the
 *   RLS-protected `profiles` table (never from user_metadata).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() (not getSession()) — validates the token server-side
  // and triggers a refresh when expired.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = AUTH_PAGES.has(pathname);

  const redirectWithCookies = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const redirectRes = NextResponse.redirect(url);
    // Carry any refreshed auth cookies onto the redirect response.
    response.cookies.getAll().forEach((cookie) =>
      redirectRes.cookies.set(cookie),
    );
    return redirectRes;
  };

  if (isAuthPage) {
    return user ? redirectWithCookies("/app") : response;
  }

  if (!user) {
    return redirectWithCookies("/app/login");
  }

  if (pathname === "/app") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    return redirectWithCookies(
      profile?.role === "teacher"
        ? "/app/teacher/classes"
        : "/app/student/classes",
    );
  }

  return response;
}

export const config = {
  // /app and everything under it. Static assets and the auth callback are
  // outside this prefix and never hit the middleware.
  matcher: ["/app", "/app/:path*"],
};
