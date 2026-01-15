import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './ProductsCarousel.css';
import { getPublicImageUrl } from '../../lib/getPublicImageUrl';

const calculateCardsPerView = () => {
    const width = window.innerWidth;
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    if (width >= 600) return 2;
    return 1;
};
const ProductsCarousel = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerView, setCardsPerView] = useState(calculateCardsPerView());
    const autoSlideRef = useRef();
    const carouselRef = useRef();

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('productos')
                .select(`
                    *,
                    imagenes_productos_colores ( url )
                `)
                .eq('activo', true)
                .order('created_at', { ascending: false })
                .limit(8);

            if (error) {
                setError(error.message);
            } else {
                const productsWithImages = data.map(p => ({
                    ...p,
                    imagen_url: getPublicImageUrl(p.imagenes_productos_colores[0]?.url) || '/placeholder.svg' // Fallback
                }));
                setProducts(productsWithImages);
            }
            setLoading(false);
        };

        fetchProducts();
    }, []);

    const totalPages = Math.ceil(products.length / cardsPerView);

    const slide = useCallback(() => {
        if (carouselRef.current && carouselRef.current.children[0]) {
            const cardWidth = carouselRef.current.children[0].offsetWidth;
            const gap = 24; // 1.5rem
            const offset = currentIndex * (cardWidth + gap);
            carouselRef.current.style.transform = `translateX(-${offset}px)`;
        }
    }, [currentIndex]);

    const slideRight = useCallback(() => {
        setCurrentIndex(prev => (prev + cardsPerView >= products.length ? 0 : prev + cardsPerView));
    }, [cardsPerView, products.length]);

    const resetAutoSlide = useCallback(() => {
        if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        autoSlideRef.current = setInterval(slideRight, 4000);
    }, [slideRight]);

    useEffect(() => {
        const handleResize = () => {
            setCardsPerView(calculateCardsPerView());
            setCurrentIndex(0);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        slide();
        resetAutoSlide();
        return () => clearInterval(autoSlideRef.current);
    }, [currentIndex, slide, resetAutoSlide]);

    const slideLeft = () => {
        setCurrentIndex(prev => (prev - cardsPerView < 0 ? products.length - cardsPerView : prev - cardsPerView));
    };

    const goToPage = (pageIndex) => {
        setCurrentIndex(pageIndex * cardsPerView);
    };

    return (
        <section className="second-section">
            <div className="featured-products">
                <div className="section-title"><h3>LO MÁS VENDIDO</h3></div>
                <div className="products-carousel-container">
                    <button className="carousel-arrow carousel-arrow-left" onClick={slideLeft} aria-label="Anterior">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <div className="products-carousel-wrapper">
                        <div className="products-carousel" ref={carouselRef}>
                            {loading && <p>Cargando...</p>}
                            {error && <p className="error-message">{error}</p>}
                            {products.map((p) => (
                                <div className="product-card" key={p.id} onClick={() => navigate(`/producto/${p.id}`)} style={{ cursor: 'pointer' }}>
  <img src={p.imagen_url} alt={p.nombre}/>
  <h2>{p.nombre}</h2>
  <span className="price">${p.precio}</span>
</div>
                            ))}
                        </div>
                    </div>
                    <button className="carousel-arrow carousel-arrow-right" onClick={slideRight} aria-label="Siguiente">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
                <div className="carousel-indicators">
                    {[...Array(totalPages)].map((_, i) => <button key={i} className={Math.floor(currentIndex / cardsPerView) === i ? 'active' : ''} onClick={() => goToPage(i)}></button>)}
                </div>
            </div>
        </section>
    );
};

export default ProductsCarousel;
