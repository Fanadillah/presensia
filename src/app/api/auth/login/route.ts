import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ success: false, error: 'Email atau password salah' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: data.user.id,
      action: 'login',
      details: { email },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: profile,
        session: {
          access_token: data.session.access_token,
          expires_at: data.session.expires_at,
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
