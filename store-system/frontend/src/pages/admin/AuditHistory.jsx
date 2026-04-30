import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const ITEMS_PER_PAGE = 20;

const AuditHistory = () => {
  const { activeBranchId, branchParam } = useAuth();
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [histRes, catRes] = await Promise.all([
        api.get('/products/history' + branchParam),
        api.get('/categories')
      ]);
      setHistory(histRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeBranchId]);

  useEffect(() => { setPage(1); }, [search, selectedCategory]);

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const pName = h.product_name || 'Deleted Product';
      const matchesSearch = pName.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'All' || h.category_name === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [history, search, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const paginated  = filteredHistory.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const exportData = () => {
    const formatted = filteredHistory.map(h => ({
      Date: h.date,
      Product: h.product_name || 'Deleted Product',
      Category: h.category_name || 'N/A',
      'Old Selling Price': h.old_price,
      'New Selling Price': h.new_price,
      'Old Arrival Price': h.old_arrival_price,
      'New Arrival Price': h.new_arrival_price,
      'Old Qty': h.old_quantity,
      'New Qty': h.new_quantity,
      'Changed By': h.user_name || 'Deleted User'
    }));
    exportToCSV(formatted, 'Product_Audit_History');
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Audit History</h1>
          <p className="text-muted">Track product modifications</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={exportData} disabled={filteredHistory.length === 0}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>
      
      <div className="glass-panel p-4 mb-6" style={{ borderRadius: '12px' }}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="relative flex-1" style={{ minWidth: '200px' }}>
            <Search className="absolute left-3 top-2.5 text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search product..." 
              className="form-control pl-10 w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-muted" size={18} />
            <select 
              className="form-control pl-10 w-48"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Category</th>
              <th>Selling Price Change</th>
              <th>Arrival Price Change</th>
              <th>Stock Change</th>
              <th>Changed By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-4">No audit logs found matching filters.</td></tr>
            ) : (
              paginated.map(h => {
                const priceChanged = parseFloat(h.old_price) !== parseFloat(h.new_price);
                const arrivalChanged = parseFloat(h.old_arrival_price) !== parseFloat(h.new_arrival_price);
                const stockChanged = parseInt(h.old_quantity) !== parseInt(h.new_quantity);

                return (
                <tr key={h.id}>
                  <td className="text-sm text-muted">{new Date(h.date).toLocaleString()}</td>
                  <td className="font-semibold">{h.product_name || <span className="italic text-muted">Deleted Product</span>}</td>
                  <td>{h.category_name || 'N/A'}</td>
                  <td className={priceChanged ? 'text-secondary font-bold' : 'text-muted'}>
                    ${parseFloat(h.old_price).toFixed(2)} → ${parseFloat(h.new_price).toFixed(2)}
                  </td>
                  <td className={arrivalChanged ? 'text-warning font-bold' : 'text-muted'}>
                    ${parseFloat(h.old_arrival_price).toFixed(2)} → ${parseFloat(h.new_arrival_price).toFixed(2)}
                  </td>
                  <td className={stockChanged ? 'text-main font-bold' : 'text-muted'}>
                    {h.old_quantity} → {h.new_quantity}
                  </td>
                  <td>{h.user_name || <span className="italic text-muted">Deleted User</span>}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-muted">
            Page {page} of {totalPages} &middot; {filteredHistory.length} records
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

export default AuditHistory;
