import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useImageUploader = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImages = async (files, productId, color) => {
    setIsUploading(true);
    const uploadedObjects = [];

    // Determinar el orden inicial para las nuevas imágenes
    const { data: existingImages, error: countError } = await supabase
      .from('imagenes_productos_colores')
      .select('orden', { count: 'exact' })
      .eq('producto_id', productId)
      .eq('color', color);

    if (countError) {
      console.error('Error counting existing images:', countError);
      // Continuar, pero el orden puede no ser perfecto
    }

    let currentOrder = existingImages ? existingImages.length : 0;

    if (!files || files.length === 0) {
      setIsUploading(false);
      return [];
    }

    for (const file of files) {
      const fileName = `${productId}-${Date.now()}-${file.name}`;
      const filePath = `productos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Podríamos decidir si continuar o parar aquí
        continue; // Saltar este archivo y continuar con el siguiente
      }

      // Obtener la URL pública de la imagen subida
            
      if (uploadData.path) {
        currentOrder++;
        // Devolvemos el path, no la URL pública
        uploadedObjects.push({ path: uploadData.path, orden: currentOrder });
      }
    }

    setIsUploading(false);
    return uploadedObjects;
  };

  return { uploadImages, isUploading };
};
