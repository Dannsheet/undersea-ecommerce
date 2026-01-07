import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = (req: Request) => {
  const frontendUrl = (Deno.env.get('FRONTEND_URL') ?? '').trim().replace(/\/$/, '')
  const origin = (req.headers.get('origin') ?? '').trim()

  const allowedOrigins = [
    frontendUrl,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ].filter(Boolean)

  const allowOrigin = allowedOrigins.includes(origin) ? origin : frontendUrl || '*'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

const jsonResponse = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    status,
  })

const base64UrlEncode = (bytes: Uint8Array) => {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const sha256Hex = async (input: string) => {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405)
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const email = String(payload?.email ?? '').trim().toLowerCase()

    if (!email) {
      return jsonResponse(req, { error: 'Email is required' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const frontendUrlSecret = (Deno.env.get('FRONTEND_URL') ?? '').trim().replace(/\/$/, '')
    const requestOrigin = (req.headers.get('origin') ?? '').trim().replace(/\/$/, '')
    const frontendUrl = frontendUrlSecret || requestOrigin

    if (!supabaseUrl || !serviceRoleKey || !frontendUrl) {
      const missing = {
        SUPABASE_URL: !supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !serviceRoleKey,
        FRONTEND_URL_ORIGIN: !frontendUrl,
      }
      console.error('request-password-reset misconfigured:', missing)
      return jsonResponse(req, { error: 'Server is not configured', missing }, 500)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: userRow, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      console.error('request-password-reset lookup error:', userError)
      return jsonResponse(req, { ok: true }, 200)
    }

    if (!userRow?.id) {
      return jsonResponse(req, { ok: true }, 200)
    }

    const tokenBytes = crypto.getRandomValues(new Uint8Array(32))
    const token = base64UrlEncode(tokenBytes)
    const tokenHash = await sha256Hex(token)

    const expiresMinutes = Number(Deno.env.get('RESET_TOKEN_EXPIRES_MINUTES') ?? '30')
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000).toISOString()

    const { error: insertError } = await supabaseAdmin.from('password_resets').insert({
      user_id: userRow.id,
      token: tokenHash,
      expires_at: expiresAt,
      used: false,
    })

    if (insertError) {
      console.error('request-password-reset insert error:', insertError)
      return jsonResponse(req, { ok: true }, 200)
    }

    const brevoApiKey = Deno.env.get('BREVO_API_KEY') ?? ''
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') ?? ''
    const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'UNDERSEA'

    if (!brevoApiKey || !senderEmail) {
      console.error('request-password-reset missing Brevo config')
      return jsonResponse(req, { ok: true }, 200)
    }

    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;line-height:1.5;">
        <h2 style="margin:0 0 12px;">Restablecer contraseña</h2>
        <p style="margin:0 0 16px;">Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este correo.</p>
        <p style="margin:0 0 16px;">
          <a href="${resetUrl}" style="background:#111;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block;">
            Restablecer contraseña
          </a>
        </p>
        <p style="margin:0;color:#666;font-size:12px;">Este enlace expira en ${expiresMinutes} minutos.</p>
      </div>
    `

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email }],
        subject: 'Restablecimiento de contraseña',
        htmlContent,
        headers: {
          'X-Mailin-Track-Clicks': '0',
          'X-Mailin-Track-Opens': '0',
        },
      }),
    })

    if (!brevoRes.ok) {
      const details = await brevoRes.text().catch(() => '')
      console.error('request-password-reset Brevo send error:', details)
      return jsonResponse(req, { ok: true }, 200)
    }

    return jsonResponse(req, { ok: true }, 200)
  } catch (error) {
    console.error('request-password-reset unexpected error:', error)
    return jsonResponse(req, { ok: true }, 200)
  }
})
