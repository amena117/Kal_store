import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Calendar, X, ChevronLeft, ChevronRight, ArrowRight, Download } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const ITEMS_PER_PAGE = 20;

const SalesEditHistory = () => {
  const { activeBranchId, branchParam } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch]       = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [page, setPage]           = useState(1);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales/history' + branchParam);
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [activeBranchId]);
  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    return history.filter(h => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        !search ||
        h.product_name?.toLowerCase().includes(searchLower) ||
        h.edited_by_name?.toLowerCase().includes(searchLower) ||
        h.salesperson_name?.toLowerCase().includes(searchLower) ||
        String(h.sale_id).includes(searchLower);
      const editDate = new Date(h.date);
      const matchFrom = !dateFrom || editDate >= new Date(dateFrom);
      const matchTo   = !dateTo   || editDate <= new Date(dateTo + 'T23:59:59');
      return matchSearch && matchFrom && matchTo;
    });
  }, [history, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const hasActiveFilters = search || dateFrom || dateTo;
  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); };

  const exportData = () => {
    const formatted = filtered.map(h => ({
      Date: h.date,
      'Sale ID': h.sale_id,
      Product: h.product_name,
      Category: h.category_name,
      'Old Qty': h.old_quantity,
      'New Qty': h.new_quantity,
      'Old Price': h.old_selling_price,
      'New Price': h.new_selling_price,
      'Old Total': h.old_total,
      'New Total': h.new_total,
      'Edited By': h.edited_by_name || 'Deleted User',
      Note: h.note || ''
    }));
    exportToCSV(formatted, 'Sales_Edit_History');
  };

  const changed = (oldVal, newVal) => parseFloat(oldVal) !== parseFloat(newVal);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header mb-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Edit Audit</h1>
          <p className="text-muted">Complete history of all sale record modifications</p>
        </div>
        <div className="flex items-center gap-3">
          {filtered.length !== history.length && (
            <span className="badge badge-success text-sm">
              {filtered.length} of {history.length}
            </span>
          )}
          {hasActiveFilters && (
            <button className="btn btn-glass btn-sm" onClick={clearFilters}>
              <X size={14} /> Clear
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={exportData} disabled={filtered.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1" style={{ minWidth: '220px' }}>
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search product, editor, salesperson, sale ID..."
              className="form-control pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              type="date"
              className="form-control pl-9"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              title="From date"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              type="date"
              className="form-control pl-9"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              title="To date"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sale ID</th>
              <th>Product</th>
              <th>Category</th>
              <th>Quantity Change</th>
              <th>Price Change</th>
              <th>Total Change</th>
              <th>Edited By</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="text-center p-4">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan="9" className="text-center p-4">No audit records found.</td></tr>
            ) : (
              paginated.map(h => {
                const qtyChanged   = parseInt(h.old_quantity) !== parseInt(h.new_quantity);
                const priceChanged = parseFloat(h.old_selling_price) !== parseFloat(h.new_selling_price);
                const totalChanged = parseFloat(h.old_total) !== parseFloat(h.new_total);

                return (
                  <tr key={h.id}>
                    <td className="text-sm text-muted">{new Date(h.date).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-success">#{h.sale_id}</span>
                    </td>
                    <td className="font-semibold">{h.product_name || <span className="italic text-muted">Deleted Product</span>}</td>
                    <td className="text-muted">{h.category_name || 'N/A'}</td>

                    {/* Quantity Change */}
                    <td className={qtyChanged ? 'font-bold text-main' : 'text-muted'}>
                      <span className="flex items-center gap-1">
                        {h.old_quantity}
                        <ArrowRight size={12} className="text-muted shrink-0" />
                        {h.new_quantity}
                      </span>
                    </td>

                    {/* Price Change */}
                    <td className={priceChanged ? 'font-bold text-secondary' : 'text-muted'}>
                      <span className="flex items-center gap-1">
                        ${parseFloat(h.old_selling_price).toFixed(2)}
                        <ArrowRight size={12} className="text-muted shrink-0" />
                        ${parseFloat(h.new_selling_price).toFixed(2)}
                      </span>
                    </td>

                    {/* Total Change */}
                    <td className={totalChanged ? 'font-bold text-warning' : 'text-muted'}>
                      <span className="flex items-center gap-1">
                        ${parseFloat(h.old_total).toFixed(2)}
                        <ArrowRight size={12} className="text-muted shrink-0" />
                        ${parseFloat(h.new_total).toFixed(2)}
                      </span>
                    </td>

                    <td>{h.edited_by_name || <span className="italic text-muted">Deleted User</span>}</td>
                    <td className="text-sm text-muted" style={{ maxWidth: '180px', whiteSpace: 'normal' }}>
                      {h.note || <span className="italic">—</span>}
                    </td>
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
            Page {page} of {totalPages} &middot; {filtered.length} records
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
    </div>
  );
};

export default SalesEditHistory;
