import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // O un origen específico
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de la solicitud pre-vuelo CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { productId } = await req.json()

    if (!productId) {
      throw new Error('Product ID is required.')
    }

    // 1. Obtener las URLs de las imágenes a eliminar
    const { data: images, error: imagesError } = await supabaseClient
      .from('imagenes_productos_colores')
      .select('url')
      .eq('producto_id', productId)

    if (imagesError) throw imagesError

    // 2. Extraer los nombres de los archivos y eliminarlos del bucket
    if (images && images.length > 0) {
      const filePaths = images.map(image => image.url).filter(Boolean);

      const { error: storageError } = await supabaseClient
        .storage
        .from('productos') // Nombre del bucket
        .remove(filePaths)

      if (storageError) {
        console.warn('Could not delete some images from storage:', storageError.message)
        // No lanzamos error para continuar con la eliminación de la DB
      }
    }

    // 3. Eliminar registros de la tabla de imágenes
    const { error: deleteImagesError } = await supabaseClient
      .from('imagenes_productos_colores')
      .delete()
      .eq('producto_id', productId)

    if (deleteImagesError) throw deleteImagesError

    // 4. Eliminar registros de la tabla de inventario
    const { error: deleteInventoryError } = await supabaseClient
      .from('inventario_productos')
      .delete()
      .eq('producto_id', productId)

    if (deleteInventoryError) throw deleteInventoryError

    // 5. Eliminar el producto de la tabla de productos
    const { error: deleteProductError } = await supabaseClient
      .from('productos')
      .delete()
      .eq('id', productId)

    if (deleteProductError) throw deleteProductError

    return new Response(JSON.stringify({ message: 'Product deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
