import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  PlusSquare,
  ClipboardList
} from 'lucide-react';

const ManagerDashboard = () => {
  const { user, activeBranchId, branchParam } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]         = useState({ totalRevenue: 0, totalSales: 0 });
  const [reservations, setReservations] = useState([]);
  const [lowStock, setLowStock]   = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, resRes, stockRes] = await Promise.all([
        api.get('/dashboard' + branchParam).catch(() => ({ data: {} })),
        api.get('/reservations' + branchParam).catch(() => ({ data: [] })),
        api.get('/products/low-stock' + branchParam).catch(() => ({ data: [] }))
      ]);
      setStats(dashRes.data || {});
      setReservations(resRes.data || []);
      setLowStock(stockRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeBranchId]);

  const quickLinks = [
    { label: 'View Sales Log',    icon: <ShoppingCart size={20} />, path: '/admin/sales',     color: 'var(--color-secondary)' },
    { label: 'View Products',     icon: <Package size={20} />,     path: '/admin/products',   color: 'var(--color-primary)'   },
    { label: 'Reservations',      icon: <Calendar size={20} />,    path: '/reservations',     color: 'var(--color-warning)'   },
    { label: 'Add Reservation',   icon: <PlusSquare size={20} />,  path: '/add-reservation',  color: 'var(--color-success)'   },
    { label: 'Sales Edit Audit',  icon: <ClipboardList size={20}/>,path: '/manager/sales-history', color: 'var(--color-primary)' },
    { label: 'Low Stock Items',   icon: <AlertTriangle size={20}/>,path: '/admin/low-stock',  color: 'var(--color-warning)'   },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.name} 👋</p>
        </div>
        <button onClick={fetchData} className="btn btn-primary btn-sm">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid-cards mb-6">
        <div className="glass-card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted uppercase font-semibold">Total Revenue</p>
            <h2 className="text-2xl font-bold text-secondary mt-1">
              ${parseFloat(stats.totalRevenue || 0).toFixed(2)}
            </h2>
          </div>
          <div className="bg-secondary" style={{ background: 'rgba(99,102,241,0.2)', padding: '12px', borderRadius: '50%' }}>
            <TrendingUp size={24} style={{ color: 'var(--color-secondary)' }} />
          </div>
        </div>

        <div className="glass-card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted uppercase font-semibold">Items Sold</p>
            <h2 className="text-2xl font-bold text-main mt-1">{stats.totalSales || 0}</h2>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.2)', padding: '12px', borderRadius: '50%' }}>
            <ShoppingCart size={24} style={{ color: 'var(--color-success)' }} />
          </div>
        </div>

        <div className="glass-card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted uppercase font-semibold">Reservations</p>
            <h2 className="text-2xl font-bold text-main mt-1">{reservations.length}</h2>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.2)', padding: '12px', borderRadius: '50%' }}>
            <Calendar size={24} style={{ color: 'var(--color-warning)' }} />
          </div>
        </div>

        <div className="glass-card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted uppercase font-semibold">Low Stock Items</p>
            <h2 className={`text-2xl font-bold mt-1 ${lowStock.length > 0 ? 'text-warning' : 'text-main'}`}>
              {lowStock.length}
            </h2>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.2)', padding: '12px', borderRadius: '50%' }}>
            <AlertTriangle size={24} style={{ color: 'var(--color-warning)' }} />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass-card mb-6">
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickLinks.map(link => (
            <button
              key={link.path}
              className="btn btn-glass flex items-center gap-2"
              style={{ borderColor: link.color, color: link.color }}
              onClick={() => navigate(link.path)}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Reservations */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Recent Reservations</h2>
          <button className="btn btn-glass btn-sm" onClick={() => navigate('/reservations')}>
            View All
          </button>
        </div>
        {loading ? (
          <p className="text-muted text-sm">Loading...</p>
        ) : reservations.length === 0 ? (
          <p className="text-muted text-sm">No reservations yet.</p>
        ) : (
          <div className="table-wrapper" style={{ maxHeight: '300px' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Event Date</th>
                  <th>Place</th>
                  <th>Category</th>
                  <th>Advance</th>
                </tr>
              </thead>
              <tbody>
                {reservations.slice(0, 8).map(r => (
                  <tr
                    key={r.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/reservations/${r.id}`)}
                  >
                    <td>#{r.id}</td>
                    <td className="font-semibold">{r.contact_name}</td>
                    <td>{new Date(r.event_date).toLocaleDateString()}</td>
                    <td>{r.place}</td>
                    <td><span className="badge badge-success">{r.category}</span></td>
                    <td className="text-secondary font-semibold">
                      ${parseFloat(r.advance_payment).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
