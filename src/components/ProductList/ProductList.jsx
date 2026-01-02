import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getPublicImageUrl } from "../../lib/getPublicImageUrl";
import "./ProductList.css";
import { useNavigate, useSearchParams } from "react-router-dom";
const ProductList = () => {
    const [productos, setProductos] = useState([]);
    const [error, setError] = useState(null)
    const [orden, setOrden] = useState("Relevante");
    const [filtros, setFiltros] = useState({categorias: []})
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    useEffect (() => {
        const fetchProductos = async () => {
            try {
                const [{ data, error }, { data: categoriesData, error: categoriesError }] = await Promise.all([
                    supabase
                    .from('productos')
                    .select(`
                        *,
                        imagenes_productos_colores ( url )
                    `)
                    .eq('activo', true),
                    supabase
                    .from('categorias')
                    .select('id, nombre')
                    .is('parent_id', null)
                    .order('nombre', { ascending: true })
                ]);

                if (error) {
                    throw error;
                }

                if (categoriesError) {
                    throw categoriesError;
                }

                const productsWithImages = data.map(p => ({
                    ...p,
                    imagen_url: getPublicImageUrl(p.imagenes_productos_colores[0]?.url) || '/placeholder.svg' // Fallback
                }));
                setProductos(productsWithImages);

                const allowedCategoryNames = new Set([
                    'accesorios',
                    'camisetas',
                    'gorras',
                    'hoddies',
                ]);

                const filteredCategories = (categoriesData || []).filter(c =>
                    allowedCategoryNames.has((c.nombre || '').trim().toLowerCase())
                );
                setCategories(filteredCategories);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchProductos();
    }, []);

const toggleFiltros = (tipoFiltro, valor) => {
    setFiltros((prev) => ({
        ...prev,
        [tipoFiltro]: prev[tipoFiltro].includes(valor)
        ? prev[tipoFiltro].filter((item) => item !== valor)
        : [...prev[tipoFiltro], valor],
    }))
}
const productosFiltrados = productos.filter((producto) => {
    const selectedCategoryIds = filtros.categorias;
    const matchCategoria =
    selectedCategoryIds.length === 0 || selectedCategoryIds.includes(producto.categoria_id) || selectedCategoryIds.includes(producto.subcategoria_id);

    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const matchSearch = !search || (producto.nombre || '').toLowerCase().includes(search) || (producto.descripcion || '').toLowerCase().includes(search);

    return matchCategoria && matchSearch;
})

const handleOrdenChange = (e) => {
    setOrden(e.target.value);
}

const productosOrdenados = [...productosFiltrados].sort((a,b) => {
    if(orden === "Precio: Menor a Mayor"){
        return a.precio - b.precio;
    } if(orden === "Precio: Mayor a Menor"){
        return b.precio - a.precio;
    }
    return 0;
});

const handleImageClick = (id) => {
    navigate(`/producto/${id}`); 
}
  return (
    <section className="main-content">
        <aside className="filters">
            <h2>Filtros</h2>
            <div className="filters-category">
                <div className="filter-category">
                    <h3>Categorias</h3>
                    {categories.map((category) => (
                        <label key={category.id}>
                            <input
                                type="checkbox"
                                checked={filtros.categorias.includes(category.id)}
                                onChange={() => toggleFiltros("categorias", category.id)}
                            />
                            <span>{category.nombre}</span>
                        </label>
                    ))}
                </div>
            </div>

        </aside>
    <main className="collections">

        <div className="options">
             <h2>TODAS LAS COLECCIONES</h2>
            <div className="sort-options">
                <label>
                    Ordenar por:
                    <select onChange={handleOrdenChange} value={orden}>
                        <option>Relevante</option>
                        <option>Precio: Menor a Mayor</option>
                        <option>Precio: Mayor a Menor</option>
                    </select>
                </label>
             </div>
        </div>
        <div className="products">
            {error ? (
                <p className="error-message">{error}</p>
            ):  productosFiltrados.length > 0 ? (
                productosOrdenados.map((producto) => (
                    <div className="product-card" key={producto.id}>
                        <img src={producto.imagen_url} alt={producto.nombre} className="product-image" onClick={() => handleImageClick(producto.id)}/>
                        <h3>{producto.nombre}</h3> 
                        <p className="product-price">${producto.precio}</p> 
                     </div>
                ))
            ) : (
                <p className="no-result"> 
                No hay productos que coincidan con los filtros seleccionados </p>
            )}
        </div>
    </main>

</section>
  )
}

export default ProductList
