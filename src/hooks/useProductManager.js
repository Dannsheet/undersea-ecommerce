import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useImageUploader } from './useImageUploader';

export const useProductManager = () => {
  const { uploadImages, isUploading } = useImageUploader();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveProduct = async ({ productData, variantsData }) => {
    setLoading(true);
    setError(null);

    try {
      let productId;

      // Paso 1: Crear o actualizar el producto principal
      if (productData.id) {
        // Actualizar producto existente
        const { data: updatedProduct, error: productError } = await supabase
          .from('productos')
          .update(productData)
          .eq('id', productData.id)
          .select()
          .single();
        
        if (productError) throw productError;
        productId = updatedProduct.id;
      } else {
        // Crear nuevo producto
        const { data: newProduct, error: productError } = await supabase
          .from('productos')
          .insert(productData)
          .select()
          .single();
        
        if (productError) throw productError;
        productId = newProduct.id;
      }

      // Paso 2 y 3: Procesar variantes (inventario e imágenes)
      if (variantsData && variantsData.length > 0) {
        for (const variant of variantsData) {
          // Subir imágenes nuevas para esta variante (color)
          const newImageFiles = variant.images.filter(img => img.file);
          let newImageObjects = [];
          if (newImageFiles.length > 0) {
            newImageObjects = await uploadImages(newImageFiles.map(img => img.file), productId, variant.color);
          }

          // Guardar las URLs de las nuevas imágenes
          if (newImageObjects.length > 0) {
            const imageRecords = newImageObjects.map(imgObj => ({
              producto_id: productId,
              color: variant.color,
              url: imgObj.path, // Guardamos el path, no la URL
              orden: imgObj.orden,
            }));
            const { error: imageError } = await supabase.from('imagenes_productos_colores').insert(imageRecords);
            if (imageError) console.warn(`Error guardando imágenes para el color ${variant.color}:`, imageError.message);
          }

          // Preparar los datos de inventario para esta variante
          if (variant.sizes && variant.sizes.length > 0) {
            const inventoryRecords = variant.sizes.map(size => ({
              producto_id: productId,
              color: variant.color,
              talla: size.talla,
              stock: size.stock,
            }));

            // Usar upsert para insertar o actualizar el inventario
            const { error: inventoryError } = await supabase
              .from('inventario_productos')
              .upsert(inventoryRecords, { onConflict: 'producto_id, color, talla' });

            if (inventoryError) throw new Error(`Error al guardar el inventario para el color ${variant.color}: ${inventoryError.message}`);
          }
        }
      }  

      return { success: true, productId };

    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { saveProduct, loading: loading || isUploading, error };
};
