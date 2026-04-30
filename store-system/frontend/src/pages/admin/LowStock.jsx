import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Bell, Package, Download, Building2, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportToCSV } from '../../utils/csvExport';

const LowStock = () => {
  const { activeBranchId, branchParam } = useAuth();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/low-stock' + branchParam);
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch low stock', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when branch changes
  useEffect(() => { fetchLowStock(); }, [activeBranchId]);

  const exportData = () => {
    const formatted = items.map(item => ({
      'Product Name': item.name,
      Category: item.category_name,
      Branch: item.branch_name || 'N/A',
      'Current Stock': item.quantity,
      Status: item.quantity == 0 ? 'OUT OF STOCK' : 'LOW STOCK'
    }));
    exportToCSV(formatted, 'Low_Stock_Alerts');
  };

  return (
    <div className="animate-fade-in-up h-full">
      <div className="glass-card min-h-full">
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <Bell className="text-warning" size={32} />
              Inventory Alerts
            </h1>
            <p className="text-muted mt-1 flex items-center gap-2">
              Products requiring immediate restocking
              {activeBranchId
                ? <><Building2 size={13} className="text-main ml-2" /> <span className="text-main font-semibold text-xs">Branch filtered</span></>
                : <><Globe size={13} className="text-muted ml-2" /> <span className="text-xs">All branches</span></>
              }
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-glass flex items-center gap-2" onClick={exportData} disabled={items.length === 0}>
              <Download size={18} /> Export CSV
            </button>
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={() => navigate('/admin/products')}
            >
              Manage Products
            </button>
          </div>
        </div>

        <div className="table-wrapper mt-6">
          {loading ? (
            <div className="p-20 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted">Loading alerts...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-20 text-center glass-panel">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-white">Full Stock!</h3>
              <p className="text-muted">All items are currently well-stocked.</p>
            </div>
          ) : (
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th className="text-center">Current Stock</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white hover:bg-opacity-5 transition-all">
                    <td>
                      <div className="font-bold text-white">{item.name}</div>
                    </td>
                    <td>{item.category_name}</td>
                    <td className="text-center">
                      <span className={`font-mono font-bold ${item.quantity == 0 ? 'text-danger' : 'text-warning'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${item.quantity == 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {item.quantity == 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowStock;
