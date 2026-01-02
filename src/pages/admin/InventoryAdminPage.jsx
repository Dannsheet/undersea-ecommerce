import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Papa from 'papaparse';
import { FaPen, FaTrash, FaSearch } from 'react-icons/fa';
import './Admin.css';

const InventoryAdminPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventario_productos')
        .select(`
          *,
          productos ( nombre )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setInventory(data);
      }
      setLoading(false);
    };

    fetchInventory();
  }, []);

  // Agrupar inventario por producto
  const groupedInventory = useMemo(() => {
    const grouped = inventory.reduce((acc, item) => {
      // Usar el ID del producto de la tabla de inventario para agrupar
      const productId = item.producto_id;
      if (!acc[productId]) {
        acc[productId] = {
          productId: productId,
          productName: item.productos.nombre,
          variants: [],
        };
      }
      acc[productId].variants.push(item);
      return acc;
    }, {});

    // Filtrar por término de búsqueda
    if (!searchTerm) {
      return Object.values(grouped);
    }
    return Object.values(grouped).filter(group => 
      group.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const handleExportCSV = () => {
    const dataToExport = [];
    groupedInventory.forEach(group => {
      group.variants.forEach(variant => {
        dataToExport.push({
          'Producto': group.productName,
          'Color': variant.color,
          'Talla': variant.talla,
          'Stock': variant.stock,
        });
      });
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventario.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <p>Cargando inventario...</p>;
  if (error) return <p className="admin-error">Error: {error}</p>;

  return (
    <div className="admin-container">
      <div className="admin-header-alt">
        <div className="main-title-container">
          <h2 className="inventory-title">INVENTARIO</h2>
          <h3>Gestión de inventario</h3>
          <p>Visualiza y gestiona el inventario de productos por color y talla.</p>
        </div>
        <div className="inventory-actions">
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input 
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input search-input"
            />
          </div>
          <button onClick={handleExportCSV} className="admin-button-primary">Exportar CSV</button>
        </div>
      </div>

      {groupedInventory.map((group, index) => (
        <div key={index} className="inventory-group">
          <div className="inventory-group-header">
            <h3>{group.productName}</h3>
            <span className="total-stock-badge">STOCK TOTAL: {group.variants.reduce((sum, v) => sum + v.stock, 0)} UNIDADES</span>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Talla</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {group.variants.map((variant, vIndex) => (
                <tr key={vIndex}>
                  <td>{variant.color}</td>
                  <td>{variant.talla}</td>
                  <td className="stock-cell">{variant.stock} unidades</td>
                  <td className="admin-table-actions">
                    <button className="admin-button-icon"><FaPen /></button>
                    <button className="admin-button-icon danger"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default InventoryAdminPage;
