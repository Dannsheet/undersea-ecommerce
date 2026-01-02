import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import './Admin.css';

const ProductListAdmin = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          inventario_productos (*),
          imagenes_productos_colores ( url )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  const handleDelete = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      const { error } = await supabase.functions.invoke('delete-product', {
        body: { productId },
      });
      if (error) {
        alert('Error: ' + error.message);
      } else {
        fetchProducts(); // Recargar la lista
      }
    }
  };


  const handleExportCSV = () => {
    const dataToExport = products.map(p => ({
      'ID': p.id,
      'Nombre': p.nombre,
      'Precio': p.precio,
      'Activo': p.activo,
      'Total Stock': p.inventario_productos.reduce((total, variant) => total + variant.stock, 0),
      'Variantes': p.inventario_productos.length,
      'Fecha Creación': new Date(p.created_at).toLocaleDateString(),
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'productos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <p>Cargando productos...</p>;
  if (error) return <p className="admin-error">Error: {error}</p>;

  return (
    <div className="admin-container">
      <div className="admin-header-alt">
        <div className="main-title-container">
          <h2>Gestión de Productos</h2>
          <p>Añade, edita y gestiona todos los productos de tu tienda.</p>
        </div>
        <div className="inventory-actions">
          <button onClick={() => navigate('/admin/products/new')} className="admin-button-primary">Añadir Producto</button>
          <button onClick={handleExportCSV} className="admin-button-secondary">Exportar CSV</button>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Inventario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product) => (
              <tr key={product.id}>
                <td>{product.nombre}</td>
                <td>${product.precio}</td>
                <td>
                  {product.inventario_productos.reduce((total, variant) => total + variant.stock, 0)} uds. en {product.inventario_productos.length} variantes
                </td>
                <td className="admin-table-actions">
                  <button onClick={() => navigate(`/admin/products/edit/${product.id}`)} className="admin-button-secondary">Editar</button>
                  <button onClick={() => handleDelete(product.id)} className="admin-button-danger">Eliminar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No se encontraron productos.</td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  );

};

export default ProductListAdmin;
