import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getPublicImageUrl } from '../../lib/getPublicImageUrl';
import './ImageSlider.css';

const FALLBACK_ITEMS = [
  { id: 'fallback-1', imageUrl: '/fondo-imagen-3.webp', titulo: '' },
  { id: 'fallback-2', imageUrl: '/fondo-imagen-2.webp', titulo: '' },
  { id: 'fallback-3', imageUrl: '/fondo-imagen-1.webp', titulo: '' },
];

const TABLE_NAME = 'home_first_section_items';
const BUCKET_NAME = 'home';

const ImageSlider = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchItems = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id, titulo, image_path, orden, activo')
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (!isMounted) return;

      if (error) {
        setItems([]);
      } else {
        const normalized = (data || [])
          .map((row) => ({
            id: row.id,
            titulo: row.titulo || '',
            imageUrl: getPublicImageUrl(row.image_path, BUCKET_NAME) || '',
          }))
          .filter((row) => !!row.imageUrl);

        setItems(normalized);
      }

      setLoading(false);
    };

    fetchItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayItems = useMemo(() => {
    return items.length > 0 ? items : FALLBACK_ITEMS;
  }, [items]);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;
    if (displayItems.length <= 1) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const clear = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    clear();

    intervalRef.current = setInterval(() => {
      const firstCard = container.querySelector('.first-section-card');
      if (!firstCard) return;

      const cardWidth = firstCard.getBoundingClientRect().width;
      const gapValue = getComputedStyle(container).gap;
      const gap = parseFloat(String(gapValue).split(' ')[0]) || 0;
      const step = cardWidth + gap;

      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const nextLeft = container.scrollLeft + step;

      if (nextLeft >= maxScrollLeft - 2) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollTo({ left: nextLeft, behavior: 'smooth' });
      }
    }, 3500);

    return () => clear();
  }, [displayItems.length]);

  return (
    <section className="first-section">
      <div className="first-section-wrapper">
        <div className="first-section-carousel" ref={carouselRef}>
          {(loading ? FALLBACK_ITEMS : displayItems).map((item) => (
            <article className="first-section-card" key={item.id}>
              <img
                src={item.imageUrl}
                alt={item.titulo || 'Imagen'}
                className="first-section-img"
                loading="lazy"
              />
              <div className="first-section-caption">{item.titulo || ''}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImageSlider;