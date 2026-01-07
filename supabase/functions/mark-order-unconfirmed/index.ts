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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse(req, { error: 'Server is not configured' }, 500)
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      return jsonResponse(req, { error: 'Unauthorized', details: 'Missing Bearer token' }, 401)
    }

    const supabaseUserClient = createClient(supabaseUrl, anonKey)

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser(token)

    if (userError) {
      console.error('mark-order-unconfirmed auth.getUser error:', userError)
      return jsonResponse(req, { error: 'Unauthorized', details: userError.message }, 401)
    }

    if (!user) {
      return jsonResponse(req, { error: 'Unauthorized', details: 'No user in session' }, 401)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle()

    if (adminProfileError) {
      console.error('mark-order-unconfirmed adminProfileError:', adminProfileError)
      return jsonResponse(req, { error: 'Unauthorized' }, 401)
    }

    if (adminProfile?.rol !== 'admin') {
      return jsonResponse(req, { error: 'Forbidden' }, 403)
    }

    const payload = await req.json().catch(() => ({}))
    const orderId = String(payload?.orderId ?? '').trim()

    if (!orderId) {
      return jsonResponse(req, { error: 'orderId is required' }, 400)
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('ordenes')
      .select('id, estado')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      console.error('mark-order-unconfirmed orderError:', orderError)
      return jsonResponse(req, { error: 'Order not found' }, 404)
    }

    if (String(order.estado || '').toLowerCase() === 'pagado') {
      return jsonResponse(req, { error: 'Order is already confirmed' }, 400)
    }

    const { error: updateError } = await supabaseAdmin
      .from('ordenes')
      .update({ estado: 'pendiente' })
      .eq('id', orderId)

    if (updateError) {
      console.error('mark-order-unconfirmed updateError:', updateError)
      return jsonResponse(req, { error: 'Could not update order' }, 400)
    }

    return jsonResponse(req, { ok: true }, 200)
  } catch (error) {
    console.error('mark-order-unconfirmed unexpected error:', error)
    return jsonResponse(req, { error: 'Unexpected error' }, 500)
  }
})
