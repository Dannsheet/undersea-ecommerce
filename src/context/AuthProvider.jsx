import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// 1. Crear el contexto y exportarlo para que el hook lo pueda usar
export const AuthContext = createContext();

// 2. Crear el proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // Estado para el perfil de public.usuarios
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificamos la sesión activa al cargar la app
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Escuchamos cambios en el estado de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Limpiamos el listener al desmontar el componente
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // useEffect para obtener el perfil del usuario cuando la sesión cambia
  useEffect(() => {
    // Si no hay un usuario, nos aseguramos de que el perfil esté limpio.
    if (!user) {
      setProfile(null);
      return;
    }

    // Si hay un usuario, buscamos su perfil.
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      // En caso de error o si el perfil no se encuentra, lo dejamos como nulo.
      if (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  // 3. Definir las funciones y valores que proveerá el contexto
  const value = {
    session,
    user,
    profile, // Exponer el perfil del usuario
    loading,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
  };

  // Si no está cargando, renderizamos los hijos
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
