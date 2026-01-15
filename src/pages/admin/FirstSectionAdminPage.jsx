import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { getPublicImageUrl } from '../../lib/getPublicImageUrl';
import './Admin.css';

const TABLE_NAME = 'home_first_section_items';
const BUCKET_NAME = 'home';

const FirstSectionAdminPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newFile, setNewFile] = useState(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aOrder = Number.isFinite(a?.orden) ? a.orden : Number.POSITIVE_INFINITY;
      const bOrder = Number.isFinite(b?.orden) ? b.orden : Number.POSITIVE_INFINITY;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a?.created_at || '').localeCompare(String(b?.created_at || ''));
    });
  }, [items]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(error.message);
      setItems([]);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const normalizeOrder = async (nextItems) => {
    const updates = nextItems.map((item, index) =>
      supabase.from(TABLE_NAME).update({ orden: index }).eq('id', item.id)
    );

    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error)?.error;
    if (firstError) {
      throw new Error(firstError.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newFile) {
      toast.error('Selecciona una imagen');
      return;
    }

    const title = (newTitle || '').trim();
    if (!title) {
      toast.error('Ingresa un título');
      return;
    }

    setSubmitting(true);
    try {
      const fileId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const filePath = `first-section/${fileId}-${newFile.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, newFile);

      if (uploadError) throw new Error(uploadError.message);

      const nextOrder = sortedItems.length;
      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert({
          titulo: title,
          image_path: uploadData.path,
          orden: nextOrder,
          activo: true,
        });

      if (insertError) throw new Error(insertError.message);

      setNewTitle('');
      setNewFile(null);
      toast.success('Item creado');
      await fetchItems();
    } catch (err) {
      toast.error(err.message || 'Error creando item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTitle = async (item) => {
    const nextTitle = window.prompt('Nuevo título', item.titulo || '');
    if (nextTitle === null) return;

    const clean = String(nextTitle).trim();
    if (!clean) {
      toast.error('El título no puede estar vacío');
      return;
    }

    const { error } = await supabase.from(TABLE_NAME).update({ titulo: clean }).eq('id', item.id);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Título actualizado');
    await fetchItems();
  };

  const handleToggleActive = async (item) => {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ activo: !item.activo })
      .eq('id', item.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await fetchItems();
  };

  const handleDelete = async (item) => {
    const ok = window.confirm('¿Eliminar este item?');
    if (!ok) return;

    setSubmitting(true);
    try {
      const { error: deleteError } = await supabase.from(TABLE_NAME).delete().eq('id', item.id);
      if (deleteError) throw new Error(deleteError.message);

      if (item.image_path) {
        await supabase.storage.from(BUCKET_NAME).remove([item.image_path]);
      }

      toast.success('Item eliminado');
      await fetchItems();

      const refreshed = [...sortedItems].filter(i => i.id !== item.id);
      await normalizeOrder(refreshed);
      await fetchItems();
    } catch (err) {
      toast.error(err.message || 'Error eliminando item');
    } finally {
      setSubmitting(false);
    }
  };

  const moveItem = async (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sortedItems.length) return;

    const nextItems = [...sortedItems];
    const tmp = nextItems[index];
    nextItems[index] = nextItems[nextIndex];
    nextItems[nextIndex] = tmp;

    setSubmitting(true);
    try {
      await normalizeOrder(nextItems);
      toast.success('Orden actualizado');
      await fetchItems();
    } catch (err) {
      toast.error(err.message || 'Error actualizando orden');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Primera sección</h2>
      </div>

      <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px', marginBottom: '24px', maxWidth: 700 }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Título"
          className="form-input"
          disabled={submitting}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNewFile(e.target.files?.[0] || null)}
          className="form-input-file"
          disabled={submitting}
        />
        <button type="submit" className="admin-button-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Agregar'}
        </button>
      </form>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {sortedItems.map((item, index) => {
            const imgUrl = getPublicImageUrl(item.image_path, BUCKET_NAME);
            return (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '96px 1fr',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                }}
              >
                <div style={{ width: 96, height: 96, overflow: 'hidden', borderRadius: 8, background: '#f3f4f6' }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'grid' }}>
                      <strong style={{ color: '#111827' }}>{item.titulo}</strong>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>{item.activo ? 'Activo' : 'Oculto'}</span>
                    </div>

                    <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="admin-button-secondary" onClick={() => moveItem(index, -1)} disabled={submitting || index === 0}>
                        Subir
                      </button>
                      <button type="button" className="admin-button-secondary" onClick={() => moveItem(index, 1)} disabled={submitting || index === sortedItems.length - 1}>
                        Bajar
                      </button>
                      <button type="button" className="admin-button-secondary" onClick={() => handleEditTitle(item)} disabled={submitting}>
                        Editar título
                      </button>
                      <button type="button" className="admin-button-secondary" onClick={() => handleToggleActive(item)} disabled={submitting}>
                        {item.activo ? 'Ocultar' : 'Mostrar'}
                      </button>
                      <button type="button" className="admin-button-danger" onClick={() => handleDelete(item)} disabled={submitting}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {sortedItems.length === 0 ? <p>No hay items aún.</p> : null}
        </div>
      )}
    </div>
  );
};

export default FirstSectionAdminPage;
