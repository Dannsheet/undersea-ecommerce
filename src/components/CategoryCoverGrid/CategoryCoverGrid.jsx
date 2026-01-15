import { useMemo } from 'react';
import { getPublicImageUrl } from '../../lib/getPublicImageUrl';
import './CategoryCoverGrid.css';

const BUCKET_NAME = 'home';

const CategoryCoverGrid = ({ title, items }) => {
  const normalizedItems = useMemo(() => {
    return Array.isArray(items) ? items.slice(0, 4) : [];
  }, [items]);

  if (normalizedItems.length !== 4) return null;

  return (
    <section className="category-cover-section">
      {title ? <h2 className="category-cover-title">{title}</h2> : null}
      <div className="category-cover-grid" role="list">
        {normalizedItems.map((item) => {
          const src = item?.image_path ? getPublicImageUrl(item.image_path, BUCKET_NAME) : null;
          if (!src) return null;
          return (
            <div key={item.id} className="category-cover-tile" role="listitem">
              <img className="category-cover-img" src={src} alt={item?.alt || title || 'Portada'} loading="lazy" />
              <div className="category-cover-overlay" />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryCoverGrid;
