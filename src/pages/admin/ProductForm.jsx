import React from 'react';
import { FaTrash, FaUpload } from 'react-icons/fa';
import { getPublicImageUrl } from '../../lib/getPublicImageUrl';

// Este componente ahora es más "tonto". Recibe todos los datos y manejadores como props.
const ProductForm = ({ 
  isEditing,
  formData, 
  variants, 
  categories,
  subcategories,
  formError,
  loading,
  onProductChange,
  onVariantChange, 
  onAddVariant,
  onRemoveVariant,
  onAddSize,
  onRemoveSize,
  onImageSelect,
  onRemoveImage,
  onSubmit, 
  onCancel 
}) => {

  return (
    <form onSubmit={onSubmit} className="admin-form">
      <h2>{isEditing ? 'Editar Producto' : 'Añadir Producto'}</h2>
      {formError && <p className="admin-error">{formError}</p>}
      
      {/* Campos del Producto */}
      <div className="form-group">
        <label>Nombre</label>
        <input name="nombre" type="text" value={formData.nombre} onChange={onProductChange} required />
      </div>
      <div className="form-group">
        <label>Slug</label>
        <input name="slug" type="text" value={formData.slug} readOnly disabled />
      </div>
      <div className="form-group">
        <label>Descripción</label>
        <textarea name="descripcion" value={formData.descripcion} onChange={onProductChange} />
      </div>
      <div className="form-group">
        <label>Precio</label>
        <input name="precio" type="number" step="0.01" value={formData.precio} onChange={onProductChange} required />
      </div>
      <div className="form-group form-group-checkbox">
        <label htmlFor="activo">Activo</label>
        <input id="activo" name="activo" type="checkbox" checked={formData.activo} onChange={onProductChange} />
      </div>

      <div className="form-group">
        <label htmlFor="categoria_id">Categoría</label>
        <select id="categoria_id" name="categoria_id" value={formData.categoria_id} onChange={onProductChange}>
          <option value="">Seleccionar categoría</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="subcategoria_id">Subcategoría</label>
        <select id="subcategoria_id" name="subcategoria_id" value={formData.subcategoria_id} onChange={onProductChange} disabled={subcategories.length === 0}>
          <option value="">Seleccionar subcategoría</option>
          {subcategories.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.nombre}</option>
          ))}
        </select>
      </div>

      {/* === Sección de Variantes (Color, Tallas, Imágenes) === */}
      <div className="form-section">
        <h3>Variantes y Stock</h3>
        {variants.map((variant, variantIndex) => (
          <div key={variant.id} className="variant-card">
            <div className="variant-header">
              <input
                type="text"
                name="color"
                placeholder="Nombre del Color (e.g., Negro)"
                value={variant.color}
                onChange={(e) => onVariantChange(variantIndex, 'color', e.target.value)}
                className="form-input"
              />
              <button type="button" onClick={() => onRemoveVariant(variantIndex)} className="admin-button-danger">Eliminar Color</button>
            </div>

            {/* Tallas y Stock */}
            <div className="sizes-grid">
              <h4>Tallas y Stock</h4>
              {variant.sizes.map((size, sizeIndex) => (
                <div key={size.id} className="size-row">
                  <input
                    type="text"
                    placeholder="Talla (M, L, etc.)"
                    value={size.talla}
                    onChange={(e) => onVariantChange(variantIndex, `sizes.${sizeIndex}.talla`, e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={size.stock}
                    onChange={(e) => onVariantChange(variantIndex, `sizes.${sizeIndex}.stock`, e.target.value)}
                  />
                  <button type="button" onClick={() => onRemoveSize(variantIndex, sizeIndex)} className="remove-size-btn">✖</button>
                </div>
              ))}
              <button type="button" onClick={() => onAddSize(variantIndex)} className="admin-button-secondary">+ Añadir Talla</button>
            </div>

            {/* Imágenes por Color */}
            <div className="images-section">
              <h4>Imágenes para el color "{variant.color || '...'}"</h4>
              <input 
                type="file" 
                multiple 
                onChange={(e) => onImageSelect(variantIndex, e.target.files)}
                className="form-input-file"
                accept="image/*"
              />
              <div className="image-preview-grid">
                {variant.images && variant.images.map((image, imgIndex) => (
                  <div key={imgIndex} className="image-preview-item">
                    <img src={image.file ? image.url : getPublicImageUrl(image.url)} alt={`Preview ${imgIndex}`} />
                    <button type="button" onClick={() => onRemoveImage(variantIndex, imgIndex)} className="remove-image-btn">✖</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={onAddVariant} className="admin-button-primary">+ Añadir Nuevo Color</button>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="admin-button-secondary" disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="admin-button-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
