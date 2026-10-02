import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Download,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Package
} from 'lucide-react';
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
  const [actualDateFrom, setActualDateFrom] = useState('');
  const [actualDateTo, setActualDateTo] = useState('');
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  // Selection & Delete state (Superadmin only)
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    ids: [],
    sales: []
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const selectAllRef = useRef(null);

  // Edit modal
  const [editingSale, setEditingSale] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: '', selling_price: '', actual_sale_date: '', note: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Superadmin check: Only Superadmin can delete sales
  // Regular users (Encoder, Manager, Salesperson) cannot delete sales
  const isSuperadmin = useMemo(() => {
    const role = (user?.role || '').toLowerCase().trim();
    return role === 'admin' || role === 'superadmin' || role === 'super admin' || Boolean(user?.is_superadmin);
  }, [user]);

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
      console.error('Failed to fetch sales log data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBranchId]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, dateFrom, dateTo, actualDateFrom, actualDateTo, minTotal, maxTotal]);

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

      const actualSaleDateStr = s.actual_sale_date ? s.actual_sale_date.replace(' ', 'T') : s.date.replace(' ', 'T');
      const actualSaleDate = new Date(actualSaleDateStr);
      const matchActualFrom = !actualDateFrom || actualSaleDate >= new Date(actualDateFrom);
      const matchActualTo = !actualDateTo || actualSaleDate <= new Date(actualDateTo + 'T23:59:59');

      const total = parseFloat(s.total);
      const matchMin = !minTotal || total >= parseFloat(minTotal);
      const matchMax = !maxTotal || total <= parseFloat(maxTotal);
      return matchSearch && matchCat && matchFrom && matchTo && matchActualFrom && matchActualTo && matchMin && matchMax;
    });
  }, [sales, search, selectedCategory, dateFrom, dateTo, actualDateFrom, actualDateTo, minTotal, maxTotal]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / ITEMS_PER_PAGE));
  const paginated = filteredSales.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Selection logic for Superadmin
  const paginatedIds = useMemo(() => paginated.map(s => s.id), [paginated]);
  const isAllCurrentPageSelected = paginatedIds.length > 0 && paginatedIds.every(id => selectedIds.includes(id));
  const isSomeCurrentPageSelected = paginatedIds.some(id => selectedIds.includes(id)) && !isAllCurrentPageSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeCurrentPageSelected;
    }
  }, [isSomeCurrentPageSelected]);

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      // Unselect all on current page
      setSelectedIds(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      // Select all on current page
      setSelectedIds(prev => Array.from(new Set([...prev, ...paginatedIds])));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const openSingleDeleteModal = (sale) => {
    setDeleteError('');
    setDeleteModal({
      isOpen: true,
      ids: [sale.id],
      sales: [sale]
    });
  };

  const openBulkDeleteModal = () => {
    if (selectedIds.length === 0) return;
    const targetSales = sales.filter(s => selectedIds.includes(s.id));
    setDeleteError('');
    setDeleteModal({
      isOpen: true,
      ids: selectedIds,
      sales: targetSales
    });
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModal({ isOpen: false, ids: [], sales: [] });
    setDeleteError('');
  };

  // Group items in deleteModal by product for inventory restoration breakdown
  const restorationBreakdown = useMemo(() => {
    if (!deleteModal.sales || !deleteModal.sales.length) return [];
    const map = {};
    for (const s of deleteModal.sales) {
      const key = s.product_id;
      if (!map[key]) {
        map[key] = {
          id: s.product_id,
          name: s.product_name || `Product #${s.product_id}`,
          quantity: 0
        };
      }
      map[key].quantity += parseInt(s.quantity || 0, 10);
    }
    return Object.values(map);
  }, [deleteModal.sales]);

  const handleConfirmDelete = async () => {
    if (!deleteModal.ids.length || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      let res;
      if (deleteModal.ids.length === 1) {
        res = await api.delete(`/sales/${deleteModal.ids[0]}`);
      } else {
        res = await api.post('/sales/bulk-delete', { ids: deleteModal.ids });
      }

      const deletedCount = deleteModal.ids.length;
      const msg = res.data?.message || (
        deletedCount === 1
          ? '1 sale deleted and inventory quantity restored successfully.'
          : `${deletedCount} sales deleted and inventory quantities restored successfully.`
      );

      const deletedSet = new Set(deleteModal.ids);
      setSelectedIds(prev => prev.filter(id => !deletedSet.has(id)));
      closeDeleteModal();

      // Trigger success toast
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4500);

      // Refresh sales log
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to delete sale(s) and restore inventory.';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (sale) => {
    setEditingSale(sale);

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
        quantity: parseInt(editForm.quantity, 10),
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
    setActualDateFrom('');
    setActualDateTo('');
    setMinTotal('');
    setMaxTotal('');
  };

  const hasActiveFilters = search || selectedCategory !== 'All' || dateFrom || dateTo || actualDateFrom || actualDateTo || minTotal || maxTotal;

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

  const colSpanCount = (isSuperadmin ? 1 : 0) + 9 + ((canEdit || isSuperadmin) ? 1 : 0);

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="page-header mb-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Log</h1>
          <p className="text-muted">History of all transactions</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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

          {/* Superadmin Bulk Deletion Controls */}
          {isSuperadmin && (
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 ? (
                <>
                  <span
                    className="badge text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5"
                    style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
                  >
                    <Trash2 size={13} /> {selectedIds.length} {selectedIds.length === 1 ? 'sale' : 'sales'} selected
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={openBulkDeleteModal}
                    style={{
                      background: 'var(--danger)',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 600
                    }}
                    title="Delete all selected sales and return stock to inventory"
                  >
                    <Trash2 size={14} /> Delete Selected
                  </button>
                  <button
                    className="btn btn-glass btn-sm text-xs"
                    onClick={() => setSelectedIds([])}
                    title="Clear selection"
                  >
                    Clear Selection
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-glass btn-sm opacity-50 cursor-not-allowed"
                  disabled
                  title="Select one or more sales below to enable bulk deletion"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} /> Delete Selected
                </button>
              )}
            </div>
          )}

          <button className="btn btn-primary btn-sm" onClick={exportData} disabled={filteredSales.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Sleek Modern Filter Bar */}
      <div className="glass-card mb-4 p-4">
        {/* Top Row: Primary Search & Key Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1" style={{ minWidth: '240px' }}>
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search product, salesperson, or sale ID..."
              className="form-control pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative" style={{ minWidth: '160px' }}>
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

          {/* Date Range (System Date) */}
          <div className="flex items-center gap-1.5">
            <div className="relative" style={{ width: '145px' }}>
              <Calendar className="absolute left-2.5 top-2.5 text-muted" size={14} />
              <input
                type="date"
                className="form-control pl-8 text-xs"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                title="System Date From"
              />
            </div>
            <span className="text-muted text-xs font-semibold">to</span>
            <div className="relative" style={{ width: '145px' }}>
              <Calendar className="absolute left-2.5 top-2.5 text-muted" size={14} />
              <input
                type="date"
                className="form-control pl-8 text-xs"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                title="System Date To"
              />
            </div>
          </div>

          {/* Advanced Filters Button */}
          <button
            type="button"
            className={`btn btn-sm ${showAdvanced || [actualDateFrom, actualDateTo, minTotal, maxTotal].filter(Boolean).length > 0 ? 'btn-primary' : 'btn-glass'} gap-1.5`}
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Toggle more filters (Actual date, price range)"
          >
            <SlidersHorizontal size={14} />
            <span>More</span>
            {[actualDateFrom, actualDateTo, minTotal, maxTotal].filter(Boolean).length > 0 && (
              <span className="bg-white/20 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                {[actualDateFrom, actualDateTo, minTotal, maxTotal].filter(Boolean).length}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible Advanced Filters Row */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up">
            {/* Actual Date Range */}
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">
                Actual Sale Date (From)
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 text-muted" size={14} />
                <input
                  type="date"
                  className="form-control pl-8 text-xs"
                  value={actualDateFrom}
                  onChange={e => setActualDateFrom(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">
                Actual Sale Date (To)
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 text-muted" size={14} />
                <input
                  type="date"
                  className="form-control pl-8 text-xs"
                  value={actualDateTo}
                  onChange={e => setActualDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">
                Min Total ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 text-muted" size={14} />
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="form-control pl-8 text-xs"
                  value={minTotal}
                  onChange={e => setMinTotal(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">
                Max Total ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 text-muted" size={14} />
                <input
                  type="number"
                  placeholder="No limit"
                  step="0.01"
                  min="0"
                  className="form-control pl-8 text-xs"
                  value={maxTotal}
                  onChange={e => setMaxTotal(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="glass-table">
          <thead>
            <tr>
              {isSuperadmin && (
                <th style={{ width: '48px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    checked={isAllCurrentPageSelected}
                    onChange={handleToggleSelectAll}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--danger)' }}
                    title={isAllCurrentPageSelected ? "Deselect all on this page" : "Select all on this page"}
                  />
                </th>
              )}
              <th>ID</th>
              <th>Product</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Total Price</th>
              <th>Salesperson</th>
              <th>System Date</th>
              <th>Sale Date (Actual)</th>
              {(canEdit || isSuperadmin) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpanCount} className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={colSpanCount} className="text-center p-4">
                  No sales found matching filters.
                </td>
              </tr>
            ) : (
              paginated.map(s => {
                const isSelected = selectedIds.includes(s.id);
                return (
                  <tr key={s.id} style={{ background: isSelected ? 'rgba(239, 68, 68, 0.08)' : undefined }}>
                    {isSuperadmin && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(s.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--danger)' }}
                          title={`Select sale #${s.id}`}
                        />
                      </td>
                    )}
                    <td>#{s.id}</td>
                    <td className="font-semibold">{s.product_name}</td>
                    <td>{s.category_name}</td>
                    <td className="text-muted">${parseFloat(s.selling_price).toFixed(2)}</td>
                    <td>{s.quantity}</td>
                    <td className="font-semibold text-secondary">${parseFloat(s.total).toFixed(2)}</td>
                    <td>{s.salesperson_name}</td>
                    <td className="text-sm text-muted">{new Date(s.date).toLocaleString()}</td>
                    <td className="text-sm font-semibold">{s.actual_sale_date ? new Date(s.actual_sale_date).toLocaleString() : new Date(s.date).toLocaleString()}</td>
                    {(canEdit || isSuperadmin) && (
                      <td>
                        <div className="flex items-center gap-1.5">
                          {canEdit && (
                            <button
                              className="btn btn-sm btn-glass p-2"
                              onClick={() => openEditModal(s)}
                              title="Edit Sale"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {isSuperadmin && (
                            <button
                              className="btn btn-sm btn-glass p-2 text-danger hover:bg-danger/20"
                              style={{ color: '#ef4444' }}
                              onClick={() => openSingleDeleteModal(s)}
                              title="Delete Sale & Restore Product Stock"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
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

      {/* Superadmin Delete Confirmation Modal */}
      {deleteModal.isOpen && createPortal(
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content animate-fade-in-up" style={{
            maxWidth: '560px',
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(239, 68, 68, 0.15)',
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-danger/25 text-danger rounded-xl shadow-lg border border-danger/30 shrink-0">
                  <AlertTriangle size={22} strokeWidth={2.5} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {deleteModal.ids.length === 1 ? `Delete Sale #${deleteModal.ids[0]}` : `Delete ${deleteModal.ids.length} Selected Sales`}
                  </h2>
                  <p className="text-xs text-red-300 font-medium">Permanent deletion & automatic stock restoration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: '1 1 auto' }}>
              {deleteError && (
                <div className="alert alert-error mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm">
                  <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="p-3.5 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-200 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white mb-1">
                    Warning: This action permanently deletes {deleteModal.ids.length === 1 ? 'this transaction' : `${deleteModal.ids.length} transactions`}.
                  </p>
                  <p className="text-xs text-red-300/90 leading-relaxed">
                    Deleting these sales will restore their sold quantities back into product inventory. Both deletion and stock restoration execute in a single safe database transaction.
                  </p>
                </div>
              </div>

              {/* Itemized Inventory Stock Restoration Breakdown */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Package size={14} className="text-emerald-400" /> Products to Restore to Inventory
                  </span>
                  <span className="badge badge-success text-[11px] font-bold">
                    +{restorationBreakdown.reduce((sum, i) => sum + i.quantity, 0)} total units
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 max-h-48 overflow-y-auto space-y-2">
                  {restorationBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="text-sm font-medium text-white truncate max-w-[280px]">
                        {item.name}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <RotateCcw size={11} /> +{item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-muted block mb-0.5">Sales To Delete</span>
                  <span className="text-base font-bold text-white">{deleteModal.ids.length}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-muted block mb-0.5">Total Revenue Removed</span>
                  <span className="text-base font-bold text-red-400">
                    ${deleteModal.sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              padding: '1rem 1.5rem',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <button
                type="button"
                className="btn btn-glass"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                }}
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting & Restoring...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Confirm Delete & Restore
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Success Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[10001] animate-fade-in flex items-center gap-3 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default SalesLog;
