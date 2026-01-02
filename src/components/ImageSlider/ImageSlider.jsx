import React, { useState, useEffect, useRef } from 'react';
import './ImageSlider.css';

const images = [
    '/fondo-imagen-3.webp',
    '/fondo-imagen-2.webp',
    '/fondo-imagen-1.webp',
];

const ImageSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(
            () =>
                setCurrentIndex((prevIndex) =>
                    prevIndex === images.length - 1 ? 0 : prevIndex + 1
                ),
            5000
        );

        return () => {
            resetTimeout();
        };
    }, [currentIndex]);

    const goToSlide = (slideIndex) => {
        setCurrentIndex(slideIndex);
    };

    const goToPrev = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
        <section className="first-section">
            <div className="slider-container">
                <div className="slider" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                    {images.map((imgUrl, index) => (
                        <div
                            key={index}
                            className="slider-slide"
                            style={{ backgroundImage: `url(${imgUrl})` }}
                        ></div>
                    ))}
                </div>
                <div className="nav-container">
                    <button onClick={goToPrev} data-index-change="-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <div className="index-container">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                className={currentIndex === index ? 'active' : ''}
                                onClick={() => goToSlide(index)}
                            ></button>
                        ))}
                    </div>
                    <button onClick={goToNext} data-index-change="1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ImageSlider;
