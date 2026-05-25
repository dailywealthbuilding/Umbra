import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, name, aesthetic_affinity } = await req.json()

    if (!email || !aesthetic_affinity) {
      return NextResponse.json(
        { error: 'Email and aesthetic affinity are required.' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase
      .from('waitlist')
      .select('id, position')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Already in the waitlist.', position: existing.position },
        { status: 409 }
      )
    }

    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })

    const position = (count || 0) + 1

    const { error } = await supabase
      .from('waitlist')
      .insert({ email, name, aesthetic_affinity, position })

    if (error) throw error

    return NextResponse.json({ success: true, position })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
