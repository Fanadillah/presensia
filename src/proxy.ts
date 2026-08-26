import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // If Supabase is not configured, just pass through
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseKey || supabaseKey === 'placeholder') {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as Record<string, unknown>)
        );
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth check failed
  }

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === '/login' || pathname === '/reset-password';
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute) {
    return supabaseResponse;
  }

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (user) {
    const adminPrefixes = ['/dashboard', '/attendance', '/audit', '/employees', '/leaves', '/payroll', '/announcements'];
    const ownerPrefixes = ['/settings'];
    const isAdminRoute = adminPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const isOwnerRoute = ownerPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    if (isAdminRoute || isOwnerRoute) {
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
      const role = (profile as { role?: string } | null)?.role;

      if (isOwnerRoute && role !== 'owner') {
        const url = request.nextUrl.clone();
        // admin diarahkan ke dashboard, karyawan ke home
        url.pathname = role === 'admin' ? '/dashboard' : '/';
        return NextResponse.redirect(url);
      }

      if (isAdminRoute && role === 'karyawan') {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
