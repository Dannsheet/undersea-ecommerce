import { supabase } from './supabaseClient';

export const getPublicImageUrl = (path, bucket = 'productos') => {
  if (!path) return null;

  const { data } = supabase.storage
    .from(bucket) // Asegúrate de que 'productos' es el nombre de tu bucket
    .getPublicUrl(path);

  return data?.publicUrl || null;
};
