import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export async function POST(req: Request) {
  try {
    const { name, email, aesthetic_affinity } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    const { data: ex } = await sb.from('waitlist').select('id,position').eq('email', email).single()
    if (ex) {
      const { count } = await sb.from('waitlist').select('*', { count: 'exact', head: true })
      return NextResponse.json({ message: 'Already registered', position: ex.position || count || 1 }, { status: 409 })
    }
    const { count: cur } = await sb.from('waitlist').select('*', { count: 'exact', head: true })
    const position = (cur || 0) + 1
    const { error } = await sb.from('waitlist').insert({ name: name || null, email, aesthetic_affinity: aesthetic_affinity || null, position })
    if (error) throw error
    return NextResponse.json({ success: true, position }, { status: 201 })
  } catch(e: unknown) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
