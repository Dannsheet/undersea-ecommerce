import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Key is missing. Make sure to set them in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const fixImagePaths = async () => {
  console.log('Fetching images to fix paths...');

  const { data: images, error } = await supabase
    .from('imagenes_productos_colores')
    .select('id, url');

  if (error) {
    console.error('Error fetching images:', error.message);
    return;
  }

  if (!images || images.length === 0) {
    console.log('No images to process.');
    return;
  }

  console.log(`Found ${images.length} images to process.`);

  let successCount = 0;
  let errorCount = 0;

  for (const image of images) {
    if (!image.url || !image.url.startsWith('http')) {
      continue; // Saltar si ya es un path o es nulo
    }

    try {
      const url = new URL(image.url);
      const pathParts = url.pathname.split('/public/');
      if (pathParts.length > 1) {
        const newPath = pathParts[1];
        
        const { error: updateError } = await supabase
          .from('imagenes_productos_colores')
          .update({ url: newPath }) // Actualizar solo la columna 'url'
          .eq('id', image.id);

        if (updateError) {
          console.error(`Failed to update image ${image.id}:`, updateError.message);
          errorCount++;
        } else {
          successCount++;
        }
      } else {
        console.warn(`Could not extract path from URL for image ${image.id}: ${image.url}`);
        errorCount++;
      }
    } catch (e) {
      console.error(`Invalid URL for image ${image.id}: ${image.url}`, e.message);
      errorCount++;
    }
  }

  console.log('--- Migration Complete ---');
  console.log(`Successfully updated: ${successCount} images.`);
  console.log(`Failed to update: ${errorCount} images.`);
};

fixImagePaths();
