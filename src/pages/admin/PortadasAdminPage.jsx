import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { getPublicImageUrl } from '../../lib/getPublicImageUrl';
import './Admin.css';

const COVERS_TABLE = 'category_covers';
const ITEMS_TABLE = 'category_cover_items';
const BUCKET_NAME = 'home';

const PortadasAdminPage = () => {
  const [categories, setCategories] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');

  const [cover, setCover] = useState(null);
  const [coverTitle, setCoverTitle] = useState('');
  const [coverEnabled, setCoverEnabled] = useState(true);

  const [items, setItems] = useState([]);
  const [newFile, setNewFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.slug === selectedSlug) || null;
  }, [categories, selectedSlug]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aOrder = Number.isFinite(a?.orden) ? a.orden : Number.POSITIVE_INFINITY;
      const bOrder = Number.isFinite(b?.orden) ? b.orden : Number.POSITIVE_INFINITY;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a?.created_at || '').localeCompare(String(b?.created_at || ''));
    });
  }, [items]);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('nombre, slug, orden')
      .is('parent_id', null)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) {
      toast.error(error.message);
      setCategories([]);
      return;
    }

    setCategories(data || []);
  }, []);

  const fetchCoverAndItems = useCallback(async (slug) => {
    if (!slug) {
      setCover(null);
      setCoverTitle('');
      setCoverEnabled(true);
      setItems([]);
      return;
    }

    setLoading(true);

    const { data: coverData, error: coverError } = await supabase
      .from(COVERS_TABLE)
      .select('*')
      .eq('category_slug', slug)
      .limit(1);

    if (coverError) {
      toast.error(coverError.message);
      setCover(null);
      setCoverTitle('');
      setCoverEnabled(true);
      setItems([]);
      setLoading(false);
      return;
    }

    const currentCover = coverData?.[0] || null;
    setCover(currentCover);
    setCoverTitle(currentCover?.titulo || '');
    setCoverEnabled(Boolean(currentCover?.enabled ?? true));

    if (!currentCover?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from(ITEMS_TABLE)
      .select('*')
      .eq('cover_id', currentCover.id)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true });

    if (itemsError) {
      toast.error(itemsError.message);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(itemsData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCoverAndItems(selectedSlug);
  }, [selectedSlug, fetchCoverAndItems]);

  useEffect(() => {
    if (!cover?.titulo && selectedCategory?.nombre) {
      setCoverTitle(selectedCategory.nombre);
    }
  }, [cover?.titulo, selectedCategory?.nombre]);

  const ensureCoverExists = async () => {
    if (!selectedSlug) throw new Error('Selecciona una categoría');

    const { data: current, error: currentError } = await supabase
      .from(COVERS_TABLE)
      .select('*')
      .eq('category_slug', selectedSlug)
      .limit(1);

    if (currentError) throw new Error(currentError.message);

    const existing = current?.[0];
    if (existing?.id) return existing;

    const nextTitle = (coverTitle || selectedCategory?.nombre || '').trim();

    const { error: upsertError } = await supabase.from(COVERS_TABLE).upsert(
      {
        category_slug: selectedSlug,
        titulo: nextTitle,
        enabled: Boolean(coverEnabled),
      },
      { onConflict: 'category_slug' }
    );

    if (upsertError) throw new Error(upsertError.message);

    const { data: created, error: createdError } = await supabase
      .from(COVERS_TABLE)
      .select('*')
      .eq('category_slug', selectedSlug)
      .limit(1);

    if (createdError) throw new Error(createdError.message);

    const createdCover = created?.[0];
    if (!createdCover?.id) throw new Error('No se pudo crear la portada');

    return createdCover;
  };

  const handleSaveCover = async () => {
    if (!selectedSlug) {
      toast.error('Selecciona una categoría');
      return;
    }

    const cleanTitle = (coverTitle || '').trim();
    if (!cleanTitle) {
      toast.error('Ingresa un título');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from(COVERS_TABLE).upsert(
        {
          category_slug: selectedSlug,
          titulo: cleanTitle,
          enabled: Boolean(coverEnabled),
        },
        { onConflict: 'category_slug' }
      );

      if (error) throw new Error(error.message);

      toast.success('Portada actualizada');
      await fetchCoverAndItems(selectedSlug);
    } catch (err) {
      toast.error(err.message || 'Error actualizando portada');
    } finally {
      setSubmitting(false);
    }
  };

  const normalizeOrder = async (nextItems) => {
    const updates = nextItems.map((item, index) =>
      supabase.from(ITEMS_TABLE).update({ orden: index }).eq('id', item.id)
    );

    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw new Error(firstError.message);
  };

  const handleAddImage = async (e) => {
    e.preventDefault();

    if (!newFile) {
      toast.error('Selecciona una imagen');
      return;
    }

    if (sortedItems.length >= 4) {
      toast.error('Esta categoría ya tiene 4 imágenes');
      return;
    }

    setSubmitting(true);
    try {
      const currentCover = await ensureCoverExists();

      const fileId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const filePath = `covers/${selectedSlug}/${fileId}-${newFile.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, newFile);

      if (uploadError) throw new Error(uploadError.message);

      const { error: insertError } = await supabase.from(ITEMS_TABLE).insert({
        cover_id: currentCover.id,
        image_path: uploadData.path,
        orden: sortedItems.length,
      });

      if (insertError) throw new Error(insertError.message);

      setNewFile(null);
      toast.success('Imagen agregada');
      await fetchCoverAndItems(selectedSlug);
    } catch (err) {
      toast.error(err.message || 'Error agregando imagen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (item) => {
    const ok = window.confirm('¿Eliminar esta imagen?');
    if (!ok) return;

    setSubmitting(true);
    try {
      const { error: deleteError } = await supabase.from(ITEMS_TABLE).delete().eq('id', item.id);
      if (deleteError) throw new Error(deleteError.message);

      if (item.image_path) {
        await supabase.storage.from(BUCKET_NAME).remove([item.image_path]);
      }

      const refreshed = sortedItems.filter((i) => i.id !== item.id);
      if (refreshed.length > 0) {
        await normalizeOrder(refreshed);
      }

      toast.success('Imagen eliminada');
      await fetchCoverAndItems(selectedSlug);
    } catch (err) {
      toast.error(err.message || 'Error eliminando imagen');
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
      await fetchCoverAndItems(selectedSlug);
    } catch (err) {
      toast.error(err.message || 'Error actualizando orden');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Portadas</h2>
      </div>

      <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Categoría</span>
          <select
            className="form-input"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            disabled={submitting}
          >
            <option value="">Seleccionar...</option>
            {(categories || []).map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Título</span>
          <input
            className="form-input"
            type="text"
            value={coverTitle}
            onChange={(e) => setCoverTitle(e.target.value)}
            disabled={!selectedSlug || submitting}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            checked={coverEnabled}
            onChange={(e) => setCoverEnabled(e.target.checked)}
            disabled={!selectedSlug || submitting}
          />
          <span style={{ color: '#111827' }}>Habilitado</span>
        </label>

        <button
          type="button"
          className="admin-button-primary"
          onClick={handleSaveCover}
          disabled={!selectedSlug || submitting}
        >
          {submitting ? 'Guardando...' : 'Guardar portada'}
        </button>
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        <form onSubmit={handleAddImage} style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewFile(e.target.files?.[0] || null)}
            className="form-input-file"
            disabled={!selectedSlug || submitting}
          />
          <button
            type="submit"
            className="admin-button-primary"
            disabled={!selectedSlug || submitting || !newFile}
          >
            {submitting ? 'Subiendo...' : 'Agregar imagen'}
          </button>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Máximo 4 imágenes por categoría.
          </span>
        </form>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
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
                      <img src={imgUrl} alt={coverTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="admin-button-secondary"
                        onClick={() => moveItem(index, -1)}
                        disabled={submitting || index === 0}
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        className="admin-button-secondary"
                        onClick={() => moveItem(index, 1)}
                        disabled={submitting || index === sortedItems.length - 1}
                      >
                        Bajar
                      </button>
                      <button
                        type="button"
                        className="admin-button-danger"
                        onClick={() => handleDeleteItem(item)}
                        disabled={submitting}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedItems.length === 0 ? <p>No hay imágenes aún.</p> : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortadasAdminPage;
