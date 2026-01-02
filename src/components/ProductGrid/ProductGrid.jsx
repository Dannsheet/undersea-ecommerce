import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './ProductGrid.css';
import { getPublicImageUrl } from '../../lib/getPublicImageUrl';

import { useNavigate } from 'react-router-dom';
const ProductGrid = () => {
    const navigate = useNavigate();
    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState('TODOS'); // 'TODOS' o un UUID

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            const { data: productsData, error: productsError } = await supabase
                .from('productos')
                .select(`
                    *,
                    imagenes_productos_colores ( url )
                `)
                .eq('activo', true);

            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categorias')
                .select('id, nombre')
                .is('parent_id', null);

            if (productsError || categoriesError) {
                setError(productsError?.message || categoriesError?.message);
            } else {
                const productsWithImages = productsData.map(p => ({
                    ...p,
                    imagen_url: p.imagenes_productos_colores[0]?.url || '/placeholder.svg' // Fallback
                }));
                setAllProducts(productsWithImages);
                setCategories(categoriesData);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    const filteredProducts = selectedCategoryId === 'TODOS'
        ? allProducts
        : allProducts.filter(p => p.categoria_id === selectedCategoryId || p.subcategoria_id === selectedCategoryId);

    return (
        <section className="product-grid-section">
            <h2 className="grid-title">EXPLORA NUESTRAS COLECCIONES</h2>
            <div className="category-filters">
                <button 
                    className={`filter-btn ${selectedCategoryId === 'TODOS' ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryId('TODOS')}
                >
                    TODOS
                </button>
                {categories.map(category => (
                    <button
                        key={category.id}
                        className={`filter-btn ${selectedCategoryId === category.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategoryId(category.id)}
                    >
                        {category.nombre.toUpperCase()}
                    </button>
                ))}
            </div>
            <div className="product-grid">
                {loading && <p>Cargando productos...</p>}
                {error && <p className="error-message">{error}</p>}
                {filteredProducts.map(product => (
                    <div key={product.id} className="product-card" onClick={() => navigate(`/producto/${product.id}`)} style={{ cursor: 'pointer' }}>
                        <img
                            src={
                                (product.imagen_url || '').startsWith('/')
                                    ? product.imagen_url
                                    : (getPublicImageUrl(product.imagen_url) || '/placeholder.svg')
                            }
                            alt={product.nombre}
                            className="product-image"
                        />
                        <h3>{product.nombre}</h3>
                        <p className="product-price">${product.precio}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ProductGrid;