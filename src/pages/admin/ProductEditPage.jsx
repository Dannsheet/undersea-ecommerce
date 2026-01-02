import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useProductManager } from '../../hooks/useProductManager';
import ProductForm from './ProductForm';
import './Admin.css';

const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { saveProduct, loading, error: formError } = useProductManager();

  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    precio: '',
    activo: true,
    categoria_id: '',
    subcategoria_id: '',
  });
  const [variants, setVariants] = useState([]); // Nuevo estado para variantes
  const [pageLoading, setPageLoading] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categorias').select('*');
      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setAllCategories(data);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      const fetchProduct = async () => {
        setPageLoading(true);
        const { data, error } = await supabase
          .from('productos')
          .select(`
            *,
            inventario_productos(*),
            imagenes_productos_colores(*)
          `)
          .eq('id', id)
          .single();
        
        if (isMounted) {
          if (error) {
            console.error('Error fetching product:', error);
          } else if (data) {
            setFormData({
              nombre: data.nombre || '',
              slug: data.slug || '',
              descripcion: data.descripcion || '',
              precio: data.precio || '',
              activo: data.activo !== undefined ? data.activo : true,
              categoria_id: data.categoria_id || '',
              subcategoria_id: data.subcategoria_id || '',
            });
            // Convertir la data de la DB al nuevo formato de estado del formulario
        if (data.inventario_productos) {
          const variantsMap = data.inventario_productos.reduce((acc, item) => {
            if (!acc[item.color]) {
              acc[item.color] = {
                id: item.color,
                color: item.color,
                sizes: [],
                // Buscar imágenes existentes para este color
                images: data.imagenes_productos_colores
                  .filter(img => img.color === item.color)
                  .map(img => ({ url: img.url, file: null, id: img.id })) // Formato para el form
              };
            }
            acc[item.color].sizes.push({ id: item.talla, talla: item.talla, stock: item.stock });
            return acc;
          }, {});
          setVariants(Object.values(variantsMap));
        }
          }
          setPageLoading(false);
        }
      };
      fetchProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const subcategories = allCategories.filter(cat => cat.parent_id === formData.categoria_id);

  const generateSlug = (text) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w-]+/g, '')        // Remove all non-word chars
      .replace(/--+/g, '-')          // Replace multiple - with single -
      .replace(/^-+/, '')              // Trim - from start of text
      .replace(/-+$/, '');             // Trim - from end of text
  }

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
      // Auto-generar slug si se cambia el nombre
      ...(name === 'nombre' && { slug: generateSlug(newValue) })
    }));

    // Si la categoría principal cambia, resetea la subcategoría
    if (name === 'categoria_id') {
      setFormData(prev => ({ ...prev, subcategoria_id: '' }));
    }
  };

  // Manejador unificado para cambios en variantes y tallas
  const handleVariantChange = (variantIndex, field, value) => {
    const newVariants = [...variants];
    const keys = field.split('.');
    
    if (keys.length === 1) { // p.ej., 'color'
      newVariants[variantIndex][keys[0]] = value;
    } else { // p.ej., 'sizes.0.talla'
      newVariants[variantIndex][keys[0]][keys[1]][keys[2]] = value;
    }
    
    setVariants(newVariants);
  };

  const handleImageSelect = (variantIndex, files) => {
    const newVariants = [...variants];
    const currentImages = newVariants[variantIndex].images || [];
    const newImageObjects = Array.from(files).map(file => ({ file, url: URL.createObjectURL(file) }));
    newVariants[variantIndex].images = [...currentImages, ...newImageObjects];
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { id: `new_${Date.now()}`, color: '', sizes: [], images: [] }]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addSize = (variantIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex].sizes.push({ id: `new_${Date.now()}`, talla: '', stock: 0 });
    setVariants(newVariants);
  };

  const removeSize = (variantIndex, sizeIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex].sizes = newVariants[variantIndex].sizes.filter((_, i) => i !== sizeIndex);
    setVariants(newVariants);
  };

  const removeImage = (variantIndex, imageIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex].images = newVariants[variantIndex].images.filter((_, i) => i !== imageIndex);
    setVariants(newVariants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convierte los IDs vacíos a null antes de guardar
    const productToSave = {
      ...formData,
      categoria_id: formData.categoria_id || null,
      subcategoria_id: formData.subcategoria_id || null,
    };

    if (id) {
      productToSave.id = id;
    }

    const { success } = await saveProduct({ 
      productData: productToSave, 
      variantsData: variants // <--- Pasando el nuevo estado
    });

    if (success) {
      navigate('/admin/products');
    }
  };

  if (pageLoading) return <p>Cargando producto...</p>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>{id ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
      </div>
      <ProductForm 
        isEditing={!!id}
        formData={formData}
        variants={variants}
        categories={allCategories.filter(cat => !cat.parent_id)}
        subcategories={subcategories}
        formError={formError}
        loading={loading}
        onProductChange={handleProductChange}
        onVariantChange={handleVariantChange}
        onAddVariant={addVariant}
        onRemoveVariant={removeVariant}
        onAddSize={addSize}
        onRemoveSize={removeSize}
        onImageSelect={handleImageSelect}
        onRemoveImage={removeImage}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/products')}
      />
    </div>
  );
};

export default ProductEditPage;
