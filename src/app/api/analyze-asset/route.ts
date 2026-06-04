import { NextRequest, NextResponse } from 'next/server'

const PROMPT = `You are UMBRA's AI Archivist. UMBRA is a premium dark archive vault — a visual library of rare, high-aesthetic imagery from around the world.

Analyze this image deeply. Return ONLY valid JSON. No markdown. No preamble. No extra text whatsoever.

{
  "title": "2-4 word poetic title. Evocative, not literal. Example: 'Harlem Exhales Dusk', 'Stones That Hold Rain', 'Nairobi Before Traffic'",
  "description": "One atmospheric sentence. Present tense. Max 120 characters. Should feel like a whisper.",
  "aesthetic_tags": ["1-3 values ONLY from: Dark Luxury, Quiet Architecture, Raw Documentary, Industrial Pastoral, Sacred Geometry, Neon Noir, Cinematic Decay, East African Light, Urban Pulse, Brutalist Memory, Mediterranean Texture, Wilderness Sublime, Sacred Ritual, Islamic Light, Nordic Silence"],
  "mood_tags": ["1-3 values ONLY from: Golden Hour, Blue Hour, Nocturnal, Dusk, Dawn, Electric, Silence, Sacred, Decay, Rain, Gold, Stone, Mist, Fire, Amber, Void"],
  "origin_region": "Most likely geographic region. Examples: East Africa, North Africa, East Asia, Middle East, Caribbean, South America, Caucasus, Mediterranean, Scandinavia, West Africa, South Asia",
  "era": "Decade the image feels like or was taken. Examples: 1970s, 1990s, 2000s, 2020s",
  "asset_type": "image",
  "tier_required": "One of: access (standard), noir (elevated, moody), prestige (exceptional composition), obsidian (museum-grade, culturally significant). Be honest — obsidian is rare, most images are access or noir."
}

Return ONLY the JSON object. Nothing else.`

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured in Vercel environment variables' },
        { status: 500 }
      )
    }

    // Fetch image from Cloudinary and convert to base64
    let base64Image: string
    let mimeType: string

    try {
      const imageRes = await fetch(url)
      if (!imageRes.ok) throw new Error(`Fetch failed with status ${imageRes.status}`)
      const buffer = await imageRes.arrayBuffer()
      base64Image = Buffer.from(buffer).toString('base64')
      mimeType = imageRes.headers.get('content-type') || 'image/jpeg'
    } catch (e) {
      return NextResponse.json(
        { error: 'Could not fetch image from Cloudinary', detail: String(e) },
        { status: 400 }
      )
    }

    // Call OpenRouter — OpenAI-compatible format
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://umbra-wine.vercel.app',
        'X-Title': 'UMBRA Vault',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
              {
                type: 'text',
                text: PROMPT,
              },
            ],
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json(
        { error: 'OpenRouter API error', detail: errText },
        { status: 500 }
      )
    }

    const data = await response.json()
    const rawText: string = data.choices?.[0]?.message?.content || ''

    if (!rawText) {
      return NextResponse.json(
        { error: 'Empty response from model', raw: data },
        { status: 500 }
      )
    }

    // Strip markdown fences if model wraps response
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
