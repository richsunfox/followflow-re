import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/landing'];

// Routes that should redirect to /leads if the user IS already signed in
const AUTH_ROUTES = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow Twilio webhook and health check through — no session needed
  if (pathname.startsWith('/api/webhooks/') || pathname === '/api/health') {
    return NextResponse.next();
  }

  // Create a response we can mutate (needed to refresh session cookies)
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
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

  // Refresh session — required on every request to keep auth alive
  const { data: { user } } = await supabase.auth.getUser();

  const isPublic   = PUBLIC_ROUTES.some(r => pathname.startsWith(r));
  const isAuthPage = AUTH_ROUTES.some(r => pathname.startsWith(r));

  // Signed-in user hitting login/signup → send to dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/leads', request.url));
  }

  // Unauthenticated user hitting a protected route → send to login
  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
