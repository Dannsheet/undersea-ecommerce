import { useParams } from "react-router-dom";
import './DetailsProduct.css';
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useCart } from "../../hooks/useCart";
import Loader from "../Loader"; // Asumiendo que tienes un loader
import { getPublicImageUrl } from "../../lib/getPublicImageUrl";
import toast from 'react-hot-toast';
import { getColorCode } from "../../lib/color-map";

const DetailsProduct = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
                // Fetch producto principal
        const { data, error } = await supabase
          .from('productos')
          .select(`*, inventario_productos:inventario_productos(*)`)
          .eq('id', id);

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Producto no encontrado.');
        }
        const productData = data[0];

        // Fetch imagenes_productos_colores directly
        const { data: imagesData } = await supabase
          .from('imagenes_productos_colores')
          .select('*')
          .eq('producto_id', id);
        
        setProduct({ ...productData, imagenes_productos_colores: imagesData });

        // Estructurar variantes
        const safeImages = (imagesData || []);
        const variantsMap = productData.inventario_productos.reduce((acc, item) => {
          if (!acc[item.color]) {
            acc[item.color] = {
              color: item.color,
              images: safeImages
                .filter(img => img.color === item.color)
                .sort((a, b) => a.orden - b.orden), // <-- Ordenar imágenes
              sizes: []
            };
          }
          acc[item.color].sizes.push({ talla: item.talla, stock: item.stock });
          return acc;
        }, {});
        const structuredVariants = Object.values(variantsMap);
        setVariants(structuredVariants);

        // Seleccionar el primer color y la primera imagen por defecto
        if (structuredVariants.length > 0) {
          const firstVariant = structuredVariants[0];
          setSelectedColor(firstVariant.color);
          if (firstVariant.images.length > 0) {
            const url = getPublicImageUrl(firstVariant.images[0].url);
            setMainImage(url && url !== '' ? url : undefined);
          } else {
            setMainImage(undefined);
          }
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id]);

  // --- Memos para calcular datos derivados ---
  const availableColors = useMemo(() => {
    return variants.map(v => v.color);
  }, [variants]);

  const currentVariant = useMemo(() => {
    return variants.find(v => v.color === selectedColor);
  }, [variants, selectedColor]);

  const availableSizes = useMemo(() => {
    if (!currentVariant) return [];
    return currentVariant.sizes;
  }, [currentVariant]);

  const imagesForSelectedColor = useMemo(() => {
    if (!currentVariant) return [];
    return currentVariant.images;
  }, [currentVariant]);

  // --- Handlers ---
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setSelectedSize(null);
    const newVariant = variants.find(v => v.color === color);
    if (newVariant && newVariant.images.length > 0) {
      setMainImage(getPublicImageUrl(newVariant.images[0].url));
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handleAddToCart = () => {
    if (!product || !selectedColor || !selectedSize) return;

    const stockAvailable = availableSizes.find(s => s.talla === selectedSize)?.stock || 0;
    if (stockAvailable <= 0) return;

    const itemToAdd = {
      id: `${product.id}-${selectedColor}-${selectedSize}`,
      producto_id: product.id,
      nombre: `${product.nombre} (${selectedColor} - ${selectedSize})`,
      precio: product.precio,
      imagen: mainImage,
      quantity: 1, // Changed from 'cantidad'
      stock: stockAvailable,
    };

    addToCart(itemToAdd);
    toast.success(`${itemToAdd.nombre} ha sido añadido al carrito.`);
  };

  const handleWhatsAppOrder = () => {
    const phoneNumber = 'TU_NUMERO_DE_TELEFONO'; // <-- REEMPLAZAR
    const message = `Hola, estoy interesado en el producto: ${product.nombre} (Color: ${selectedColor}, Talla: ${selectedSize}). ¿Podrían darme más información?`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // --- Renderizado ---
  if (loading) return <div className="loader-container"><Loader /></div>;
  if (error) return <h2 className="error-message">Error: {error}</h2>;
  if (!product) return <p>Producto no encontrado.</p>;

  return (
    <div className="product-details">
      <div className="product-gallery">
        <div className="main-image-container">
          {mainImage && mainImage !== '' ? (
  <img src={mainImage} alt={`${product.nombre} - ${selectedColor}`} className="main-image" />
) : null}
        </div>
        <div className="thumbnail-container">
          {imagesForSelectedColor.map((img) => (
            (() => {
  const url = getPublicImageUrl(img.url);
  if (!url) {
    console.warn('Thumbnail image missing or invalid:', img.url);
  }
  return (
    <img 
      key={img.id}
      src={url && url !== '' ? url : '/placeholder.svg'} 
      alt={`${product.nombre} - ${img.color}`}
      className={`thumbnail ${mainImage === url ? 'active' : ''}`}
      onClick={() => setMainImage(url)}
    />
  );
})()
          ))}
        </div>
      </div>
      <div className="product-infos">
        <h1>{product.nombre}</h1>
        <p className="price">${product.precio}</p>
        <p className="description">{product.descripcion}</p>

        <div className="options-section">
          <label>Color</label>
          <div className="color-options">
            {availableColors.map(color => (
              <button 
                key={color} 
                className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: getColorCode(color) }}
                onClick={() => handleColorSelect(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="options-section">
          <label>Talla</label>
          <div className="size-options">
            {availableSizes.map(size => (
              <button 
                key={size.talla} 
                className={`size-btn ${selectedSize === size.talla ? 'selected' : ''}`}
                onClick={() => handleSizeSelect(size.talla)}
                disabled={size.stock <= 0}
              >
                {size.talla}
              </button>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="add-to-cart" 
            onClick={handleAddToCart} 
            disabled={!selectedSize || !selectedColor}
          >
            Añadir al carrito
          </button>
          <button 
            className="whatsapp-order" 
            onClick={handleWhatsAppOrder}
            disabled={!selectedSize || !selectedColor}
          >
            Pedir por WhatsApp
          </button>
        </div>

        <p className="note">
          Producto 100% Original. El pago contra reembolso está disponible para este producto.
          Política de devolución y cambio fácil dentro de los 7 primeros días.
        </p>
      </div>
    </div>
  );
}

export default DetailsProduct
