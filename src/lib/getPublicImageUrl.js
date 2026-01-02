import { supabase } from './supabaseClient';

export const getPublicImageUrl = (path) => {
  if (!path) return null;

  const { data } = supabase.storage
    .from('productos') // Asegúrate de que 'productos' es el nombre de tu bucket
    .getPublicUrl(path);

  return data?.publicUrl || null;
};
