import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, Edit2, Search, Filter, Package, Download, DollarSign, Tag, TrendingUp, Archive } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const Products = () => {
  const { activeBranchId, branchParam } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    arrival_price: '',
    selling_price: '',
    quantity: ''
  });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('All'); // All | LowStock | InStock

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products' + branchParam),
        api.get('/categories')
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeBranchId]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'All' || p.category_name === selectedCategory;
      const isLow = p.quantity < 5;
      const matchStock =
        stockFilter === 'All' ||
        (stockFilter === 'LowStock' && isLow) ||
        (stockFilter === 'InStock' && !isLow);
      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, selectedCategory, stockFilter]);

  const hasActiveFilters = search || selectedCategory !== 'All' || stockFilter !== 'All';

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setStockFilter('All');
  };

  const exportData = () => {
    const formatted = filteredProducts.map(p => ({
      ID: p.id,
      Name: p.name,
      Category: p.category_name,
      Stock: p.quantity,
      'Arrival Price': p.arrival_price,
      'Selling Price': p.selling_price
    }));
    exportToCSV(formatted, 'Products');
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        category_id: product.category_id || '',
        arrival_price: product.arrival_price ?? '',
        selling_price: product.selling_price ?? '',
        quantity: product.quantity ?? ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        arrival_price: '',
        selling_price: '',
        quantity: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save product');
    }
  };

  return (
    <div className="animate-fade-in-up h-full">
      <div className="glass-card min-h-full">
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted">Manage catalog and inventory</p>
          </div>
          <div className="flex items-center gap-3">
            {filteredProducts.length !== products.length && (
              <span className="badge badge-success text-sm">
                {filteredProducts.length} of {products.length}
              </span>
            )}
            {hasActiveFilters && (
              <button className="btn btn-glass btn-sm" onClick={clearFilters}>
                <X size={14} /> Clear
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={exportData} disabled={filteredProducts.length === 0}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={18} /> New Product
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel p-4 mb-4" style={{ borderRadius: '12px' }}>
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: '200px' }}>
              <Search className="absolute left-3 top-2.5 text-muted" size={16} />
              <input
                type="text"
                placeholder="Search by product name..."
                className="form-control pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="relative" style={{ minWidth: '180px' }}>
              <Filter className="absolute left-3 top-2.5 text-muted" size={16} />
              <select
                className="form-control pl-9"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Stock Status */}
            <div className="relative" style={{ minWidth: '160px' }}>
              <Package className="absolute left-3 top-2.5 text-muted" size={16} />
              <select
                className="form-control pl-9"
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value)}
              >
                <option value="All">All Stock</option>
                <option value="LowStock">⚠ Low Stock (&lt;5)</option>
                <option value="InStock">✓ In Stock (≥5)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Arrival Price</th>
                <th>Selling Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-4">No products found matching filters.</td></tr>
              ) : (
                filteredProducts.map(p => {
                  const isLowStock = p.quantity < 5;
                  return (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td className="font-semibold">{p.name}</td>
                      <td>{p.category_name}</td>
                      <td>
                        <span className={`badge ${isLowStock ? 'badge-warning' : 'badge-success'}`}>
                          {p.quantity}
                        </span>
                      </td>
                      <td>${parseFloat(p.arrival_price || 0).toFixed(2)}</td>
                      <td className="text-secondary font-semibold">${parseFloat(p.selling_price || 0).toFixed(2)}</td>
                      <td>
                        <button className="btn btn-sm btn-glass p-2" onClick={() => handleOpenModal(p)}>
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-fade-in-up" style={{
            maxWidth: '550px',
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Header with gradient */}
            <div style={{
              background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-main/20 text-brand rounded-xl shadow-lg border border-main/20 shrink-0">
                  <Package size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    {editingProduct ? 'Edit Product' : 'New Product'}
                  </h2>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    {editingProduct ? `Ref #${editingProduct.id}` : 'Create a new catalog item'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <form id="productForm" onSubmit={handleSubmit}>
                <div className="form-group mb-5">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Product Name</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-3 top-3 text-muted" />
                    <input type="text" className="form-control pl-10 bg-dark/40 border-white/10" required
                      placeholder="e.g. Blue Vase"
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                </div>

                <div className="form-group mb-5">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Category</label>
                  <div className="relative">
                    <Filter size={16} className="absolute left-3 top-3 text-muted" />
                    <select className="form-control pl-10 bg-dark/40 border-white/10" required
                      value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                      <option value="">Select a category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Arrival Price</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-3 text-muted" />
                      <input type="number" step="0.01" className="form-control pl-10 bg-dark/40 border-white/10" required
                        value={formData.arrival_price} onChange={e => setFormData({ ...formData, arrival_price: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Selling Price</label>
                    <div className="relative">
                      <TrendingUp size={16} className="absolute left-3 top-3 text-secondary" />
                      <input type="number" step="0.01" className="form-control pl-10 bg-dark/40 border-white/10 font-bold text-secondary" required
                        value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-0 mt-2">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Stock Quantity</label>
                  <div className="relative">
                    <Archive size={16} className="absolute left-3 top-3 text-muted" />
                    <input type="number" className="form-control pl-10 bg-dark/40 border-white/10" required
                      value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
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
              justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <button className="btn btn-glass" onClick={() => setShowModal(false)} type="button">Cancel</button>
              <button type="submit" form="productForm" className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Products;
