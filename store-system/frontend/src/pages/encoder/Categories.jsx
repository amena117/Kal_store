import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { Plus, X, Download, Tag, Info, Edit2 } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  
  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const exportData = () => {
    const formatted = categories.map(c => ({
      ID: c.id,
      'Category Name': c.name
    }));
    exportToCSV(formatted, 'Categories');
  };

  useEffect(() => {
    if (showModal || showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal, showEditModal]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', { name });
      setShowModal(false);
      setName('');
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to create category');
    }
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await api.put(`/categories/${editingCategory.id}`, { name: editName });
      setShowEditModal(false);
      setEditingCategory(null);
      setEditName('');
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to update category');
    }
  };

  return (
    <div className="animate-fade-in-up h-full">
      <div className="glass-card min-h-full">
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="text-muted">Manage product classifications</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-glass" onClick={exportData} disabled={categories.length === 0}>
              <Download size={18} /> Export CSV
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> New Category
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th className="w-24">ID</th>
                <th>Category Name</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="text-center p-8">Loading categories...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan="3" className="text-center p-8 text-muted">No categories found. Create one.</td></tr>
              ) : (
                categories.map(c => (
                  <tr key={c.id}>
                    <td><span className="badge">#{c.id}</span></td>
                    <td className="font-semibold text-lg text-main">{c.name}</td>
                    <td className="text-right">
                      <button className="btn btn-sm btn-glass p-2" onClick={() => openEdit(c)} title="Edit Category">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-fade-in-up" style={{
            maxWidth: '450px',
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            padding: 0,
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-main/20 text-brand rounded-xl shadow-lg border border-main/20">
                  <Tag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">New Category</h2>
                  <p className="text-xs text-muted font-medium mt-0.5">Define a new classification</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <form id="categoryForm" onSubmit={handleCreate}>
                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Category Name</label>
                  <div className="relative">
                    <Info size={16} className="absolute left-3 top-3 text-muted" />
                    <input type="text" className="form-control pl-10 bg-dark/40 border-white/10" required 
                      placeholder="e.g. Home Decor"
                      value={name} onChange={e => setName(e.target.value)} />
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer" style={{
              background: 'rgba(0,0,0,0.2)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button className="btn btn-glass" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" form="categoryForm" className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>Save Category</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showEditModal && editingCategory && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-fade-in-up" style={{
            maxWidth: '450px',
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            padding: 0,
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-main/20 text-brand rounded-xl shadow-lg border border-main/20">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Edit Category</h2>
                  <p className="text-xs text-muted font-medium mt-0.5">Update classification name</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <form id="editCategoryForm" onSubmit={handleEdit}>
                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Category Name</label>
                  <div className="relative">
                    <Info size={16} className="absolute left-3 top-3 text-muted" />
                    <input type="text" className="form-control pl-10 bg-dark/40 border-white/10" required 
                      placeholder="e.g. Home Decor"
                      value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer" style={{
              background: 'rgba(0,0,0,0.2)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button className="btn btn-glass" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="submit" form="editCategoryForm" className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>Update Category</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Categories;
