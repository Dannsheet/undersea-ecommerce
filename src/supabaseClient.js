// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// **¡Importante!** La forma de acceder depende de tu entorno:
// Usa `import.meta.env.VITE_NOMBRE` si usas Vite.
// Usa `process.env.REACT_APP_NOMBRE` si usas CRA.

// -----------------------------------------------------------------
// Opción A: Usando Vite (Lo más probable si es un proyecto nuevo)
// -----------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/*
// -----------------------------------------------------------------
// Opción B: Usando Create React App (CRA)
// -----------------------------------------------------------------
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
*/


// Asegúrate de que las variables existan antes de inicializar el cliente (buena práctica)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan variables de entorno de Supabase. Revisa tu archivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);