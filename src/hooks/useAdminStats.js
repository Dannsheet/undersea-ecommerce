import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useAdminStats = () => {
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    ordersToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Usamos Promise.all para ejecutar las consultas en paralelo
        const [productsCount, usersCount, ordersTodayCount] = await Promise.all([
          supabase.from('productos').select('*', { count: 'exact', head: true }),
          supabase.from('usuarios').select('*', { count: 'exact', head: true }),
          supabase.from('ordenes')
            .select('*', { count: 'exact', head: true })
            .gte('fecha', today.toISOString())
            .lt('fecha', tomorrow.toISOString())
        ]);

        if (productsCount.error) throw productsCount.error;
        if (usersCount.error) throw usersCount.error;
        if (ordersTodayCount.error) throw ordersTodayCount.error;

        setStats({
          products: productsCount.count,
          users: usersCount.count,
          ordersToday: ordersTodayCount.count,
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};
