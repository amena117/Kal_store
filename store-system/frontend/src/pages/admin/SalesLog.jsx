import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Edit2, X, ChevronLeft, ChevronRight, Calendar, DollarSign, Download } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const ITEMS_PER_PAGE = 20;

const SalesLog = () => {
  const { user, activeBranchId, branchParam } = useAuth();
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  // Edit modal
  const [editingSale, setEditingSale] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: '', selling_price: '', actual_sale_date: '', note: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, catRes] = await Promise.all([
        api.get('/sales' + branchParam),
        api.get('/categories')
      ]);
      setSales(salesRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeBranchId]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, selectedCategory, dateFrom, dateTo, minTotal, maxTotal]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        !search ||
        s.product_name?.toLowerCase().includes(searchLower) ||
        s.salesperson_name?.toLowerCase().includes(searchLower) ||
        String(s.id).includes(searchLower);
      const matchCat = selectedCategory === 'All' || s.category_name === selectedCategory;
      const saleDate = new Date(s.date);
      const matchFrom = !dateFrom || saleDate >= new Date(dateFrom);
      const matchTo = !dateTo || saleDate <= new Date(dateTo + 'T23:59:59');
      const total = parseFloat(s.total);
      const matchMin = !minTotal || total >= parseFloat(minTotal);
      const matchMax = !maxTotal || total <= parseFloat(maxTotal);
      return matchSearch && matchCat && matchFrom && matchTo && matchMin && matchMax;
    });
  }, [sales, search, selectedCategory, dateFrom, dateTo, minTotal, maxTotal]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / ITEMS_PER_PAGE));
  const paginated = filteredSales.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openEditModal = (sale) => {
    setEditingSale(sale);
    
    // Parse existing or system date to local datetime string format for input
    let localActualDate = '';
    const dateSource = sale.actual_sale_date || sale.date;
    if (dateSource) {
      localActualDate = dateSource.replace(' ', 'T').slice(0, 16);
    }
    
    setEditForm({
      quantity: sale.quantity,
      selling_price: parseFloat(sale.selling_price).toFixed(2),
      actual_sale_date: localActualDate,
      note: ''
    });
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingSale(null);
    setEditForm({ quantity: '', selling_price: '', actual_sale_date: '', note: '' });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingSale) return;
    setEditLoading(true);
    setEditError('');
    try {
      await api.put(`/sales/${editingSale.id}`, {
        quantity: parseInt(editForm.quantity),
        selling_price: parseFloat(editForm.selling_price),
        actual_sale_date: editForm.actual_sale_date || null,
        note: editForm.note
      });
      closeEditModal();
      fetchData();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update sale.');
    } finally {
      setEditLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setDateFrom('');
    setDateTo('');
    setMinTotal('');
    setMaxTotal('');
  };

  const hasActiveFilters = search || selectedCategory !== 'All' || dateFrom || dateTo || minTotal || maxTotal;

  const exportData = () => {
    const formatted = filteredSales.map(s => ({
      ID: s.id,
      Product: s.product_name,
      Category: s.category_name,
      'Unit Price': s.selling_price,
      Quantity: s.quantity,
      'Total Price': s.total,
      Salesperson: s.salesperson_name,
      'System Date': s.date,
      'Actual Sale Date': s.actual_sale_date || s.date
    }));
    exportToCSV(formatted, 'Sales_Log');
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header mb-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Log</h1>
          <p className="text-muted">History of all transactions</p>
        </div>
        <div className="flex items-center gap-3">
          {filteredSales.length !== sales.length && (
            <span className="badge badge-success text-sm">
              {filteredSales.length} of {sales.length} results
            </span>
          )}
          {hasActiveFilters && (
            <button className="btn btn-glass btn-sm" onClick={clearFilters}>
              <X size={14} /> Clear Filters
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={exportData} disabled={filteredSales.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card mb-4 p-4">
        <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {/* Search */}
          <div className="relative" style={{ gridColumn: 'span 2' }}>
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search product, salesperson, or sale ID..."
              className="form-control pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="relative">
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

          {/* Date From */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              type="date"
              className="form-control pl-9"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              title="Date From"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              type="date"
              className="form-control pl-9"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              title="Date To"
            />
          </div>

          {/* Total Range */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              type="number"
              placeholder="Min Total"
              className="form-control pl-9"
              value={minTotal}
              onChange={e => setMinTotal(e.target.value)}
              min="0" step="0.01"
            />
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              type="number"
              placeholder="Max Total"
              className="form-control pl-9"
              value={maxTotal}
              onChange={e => setMaxTotal(e.target.value)}
              min="0" step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="glass-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Total Price</th>
              <th>Salesperson</th>
              <th>System Date</th>
              <th>Sale Date (Actual)</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={canEdit ? 10 : 9} className="text-center p-4">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={canEdit ? 10 : 9} className="text-center p-4">No sales found matching filters.</td></tr>
            ) : (
              paginated.map(s => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td className="font-semibold">{s.product_name}</td>
                  <td>{s.category_name}</td>
                  <td className="text-muted">${parseFloat(s.selling_price).toFixed(2)}</td>
                  <td>{s.quantity}</td>
                  <td className="font-semibold text-secondary">${parseFloat(s.total).toFixed(2)}</td>
                  <td>{s.salesperson_name}</td>
                  <td className="text-sm text-muted">{new Date(s.date).toLocaleString()}</td>
                  <td className="text-sm font-semibold">{s.actual_sale_date ? new Date(s.actual_sale_date).toLocaleString() : new Date(s.date).toLocaleString()}</td>
                  {canEdit && (
                    <td>
                      <button
                        className="btn btn-sm btn-glass p-2"
                        onClick={() => openEditModal(s)}
                        title="Edit Sale"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-muted">
            Page {page} of {totalPages} &middot; {filteredSales.length} records
          </span>
          <div className="flex gap-2">
            <button
              className="btn btn-glass btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn btn-glass btn-sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {editingSale && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-fade-in-up" style={{ 
            maxWidth: '550px', 
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-danger/20 text-danger rounded-xl shadow-lg border border-danger/20 shrink-0">
                  <Edit2 size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-white tracking-tight truncate">Edit Sale</h2>
                  <p className="text-xs text-muted font-medium mt-0.5 truncate">Ref #{editingSale.id} &mdash; {editingSale.product_name}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={closeEditModal}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <X size={18} className="text-white" />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto', minHeight: '0', flex: '1 1 auto' }}>
              {editError && (
                <div className="alert alert-error mb-5 flex items-start gap-3 shadow-lg" style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <X size={18} className="text-danger mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-danger-light leading-snug">{editError}</span>
                </div>
              )}
              <form id="editSaleForm" onSubmit={handleEditSubmit}>
                <div className="glass-panel p-4 mb-5 text-sm text-muted shadow-sm" style={{ borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide">Current Quantity</span>
                    <span className="font-bold text-main">{editingSale.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide">Current Unit Price</span>
                    <span className="font-bold text-main">${parseFloat(editingSale.selling_price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wide">Current Total</span>
                    <span className="font-extrabold text-secondary text-base">${parseFloat(editingSale.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">New Quantity</label>
                    <input
                      type="number"
                      className="form-control bg-dark/40 border-white/10 focus:border-danger/50 focus:bg-dark/60 transition-colors font-bold"
                      min="1"
                      required
                      value={editForm.quantity}
                      onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                      style={{ padding: '0.75rem 1rem', fontSize: '1rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">New Unit Price</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign size={16} className="text-danger/70" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control pl-9 bg-dark/40 border-white/10 focus:border-danger/50 focus:bg-dark/60 transition-colors font-bold text-danger"
                        min="0.01"
                        required
                        value={editForm.selling_price}
                        onChange={e => setEditForm({ ...editForm, selling_price: e.target.value })}
                        style={{ padding: '0.75rem 1rem 0.75rem 2.25rem', fontSize: '1rem' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-5">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Actual Sale Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-muted" />
                    </div>
                    <input
                      type="datetime-local"
                      className="form-control pl-9 bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors"
                      value={editForm.actual_sale_date}
                      onChange={e => setEditForm(prev => ({ ...prev, actual_sale_date: e.target.value }))}
                      style={{ padding: '0.75rem 1rem 0.75rem 2.25rem', fontSize: '0.95rem' }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-2 opacity-75">Updates the recognized date of this transaction.</p>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Note / Reason for Edit</label>
                  <textarea
                    className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors"
                    rows={2}
                    placeholder="Optional note explaining this change..."
                    value={editForm.note}
                    onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                    style={{ resize: 'vertical', padding: '0.75rem 1rem', fontSize: '0.95rem' }}
                  />
                </div>

                {editForm.quantity && editForm.selling_price && (
                  <div className="mt-5 p-3 rounded-xl border border-secondary/20 bg-secondary/5 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wide text-secondary">New Calculated Total</span>
                    <span className="font-extrabold text-secondary text-lg">
                      ${(parseFloat(editForm.quantity) * parseFloat(editForm.selling_price)).toFixed(2)}
                    </span>
                  </div>
                )}
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
              <button className="btn btn-glass" onClick={closeEditModal} disabled={editLoading} style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}>Cancel</button>
              <button
                type="submit"
                form="editSaleForm"
                className="btn btn-primary"
                disabled={editLoading}
                style={{ 
                  background: 'var(--danger)',
                  color: 'white',
                  padding: '0.6rem 1.5rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexShrink: 0
                }}
              >
                {editLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit2 size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default SalesLog;
