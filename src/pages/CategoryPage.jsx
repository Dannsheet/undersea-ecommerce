import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Loader from '../components/Loader';
import './CategoryPage.css';
import { getPublicImageUrl } from '../lib/getPublicImageUrl';
import CategoryCoverGrid from '../components/CategoryCoverGrid/CategoryCoverGrid';

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverTitle, setCoverTitle] = useState('');
  const [coverItems, setCoverItems] = useState([]);
  const [coverEnabled, setCoverEnabled] = useState(false);

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      setLoading(true);

      // 1. Encontrar el ID de la categoría a partir del slug
      const { data: categoryData, error: categoryError } = await supabase
        .from('categorias')
        .select('id, nombre')
        .eq('slug', slug)
        .single();

      if (categoryError || !categoryData) {
        console.error('Error fetching category:', categoryError);
        setLoading(false);
        return;
      }

      setCategory(categoryData);

      const { data: coverData, error: coverError } = await supabase
        .from('category_covers')
        .select('id, titulo, enabled')
        .eq('category_slug', slug)
        .limit(1);

      if (coverError) {
        console.error('Error fetching category cover:', coverError);
        setCoverTitle('');
        setCoverItems([]);
        setCoverEnabled(false);
      } else {
        const currentCover = coverData?.[0] || null;
        const isEnabled = Boolean(currentCover?.enabled);
        setCoverEnabled(isEnabled);
        setCoverTitle(String(currentCover?.titulo || '').trim());

        if (isEnabled && currentCover?.id) {
          const { data: coverItemsData, error: coverItemsError } = await supabase
            .from('category_cover_items')
            .select('id, image_path, orden, created_at')
            .eq('cover_id', currentCover.id)
            .order('orden', { ascending: true })
            .order('created_at', { ascending: true })
            .limit(4);

          if (coverItemsError) {
            console.error('Error fetching category cover items:', coverItemsError);
            setCoverItems([]);
          } else {
            setCoverItems(coverItemsData || []);
          }
        } else {
          setCoverItems([]);
        }
      }

      // 2. Obtener los productos que pertenecen a esa categoría o a sus subcategorías
      const { data: productsData, error: productsError } = await supabase
        .from('productos')
        .select('*')
        .or(`categoria_id.eq.${categoryData.id},subcategoria_id.eq.${categoryData.id}`);

      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else {
        // Unir imágenes a los productos
        const { data: imagesData, error: imagesError } = await supabase
          .from('imagenes_productos_colores')
          .select('producto_id, url')
          .in('producto_id', productsData.map(p => p.id));

        if (imagesError) {
          console.error('Error fetching images:', imagesError);
          setProducts(productsData); // Mostrar productos sin imágenes si falla
        } else {
          const productsWithImages = productsData.map(p => {
            const image = imagesData.find(img => img.producto_id === p.id);
            return { ...p, imagen_url: getPublicImageUrl(image?.url) || '/placeholder.svg' };
          });
          setProducts(productsWithImages);
        }
      }

      setLoading(false);
    };

    if (slug) {
      fetchProductsByCategory();
    }
  }, [slug]);

  const handleProductClick = (productId) => {
    navigate(`/producto/${productId}`);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="site-container">
      {coverEnabled && coverItems.length > 0 ? (
        <CategoryCoverGrid title={coverTitle} items={coverItems} />
      ) : null}
      <h1 className="category-title">{category?.nombre || 'Categoría'}</h1>
      <div className="products">
        {products.length > 0 ? (
          products.map(product => (
            <div className="product-card" key={product.id} onClick={() => handleProductClick(product.id)}>
              <img src={product.imagen_url || '/placeholder.svg'} alt={product.nombre} className="product-image square-image" />
              <h3>{product.nombre}</h3>
              <p className="product-price">${product.precio}</p>
            </div>
          ))
        ) : (
          <p className="no-result">No se encontraron productos en esta categoría.</p>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
