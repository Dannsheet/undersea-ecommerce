import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Make sure to set them in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const updateImageUrls = async () => {
  console.log('Fetching images to update...');

  const { data: images, error } = await supabase
    .from('imagenes_productos_colores')
    .select('id, url');

  if (error) {
    console.error('Error fetching images:', error.message);
    return;
  }

  if (!images || images.length === 0) {
    console.log('No images to update.');
    return;
  }

  console.log(`Found ${images.length} images to process.`);

  const updates = [];
  for (const image of images) {
    // Si la URL ya es una URL pública completa, la saltamos
    if (image.url.startsWith('http')) {
      continue;
    }

    // La 'url' actual es en realidad el 'path' del archivo en el bucket
    const filePath = image.url;
    const { data: publicUrlData } = supabase.storage
      .from('productos') // Asegúrate de que 'productos' es el nombre de tu bucket
      .getPublicUrl(filePath);

    if (publicUrlData) {
      updates.push({
        id: image.id,
        url: publicUrlData.publicUrl,
      });
    }
  }

  if (updates.length === 0) {
    console.log('No URLs needed updating.');
    return;
  }

  console.log(`Updating ${updates.length} image URLs...`);

  const { error: updateError } = await supabase
    .from('imagenes_productos_colores')
    .upsert(updates);

  if (updateError) {
    console.error('Error updating URLs:', updateError.message);
  } else {
    console.log('Successfully updated all image URLs!');
  }
};

updateImageUrls();
