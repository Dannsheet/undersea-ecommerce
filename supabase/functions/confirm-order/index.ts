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

    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser()

    if (userError) {
      console.error('confirm-order auth.getUser error:', userError)
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
      console.error('confirm-order adminProfileError:', adminProfileError)
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
      .select('id, estado, orden_items ( producto_id, color, talla, cantidad )')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) {
      console.error('confirm-order orderError:', orderError)
      return jsonResponse(req, { error: 'Order not found' }, 404)
    }

    if (!order) {
      return jsonResponse(req, { error: 'Order not found' }, 404)
    }

    if (String(order.estado || '').toLowerCase() === 'pagado') {
      return jsonResponse(req, { ok: true }, 200)
    }

    const items = (order.orden_items ?? []) as Array<{
      producto_id: string
      color: string | null
      talla: string | null
      cantidad: number
    }>

    if (!items.length) {
      return jsonResponse(req, { error: 'Order has no items' }, 400)
    }

    for (const item of items) {
      const productoId = String(item.producto_id ?? '').trim()
      const color = String(item.color ?? '').trim()
      const talla = String(item.talla ?? '').trim()
      const qty = Number(item.cantidad ?? 0)

      if (!productoId || !color || !talla || !Number.isFinite(qty) || qty <= 0) {
        return jsonResponse(req, { error: 'Invalid order item' }, 400)
      }

      const { data: invRow, error: invError } = await supabaseAdmin
        .from('inventario_productos')
        .select('id, stock')
        .eq('producto_id', productoId)
        .eq('color', color)
        .eq('talla', talla)
        .maybeSingle()

      if (invError || !invRow) {
        console.error('confirm-order invError:', invError)
        return jsonResponse(req, { error: 'Inventory item not found' }, 400)
      }

      const currentStock = Number(invRow.stock ?? 0)
      if (!Number.isFinite(currentStock) || currentStock < qty) {
        return jsonResponse(req, { error: 'Insufficient stock' }, 400)
      }

      const nextStock = currentStock - qty

      const { error: updateInvError } = await supabaseAdmin
        .from('inventario_productos')
        .update({ stock: nextStock })
        .eq('id', invRow.id)

      if (updateInvError) {
        console.error('confirm-order updateInvError:', updateInvError)
        return jsonResponse(req, { error: 'Could not update inventory' }, 400)
      }
    }

    const { error: updateOrderError } = await supabaseAdmin
      .from('ordenes')
      .update({ estado: 'pagado' })
      .eq('id', orderId)

    if (updateOrderError) {
      console.error('confirm-order updateOrderError:', updateOrderError)
      return jsonResponse(req, { error: 'Could not confirm order' }, 400)
    }

    return jsonResponse(req, { ok: true }, 200)
  } catch (error) {
    console.error('confirm-order unexpected error:', error)
    return jsonResponse(req, { error: 'Unexpected error' }, 500)
  }
})
