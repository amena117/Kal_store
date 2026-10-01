import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Plus, X, Edit2, Search, Filter, Package, Download,
  DollarSign, Tag, TrendingUp, Archive, AlertTriangle,
  ArrowRight, CheckCircle2, Layers, RefreshCw
} from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const Products = () => {
  const { activeBranchId, branchParam } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Duplicate Resolution Modal State
  const [duplicatePrompt, setDuplicatePrompt] = useState(null); // holds { existingProduct, newFormData }
  const [submitting, setSubmitting] = useState(false);

  // Quick Restock Modal State
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockData, setRestockData] = useState({
    added_quantity: '',
    arrival_price: '',
    selling_price: ''
  });

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
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    } catch (err) {
      console.error('Failed to fetch products/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBranchId, branchParam]);

  // Live duplicate detection inside New Product modal
  const existingMatch = useMemo(() => {
    if (editingProduct || !formData.name.trim()) return null;
    const inputName = formData.name.trim().toLowerCase();
    return products.find(p => p.name && p.name.trim().toLowerCase() === inputName);
  }, [editingProduct, formData.name, products]);

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
    if (showModal || duplicatePrompt || restockProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal, duplicatePrompt, restockProduct]);

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

  const handleOpenRestock = (product) => {
    setRestockProduct(product);
    setRestockData({
      added_quantity: '',
      arrival_price: product.arrival_price ?? '',
      selling_price: product.selling_price ?? ''
    });
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for duplicate if creating new product
    if (!editingProduct) {
      const match = products.find(
        p => p.name && p.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (match) {
        // Trigger the smart duplicate resolution prompt
        setDuplicatePrompt({
          existingProduct: match,
          newFormData: { ...formData }
        });
        return;
      }
    }

    // Normal save
    executeSave(formData, editingProduct ? editingProduct.id : null);
  };

  const executeSave = async (dataToSave, targetId = null) => {
    try {
      setSubmitting(true);
      if (targetId) {
        await api.put(`/products/${targetId}`, dataToSave);
      } else {
        await api.post('/products', dataToSave);
      }
      setShowModal(false);
      setDuplicatePrompt(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle restock confirmation from duplicate prompt
  const handleConfirmRestockFromDuplicate = async () => {
    if (!duplicatePrompt) return;
    const { existingProduct, newFormData } = duplicatePrompt;
    const addQty = parseInt(newFormData.quantity || 0, 10);

    try {
      setSubmitting(true);
      await api.post(`/products/${existingProduct.id}/restock`, {
        added_quantity: addQty,
        arrival_price: newFormData.arrival_price || existingProduct.arrival_price,
        selling_price: newFormData.selling_price || existingProduct.selling_price
      });
      setDuplicatePrompt(null);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restock product');
    } finally {
      setSubmitting(false);
    }
  };

  // Switch to editing existing product from duplicate prompt
  const handleSwitchToEditDuplicate = () => {
    if (!duplicatePrompt) return;
    const existing = duplicatePrompt.existingProduct;
    setDuplicatePrompt(null);
    setEditingProduct(existing);
    setFormData({
      name: existing.name || '',
      category_id: existing.category_id || '',
      arrival_price: existing.arrival_price ?? '',
      selling_price: existing.selling_price ?? '',
      quantity: existing.quantity ?? ''
    });
  };

  // Direct Quick Restock submission
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProduct) return;
    const addQty = parseInt(restockData.added_quantity || 0, 10);
    if (addQty <= 0) {
      alert('Please enter a valid positive quantity to add.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/products/${restockProduct.id}/restock`, {
        added_quantity: addQty,
        arrival_price: restockData.arrival_price,
        selling_price: restockData.selling_price
      });
      setRestockProduct(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restock product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up h-full">
      <div className="glass-card min-h-full">
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted">Manage catalog and inventory stock</p>
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

        {/* Products Table */}
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
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-4">Loading products...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-4">No products found matching filters.</td></tr>
              ) : (
                filteredProducts.map(p => {
                  const isLowStock = p.quantity < 5;
                  return (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td className="font-semibold">{p.name}</td>
                      <td>{p.category_name || '—'}</td>
                      <td>
                        <span className={`badge ${isLowStock ? 'badge-warning' : 'badge-success'}`}>
                          {p.quantity} units
                        </span>
                      </td>
                      <td>${parseFloat(p.arrival_price || 0).toFixed(2)}</td>
                      <td className="text-secondary font-semibold">${parseFloat(p.selling_price || 0).toFixed(2)}</td>
                      <td>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            className="btn btn-sm btn-glass p-2 text-emerald-400 hover:text-emerald-300"
                            title="Quick Restock / Add Stock"
                            onClick={() => handleOpenRestock(p)}
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button
                            className="btn btn-sm btn-glass p-2"
                            title="Edit Product"
                            onClick={() => handleOpenModal(p)}
                          >
                            <Edit2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. MAIN PRODUCT MODAL (Create / Edit)
      ───────────────────────────────────────────────────────────── */}
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
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">
                    Product Name
                  </label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-3 top-3 text-muted" />
                    <input
                      type="text"
                      className="form-control pl-10 bg-dark/40 border-white/10"
                      required
                      placeholder="e.g. Blue Vase"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* 💡 Live Duplicate Alert Banner */}
                  {existingMatch && (
                    <div className="p-3 mt-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 animate-fade-in-up">
                      <AlertTriangle size={17} className="shrink-0 mt-0.5 text-amber-400" />
                      <div className="flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>Already registered in catalog (#{existingMatch.id})</span>
                          <span className="badge badge-warning text-[10px] py-0.5 px-2">
                            {existingMatch.quantity} in stock
                          </span>
                        </div>
                        <div className="text-muted mt-1 leading-relaxed">
                          Category: <span className="text-white">{existingMatch.category_name || 'None'}</span> &middot;
                          Arrival: <span className="text-white font-medium">${parseFloat(existingMatch.arrival_price || 0).toFixed(2)}</span> &middot;
                          Selling: <span className="text-secondary font-bold">${parseFloat(existingMatch.selling_price || 0).toFixed(2)}</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-glass text-xs py-1 px-2.5 text-emerald-400 hover:text-emerald-300"
                            onClick={() => {
                              setDuplicatePrompt({
                                existingProduct: existingMatch,
                                newFormData: { ...formData }
                              });
                            }}
                          >
                            <RefreshCw size={12} /> Add to Existing Stock
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group mb-5">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">
                    Category
                  </label>
                  <div className="relative">
                    <Filter size={16} className="absolute left-3 top-3 text-muted" />
                    <select
                      className="form-control pl-10 bg-dark/40 border-white/10"
                      required
                      value={formData.category_id}
                      onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">Select a category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">
                      Arrival (Cost) Price
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-3 text-muted" />
                      <input
                        type="number"
                        step="0.01"
                        className="form-control pl-10 bg-dark/40 border-white/10"
                        required
                        placeholder="0.00"
                        value={formData.arrival_price}
                        onChange={e => setFormData({ ...formData, arrival_price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">
                      Selling Price
                    </label>
                    <div className="relative">
                      <TrendingUp size={16} className="absolute left-3 top-3 text-secondary" />
                      <input
                        type="number"
                        step="0.01"
                        className="form-control pl-10 bg-dark/40 border-white/10 font-bold text-secondary"
                        required
                        placeholder="0.00"
                        value={formData.selling_price}
                        onChange={e => setFormData({ ...formData, selling_price: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-0 mt-2">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">
                    {editingProduct ? 'Current Stock Quantity' : 'Incoming / Starting Quantity'}
                  </label>
                  <div className="relative">
                    <Archive size={16} className="absolute left-3 top-3 text-muted" />
                    <input
                      type="number"
                      className="form-control pl-10 bg-dark/40 border-white/10"
                      required
                      placeholder="0"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    />
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
              <button className="btn btn-glass" onClick={() => setShowModal(false)} type="button">
                Cancel
              </button>
              <button
                type="submit"
                form="productForm"
                className="btn btn-primary"
                disabled={submitting}
                style={{ padding: '0.6rem 2rem' }}
              >
                {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. SMART DUPLICATE RESOLUTION PROMPT MODAL
      ───────────────────────────────────────────────────────────── */}
      {duplicatePrompt && createPortal(
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content animate-fade-in-up" style={{
            maxWidth: '520px',
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            padding: 0,
            overflow: 'hidden'
          }}>
            {/* Warning Header */}
            <div style={{
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">Product Already Exists</h3>
                  <p className="text-xs text-amber-300 font-medium mt-0.5">Duplicate item detected in this store</p>
                </div>
              </div>
              <button
                onClick={() => setDuplicatePrompt(null)}
                className="p-1.5 text-muted hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Prompt Body */}
            <div className="p-6">
              <p className="text-sm text-slate-200 leading-relaxed mb-4">
                Product <strong className="text-white">"{duplicatePrompt.existingProduct.name}"</strong> is already registered in this branch with{' '}
                <strong className="text-emerald-400 font-bold">{duplicatePrompt.existingProduct.quantity} units</strong> in stock.
              </p>

              {/* Breakdown Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                  <Layers size={13} /> Stock &amp; Price Comparison
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-2 bg-black/30 rounded-lg border border-white/5 mb-3">
                  <div>
                    <div className="text-[11px] text-muted">Current Stock</div>
                    <div className="text-base font-bold text-white">{duplicatePrompt.existingProduct.quantity}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-emerald-400">Incoming Qty</div>
                    <div className="text-base font-bold text-emerald-400">+{duplicatePrompt.newFormData.quantity || 0}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-brand">New Total</div>
                    <div className="text-base font-extrabold text-white">
                      {parseInt(duplicatePrompt.existingProduct.quantity || 0, 10) + parseInt(duplicatePrompt.newFormData.quantity || 0, 10)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted flex justify-between items-center px-1">
                  <span>Arrival (Cost) Price:</span>
                  <span className="font-semibold text-white">
                    ${parseFloat(duplicatePrompt.existingProduct.arrival_price || 0).toFixed(2)}
                    {duplicatePrompt.newFormData.arrival_price && parseFloat(duplicatePrompt.newFormData.arrival_price) !== parseFloat(duplicatePrompt.existingProduct.arrival_price) && (
                      <span className="text-amber-400 font-bold ml-1.5">
                        <ArrowRight size={10} className="inline mr-1" />
                        ${parseFloat(duplicatePrompt.newFormData.arrival_price).toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-xs text-muted flex justify-between items-center px-1 mt-1.5">
                  <span>Selling Price:</span>
                  <span className="font-semibold text-secondary">
                    ${parseFloat(duplicatePrompt.existingProduct.selling_price || 0).toFixed(2)}
                    {duplicatePrompt.newFormData.selling_price && parseFloat(duplicatePrompt.newFormData.selling_price) !== parseFloat(duplicatePrompt.existingProduct.selling_price) && (
                      <span className="text-emerald-400 font-bold ml-1.5">
                        <ArrowRight size={10} className="inline mr-1" />
                        ${parseFloat(duplicatePrompt.newFormData.selling_price).toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  className="btn btn-primary w-full justify-center py-2.5 font-bold shadow-lg gap-2 text-sm"
                  onClick={handleConfirmRestockFromDuplicate}
                  disabled={submitting}
                >
                  <CheckCircle2 size={17} />
                  <span>
                    Add to Existing Stock (+{duplicatePrompt.newFormData.quantity || 0} units)
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="btn btn-glass w-full justify-center text-xs py-2"
                    onClick={handleSwitchToEditDuplicate}
                  >
                    <Edit2 size={14} /> Edit Existing
                  </button>
                  <button
                    type="button"
                    className="btn btn-glass w-full justify-center text-xs py-2 text-muted hover:text-white"
                    onClick={() => executeSave(duplicatePrompt.newFormData)}
                    disabled={submitting}
                    title="Create as a distinct new item"
                  >
                    Create Duplicate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. QUICK RESTOCK MODAL (From table action)
      ───────────────────────────────────────────────────────────── */}
      {restockProduct && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-fade-in-up" style={{
            maxWidth: '480px',
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            padding: 0,
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <RefreshCw size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Restock / Add Stock</h3>
                  <p className="text-xs text-muted font-medium mt-0.5">#{restockProduct.id} {restockProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="p-1.5 text-muted hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} style={{ padding: '1.5rem' }}>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 mb-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted">Current In-Stock</div>
                  <div className="text-lg font-bold text-white">{restockProduct.quantity} units</div>
                </div>
                <ArrowRight size={18} className="text-muted" />
                <div>
                  <div className="text-xs text-emerald-400 font-semibold">New Total Stock</div>
                  <div className="text-lg font-extrabold text-emerald-400">
                    {parseInt(restockProduct.quantity || 0, 10) + parseInt(restockData.added_quantity || 0, 10)} units
                  </div>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">
                  Quantity Received (+)
                </label>
                <div className="relative">
                  <Plus size={16} className="absolute left-3 top-3 text-emerald-400" />
                  <input
                    type="number"
                    min="1"
                    className="form-control pl-10 bg-dark/40 border-white/10 font-bold text-emerald-300"
                    required
                    placeholder="e.g. 25"
                    value={restockData.added_quantity}
                    onChange={e => setRestockData({ ...restockData, added_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">
                    Arrival (Cost) Price
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-muted" />
                    <input
                      type="number"
                      step="0.01"
                      className="form-control pl-10 bg-dark/40 border-white/10"
                      value={restockData.arrival_price}
                      onChange={e => setRestockData({ ...restockData, arrival_price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">
                    Selling Price
                  </label>
                  <div className="relative">
                    <TrendingUp size={16} className="absolute left-3 top-3 text-secondary" />
                    <input
                      type="number"
                      step="0.01"
                      className="form-control pl-10 bg-dark/40 border-white/10 font-bold text-secondary"
                      value={restockData.selling_price}
                      onChange={e => setRestockData({ ...restockData, selling_price: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer px-0 pb-0 pt-4 flex gap-3 justify-end border-t border-white/5">
                <button
                  type="button"
                  className="btn btn-glass"
                  onClick={() => setRestockProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !restockData.added_quantity}
                  style={{ padding: '0.6rem 1.75rem' }}
                >
                  {submitting ? 'Restocking...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Products;
