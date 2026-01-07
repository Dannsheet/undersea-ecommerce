import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': ((Deno.env.get('FRONTEND_URL') ?? '').trim().replace(/\/$/, '') || '*'),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })

const sha256Hex = async (input: string) => {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const token = String(payload?.token ?? '').trim()
    const newPassword = String(payload?.newPassword ?? '')

    if (!token) {
      return jsonResponse({ error: 'Token is required' }, 400)
    }

    if (newPassword.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Server is not configured' }, 500)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const tokenHash = await sha256Hex(token)

    const { data: resetRow, error: resetError } = await supabaseAdmin
      .from('password_resets')
      .select('id, user_id, used, expires_at')
      .eq('token', tokenHash)
      .maybeSingle()

    if (resetError) {
      console.error('reset-password-with-token lookup error:', resetError)
      return jsonResponse({ error: 'Invalid or expired token' }, 400)
    }

    const expiresAtMs = new Date(String(resetRow?.expires_at ?? '')).getTime()
    if (!resetRow || resetRow.used || !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      return jsonResponse({ error: 'Invalid or expired token' }, 400)
    }

    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
      resetRow.user_id,
      { password: newPassword }
    )

    if (updateUserError) {
      console.error('reset-password-with-token update user error:', updateUserError)
      return jsonResponse({ error: 'Could not update password' }, 400)
    }

    const { error: markUsedError } = await supabaseAdmin
      .from('password_resets')
      .update({ used: true })
      .eq('id', resetRow.id)
      .eq('used', false)

    if (markUsedError) {
      console.error('reset-password-with-token mark used error:', markUsedError)
    }

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    console.error('reset-password-with-token unexpected error:', error)
    return jsonResponse({ error: 'Unexpected error' }, 500)
  }
})
