// Destination: app/auth/callback/route.ts
// This is what Supabase redirects to after a magic link is clicked.
// Register this exact URL in Supabase Dashboard > Authentication > URL Configuration
// > Redirect URLs:
//   https://umbra-wine.vercel.app/auth/callback
//   (add the umbra.black/umbra.world equivalent once the domain is live)

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/browse';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Failed or expired link — send back to login with a flag the page can read
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
