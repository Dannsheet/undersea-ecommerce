import React from 'react';
import ImageSlider from '../ImageSlider/ImageSlider';
import ProductsCarousel from '../ProductsCarousel/ProductsCarousel';
import ProductGrid from '../ProductGrid/ProductGrid';
import './Home.css';

const Home = () => {
    return (
        <>
            <main>
                <ImageSlider />
                <ProductsCarousel />
                <ProductGrid />
            </main>
        </>
    );
};

export default Home;
