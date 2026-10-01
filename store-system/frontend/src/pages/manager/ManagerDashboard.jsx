import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  ClipboardList,
  Building2,
  Receipt,
  ChevronRight,
  Sparkles,
  DollarSign
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

  return (
    <div className="animate-fade-in-up space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={11} /> Manager Station
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Manager Dashboard</h1>
          <p className="text-muted text-sm flex items-center gap-2 mt-1">
            <span>Welcome back,</span> 
            <span className="text-white font-semibold">{user?.name}</span>
            {user?.branch_name && (
              <>
                <span className="text-muted/40">•</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Building2 size={13} /> {user.branch_name}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button onClick={fetchData} className="btn btn-secondary text-sm py-2 px-3.5" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/sales/pos" className="btn btn-primary text-sm py-2 px-4 shadow-lg shadow-indigo-500/25">
            <ShoppingCart size={15} />
            <span>Open Register</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards (Matching Rental/Audit History Style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Total Revenue */}
        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
            <DollarSign size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', letterSpacing: '-0.02em' }} className="truncate font-mono">
              ${parseFloat(stats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>Total Revenue</span>
            </div>
          </div>
        </div>

        {/* Items Sold */}
        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
            <ShoppingCart size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', letterSpacing: '-0.02em' }} className="truncate font-mono">
              {(stats.totalSales || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>Items Sold</span>
            </div>
          </div>
        </div>

        {/* Active Reservations */}
        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
            <Calendar size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', letterSpacing: '-0.02em' }} className="truncate font-mono">
              {reservations.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>Decor Bookings</span>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, color: lowStock.length > 0 ? '#F59E0B' : '#FFFFFF', letterSpacing: '-0.02em' }} className="truncate font-mono">
              {lowStock.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>Low Stock Alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link to="/sales/pos" className="quick-action-card p-3">
            <div className="quick-action-icon bg-indigo-500/20 text-indigo-400">
              <ShoppingCart size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">POS Register</div>
            </div>
          </Link>

          <Link to="/admin/sales" className="quick-action-card p-3">
            <div className="quick-action-icon bg-blue-500/20 text-blue-400">
              <Receipt size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Sales Log</div>
            </div>
          </Link>

          <Link to="/add-reservation" className="quick-action-card p-3">
            <div className="quick-action-icon bg-emerald-500/20 text-emerald-400">
              <PlusSquare size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">New Booking</div>
            </div>
          </Link>

          <Link to="/reservations" className="quick-action-card p-3">
            <div className="quick-action-icon bg-purple-500/20 text-purple-400">
              <Calendar size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Reservations</div>
            </div>
          </Link>

          <Link to="/admin/products" className="quick-action-card p-3">
            <div className="quick-action-icon bg-amber-500/20 text-amber-400">
              <Package size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Products</div>
            </div>
          </Link>

          <Link to="/manager/sales-history" className="quick-action-card p-3">
            <div className="quick-action-icon bg-rose-500/20 text-rose-400">
              <ClipboardList size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Sales Audits</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming / Recent Reservations */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Decor Reservations</h2>
            <p className="text-xs text-muted">Latest client event bookings</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reservations')}>
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted text-sm">Loading reservations...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm">
            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
            No reservations registered yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Client Name</th>
                  <th>Event Date</th>
                  <th>Venue / Location</th>
                  <th>Category</th>
                  <th>Advance Deposit</th>
                </tr>
              </thead>
              <tbody>
                {reservations.slice(0, 7).map(r => (
                  <tr
                    key={r.id}
                    className="cursor-pointer hover:bg-white/[0.04] transition-colors"
                    onClick={() => navigate(`/reservations/${r.id}`)}
                  >
                    <td className="font-mono text-xs text-indigo-400">#{r.id}</td>
                    <td className="font-semibold text-white">{r.contact_name}</td>
                    <td className="text-muted text-sm">{new Date(r.event_date).toLocaleDateString()}</td>
                    <td className="text-muted text-sm">{r.place}</td>
                    <td><span className="badge badge-success">{r.category}</span></td>
                    <td className="text-emerald-400 font-bold font-mono">
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
