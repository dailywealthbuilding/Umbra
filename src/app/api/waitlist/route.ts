import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const sb     = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

// ─── HTML EMAIL TEMPLATE ───
function buildEmail(name: string | null, position: number): string {
  const displayName = name ? name.split(' ')[0] : 'Wanderer'
  const posStr      = String(position).padStart(3, '0')
  const isFounding  = position <= 100

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>UMBRA — You Are In The Shadow</title>
</head>
<body style="margin:0;padding:0;background:#030305;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#030305;">
  <tr><td align="center" style="padding:48px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

      <!-- HEADER -->
      <tr>
        <td style="border-bottom:1px solid rgba(201,168,76,.15);padding-bottom:32px;text-align:center;">
          <span style="font-family:Georgia,serif;font-size:11px;letter-spacing:10px;text-transform:uppercase;color:#9a7a36;display:block;margin-bottom:18px;">
            TEMPEST GROUP
          </span>
          <span style="font-family:Georgia,serif;font-size:62px;font-weight:bold;letter-spacing:8px;color:transparent;background:linear-gradient(165deg,#9a7a36,#c9a84c,#f0d98a,#c9a84c,#9a7a36);-webkit-background-clip:text;background-clip:text;display:block;line-height:1;">
            UMBRA
          </span>
        </td>
      </tr>

      <!-- POSITION -->
      <tr>
        <td style="padding:48px 0 32px;text-align:center;">
          <span style="font-family:Courier New,monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:#787890;display:block;margin-bottom:20px;">
            SHADOW POSITION
          </span>
          <span style="font-family:Georgia,serif;font-size:72px;font-weight:bold;color:#c9a84c;letter-spacing:4px;display:block;line-height:1;text-shadow:0 0 60px rgba(201,168,76,.3);">
            #${posStr}
          </span>
          ${isFounding ? `
          <span style="display:inline-block;margin-top:18px;font-family:Courier New,monospace;font-size:8px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;border:1px solid rgba(201,168,76,.35);padding:6px 16px;background:rgba(201,168,76,.05);">
            FOUNDING MEMBER
          </span>
          ` : ''}
        </td>
      </tr>

      <!-- RULE -->
      <tr>
        <td style="padding:0 0 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,.2),transparent);font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:0 0 40px;">
          <p style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#c4c4dc;line-height:1.8;margin:0 0 24px;letter-spacing:.5px;">
            ${displayName}.
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#c4c4dc;line-height:1.95;margin:0 0 20px;font-weight:300;">
            You are in the shadow now. Position <strong style="color:#eeeef8;font-weight:400;">#${posStr}</strong> in the queue — recorded, locked, permanent.
          </p>
          ${isFounding ? `
          <p style="font-family:Georgia,serif;font-size:16px;color:#c4c4dc;line-height:1.95;margin:0 0 20px;font-weight:300;">
            You are among the <strong style="color:#c9a84c;font-weight:400;">Founding 100</strong>. Your access price is locked in forever — the rate you pay today is the rate you pay in five years. That offer will never be made again.
          </p>
          ` : `
          <p style="font-family:Georgia,serif;font-size:16px;color:#c4c4dc;line-height:1.95;margin:0 0 20px;font-weight:300;">
            When the door opens, you will be the first to know. One email. No reminders. No marketing. Just a signal — the shadow is ready.
          </p>
          `}
          <p style="font-family:Georgia,serif;font-size:16px;color:#c4c4dc;line-height:1.95;margin:0;font-weight:300;">
            Until then — this is proof you were early.
          </p>
        </td>
      </tr>

      <!-- RULE 2 -->
      <tr>
        <td style="padding:0 0 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,.12),transparent);font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- WHAT IS UMBRA -->
      <tr>
        <td style="padding:0 0 40px;">
          <span style="font-family:Courier New,monospace;font-size:8px;letter-spacing:5px;text-transform:uppercase;color:#787890;display:block;margin-bottom:20px;">
            WHAT UMBRA IS
          </span>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${[
              ['THE LIBRARY','Aesthetic assets — photography, digital art, fine art — curated to a single standard. No floor drop. Ever.'],
              ['SIGNAL RADIO','An ambient broadcast that never stops. Curated aesthetic audio, live, 24 hours.'],
              ['THE BLOCK','Limited auctions with expiry dates. When it is gone, it is gone. Scarcity as design principle.'],
              ['SENSORY ENGINE','Type a mood, a texture, a feeling. The library answers with aesthetic resonance — not keyword matches.'],
            ].map(([title, desc]) => `
            <tr>
              <td style="padding:0 0 16px;">
                <span style="font-family:Courier New,monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;display:block;margin-bottom:6px;">${title}</span>
                <span style="font-family:Georgia,serif;font-size:14px;color:#9898b4;line-height:1.75;display:block;">${desc}</span>
              </td>
            </tr>`).join('')}
          </table>
        </td>
      </tr>

      <!-- RULE 3 -->
      <tr>
        <td style="padding:0 0 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,.12),transparent);font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CLOSING -->
      <tr>
        <td style="padding:0 0 48px;text-align:center;">
          <p style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#787890;line-height:2;margin:0 0 32px;">
            What is limited is respected.<br/>
            What is rare is real.<br/>
            <span style="color:#c9a84c;">What is beautiful — belongs.</span>
          </p>
          <span style="font-family:Courier New,monospace;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#9a7a36;display:block;">
            TEMPEST GROUP
          </span>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="border-top:1px solid rgba(255,255,255,.04);padding-top:24px;text-align:center;">
          <span style="font-family:Courier New,monospace;font-size:8px;letter-spacing:2px;color:rgba(255,255,255,.18);display:block;">
            &copy; 2026 Tempest Group &nbsp;&middot;&nbsp; All rights reserved
          </span>
          <span style="font-family:Courier New,monospace;font-size:8px;letter-spacing:2px;color:rgba(255,255,255,.1);display:block;margin-top:8px;">
            You received this because you joined the UMBRA waitlist.
          </span>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

export async function POST(req: Request) {
  try {
    const { name, email, aesthetic_affinity } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // Check existing
    const { data: ex } = await sb.from('waitlist').select('id,position').eq('email', email).single()
    if (ex) {
      const { count } = await sb.from('waitlist').select('*', { count: 'exact', head: true })
      return NextResponse.json({ message: 'Already registered', position: ex.position || count || 1 }, { status: 409 })
    }

    // Insert
    const { count: cur } = await sb.from('waitlist').select('*', { count: 'exact', head: true })
    const position = (cur || 0) + 1
    const { error: dbErr } = await sb.from('waitlist').insert({
      name: name || null,
      email,
      aesthetic_affinity: aesthetic_affinity || null,
      position
    })
    if (dbErr) throw dbErr

    // Send confirmation email
    const isFounding = position <= 100
    const subject    = isFounding
      ? `UMBRA — You Are Among The Founding 100 · #${String(position).padStart(3,'0')}`
      : `UMBRA — You Are In The Shadow · #${String(position).padStart(3,'0')}`

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from:    'UMBRA <onboarding@resend.dev>',
        to:      [email],
        subject,
        html:    buildEmail(name || null, position),
      }).catch(e => {
        // Don't fail the request if email fails — log silently
        console.error('[UMBRA] Email send failed:', e)
      })
    }

    return NextResponse.json({ success: true, position }, { status: 201 })

  } catch(e: unknown) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
