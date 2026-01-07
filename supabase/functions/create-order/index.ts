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

type CreateOrderItemInput = {
  producto_id: string
  color?: string
  talla?: string
  quantity?: number
  cantidad?: number
}

type ProductRow = {
  id: string
  nombre: string | null
  precio: number | string | null
}

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

    if (userError || !user) {
      return jsonResponse(req, { error: 'Unauthorized' }, 401)
    }

    const payload = await req.json().catch(() => ({}))
    const items = (payload?.items ?? []) as CreateOrderItemInput[]

    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse(req, { error: 'Items are required' }, 400)
    }

    const normalized = items
      .map((it) => {
        const qty = Number.isFinite(Number(it?.cantidad)) ? Number(it.cantidad) : Number(it?.quantity)
        return {
          producto_id: String(it?.producto_id ?? '').trim(),
          color: String(it?.color ?? '').trim(),
          talla: String(it?.talla ?? '').trim(),
          cantidad: Number.isFinite(qty) ? qty : 0,
        }
      })
      .filter((it) => it.producto_id && it.color && it.talla && it.cantidad > 0)

    if (normalized.length === 0) {
      return jsonResponse(req, { error: 'Items are invalid' }, 400)
    }

    const productIds = Array.from(new Set(normalized.map((it) => it.producto_id)))

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: products, error: productsError } = await supabaseAdmin
      .from('productos')
      .select('id, nombre, precio')
      .in('id', productIds)

    if (productsError) {
      console.error('create-order productsError:', productsError)
      return jsonResponse(req, { error: 'Could not load products' }, 400)
    }

    const safeProducts = (products ?? []) as ProductRow[]
    const productById = new Map(
      safeProducts.map((p) => [String(p.id), { nombre: p.nombre ?? 'Producto', precio: Number(p.precio ?? 0) }])
    )

    const orderItems = normalized.map((it) => {
      const product = productById.get(it.producto_id)
      const unitPrice = Number.isFinite(product?.precio) ? Number(product?.precio) : 0

      return {
        producto_id: it.producto_id,
        color: it.color,
        talla: it.talla,
        cantidad: it.cantidad,
        precio: unitPrice,
      }
    })

    const total = orderItems.reduce((sum, it) => sum + Number(it.precio || 0) * Number(it.cantidad || 0), 0)

    const { data: orderRow, error: orderError } = await supabaseAdmin
      .from('ordenes')
      .insert({
        usuario_id: user.id,
        estado: 'pendiente',
        total,
        fecha: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (orderError || !orderRow?.id) {
      console.error('create-order orderError:', orderError)
      return jsonResponse(req, { error: 'Could not create order' }, 400)
    }

    const orderId = String(orderRow.id)

    const { error: itemsError } = await supabaseAdmin.from('orden_items').insert(
      orderItems.map((it) => ({
        orden_id: orderId,
        producto_id: it.producto_id,
        color: it.color,
        talla: it.talla,
        cantidad: it.cantidad,
        precio: it.precio,
      }))
    )

    if (itemsError) {
      console.error('create-order itemsError:', itemsError)
      return jsonResponse(req, { error: 'Could not create order items' }, 400)
    }

    return jsonResponse(req, { ok: true, orderId }, 200)
  } catch (error) {
    console.error('create-order unexpected error:', error)
    return jsonResponse(req, { error: 'Unexpected error' }, 500)
  }
})
