import { NextRequest, NextResponse } from 'next/server'

const PROMPT = `You are UMBRA's AI Archivist. UMBRA is a premium dark archive vault — a visual library of rare, high-aesthetic imagery from around the world.

Analyze this image deeply. Return ONLY valid JSON. No markdown. No preamble. No extra text.

{
  "title": "2-4 word poetic title. Evocative, not literal. Example: 'Harlem Exhales Dusk', 'Stones That Hold Rain'",
  "description": "One atmospheric sentence. Present tense. Max 120 characters. Should feel like a whisper.",
  "aesthetic_tags": ["1-3 values ONLY from this list: Dark Luxury, Quiet Architecture, Raw Documentary, Industrial Pastoral, Sacred Geometry, Neon Noir, Cinematic Decay, East African Light, Urban Pulse, Brutalist Memory, Mediterranean Texture, Wilderness Sublime, Sacred Ritual, Islamic Light, Nordic Silence"],
  "mood_tags": ["1-3 values ONLY from this list: Golden Hour, Blue Hour, Nocturnal, Dusk, Dawn, Electric, Silence, Sacred, Decay, Rain, Gold, Stone, Mist, Fire, Amber, Void"],
  "origin_region": "The most likely geographic region. Be specific. Examples: East Africa, North Africa, East Asia, Middle East, Caribbean, South America, Caucasus, Mediterranean, Scandinavia, West Africa",
  "era": "Decade the image feels like or was likely taken. Examples: 1970s, 1990s, 2000s, 2020s",
  "asset_type": "image",
  "tier_required": "One of: access (standard quality), noir (elevated and moody), prestige (exceptional composition or rarity), obsidian (museum-grade, culturally significant). Be honest — obsidian is rare."
}

Return ONLY the JSON object. Nothing else.`

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not set in environment variables' },
        { status: 500 }
      )
    }

    // Fetch the image from Cloudinary and convert to base64
    // (Gemini requires inline base64 for external URLs)
    let base64Image: string
    let mimeType: string

    try {
      const imageRes = await fetch(url)
      if (!imageRes.ok) throw new Error(`Image fetch failed: ${imageRes.status}`)
      const buffer = await imageRes.arrayBuffer()
      base64Image = Buffer.from(buffer).toString('base64')
      mimeType = imageRes.headers.get('content-type') || 'image/jpeg'
    } catch (e) {
      return NextResponse.json(
        { error: `Could not fetch image: ${String(e)}` },
        { status: 400 }
      )
    }

    // Call Gemini 1.5 Flash (free tier: 15 RPM, 1M tokens/day)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
                {
                  text: PROMPT,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      return NextResponse.json(
        { error: 'Gemini API error', detail: errText },
        { status: 500 }
      )
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Strip markdown fences if model adds them
    const clean = rawText.replace(/```json|```/g, '').trim()

    let metadata
    try {
      metadata = JSON.parse(clean)
    } catch {
      return NextResponse.json(
        { error: 'JSON parse failed', raw: rawText },
        { status: 500 }
      )
    }

    return NextResponse.json({ metadata })
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error', detail: String(err) },
      { status: 500 }
    )
  }
}
