import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Building2, 
  Globe, 
  ShoppingCart, 
  Calendar, 
  ArrowRight,
  User,
  Clock,
  Tag,
  Receipt,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const { activeBranchId, branchParam } = useAuth();

  const [stats, setStats] = useState({
    capital: 0,
    profit: 0,
    totalSales: 0,
    totalRevenue: 0
  });
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashRes, salesRes] = await Promise.all([
        api.get('/dashboard' + branchParam).catch(() => ({ data: {} })),
        api.get('/sales' + branchParam).catch(() => ({ data: [] }))
      ]);

      if (dashRes.data) setStats(dashRes.data);
      if (Array.isArray(salesRes.data)) setSales(salesRes.data);
    } catch (err) {
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeBranchId]);

  // Branch display label
  const branchLabel = activeBranchId === null
    ? 'All Branches'
    : (stats._branch_name || 'Selected Branch');

  // Profit margin calculation
  const revenue = parseFloat(stats.totalRevenue || 0);
  const profit = parseFloat(stats.profit || 0);
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

  // Today's stats calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = useMemo(() => {
    return sales.filter(s => {
      const saleDate = s.actual_sale_date || s.date || '';
      return saleDate.startsWith(todayStr);
    });
  }, [sales, todayStr]);

  const todayRevenue = useMemo(() => {
    return todaySales.reduce((acc, s) => acc + parseFloat(s.total || 0), 0);
  }, [todaySales]);

  // Top Selling Products Calculation
  const topProducts = useMemo(() => {
    const productMap = {};
    sales.forEach(s => {
      const name = s.product_name || 'Product #' + s.product_id;
      if (!productMap[name]) {
        productMap[name] = {
          name,
          category: s.category_name || 'General',
          units: 0,
          revenue: 0
        };
      }
      productMap[name].units += parseInt(s.quantity || 0);
      productMap[name].revenue += parseFloat(s.total || 0);
    });

    return Object.values(productMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [sales]);

  const maxTopUnits = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.units)) : 1;

  return (
    <div className="animate-fade-in-up space-y-6 pb-10">
      {/* Clean Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Store Dashboard</h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              {activeBranchId ? <Building2 size={13} className="text-indigo-400" /> : <Globe size={13} className="text-indigo-400" />}
              <span>Branch Scope:</span>
              <span className="font-semibold text-white">{branchLabel}</span>
            </span>
            <span>•</span>
            <span>Today: {todaySales.length} sales (${todayRevenue.toFixed(2)})</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={fetchDashboardData} 
            className="btn btn-secondary text-xs py-2 px-3 rounded-lg"
            title="Refresh dashboard data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/sales/pos" className="btn btn-primary text-xs py-2 px-3.5 rounded-lg shadow-sm">
            <Plus size={15} />
            <span>New Sale</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error text-xs py-2.5 rounded-lg">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stat Cards (Matching Rental/Audit History Style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Total Revenue */}
        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
            <DollarSign size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', letterSpacing: '-0.02em' }} className="truncate font-mono">
              ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Total Revenue</span>
              <span className="text-emerald-400 font-bold font-mono text-[11px]">+${todayRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
            <TrendingUp size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, color: '#10B981', letterSpacing: '-0.02em' }} className="truncate font-mono">
              ${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Net Profit</span>
              <span className="bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 rounded text-[10px] font-bold">
                {profitMargin}% margin
              </span>
            </div>
          </div>
        </div>

        {/* Items Sold */}
        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
            <Package size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', letterSpacing: '-0.02em' }} className="truncate font-mono">
              {(stats.totalSales || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Items Sold</span>
              <span className="text-sky-400 font-medium font-mono text-[11px]">
                {todaySales.reduce((acc, s) => acc + parseInt(s.quantity || 0), 0)} today
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Capital Asset */}
        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <Receipt size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', letterSpacing: '-0.02em' }} className="truncate font-mono">
              ${parseFloat(stats.capital || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>Stock Valuation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity & Top Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Transactions (Live Activity Feed) - Takes 2/3 width */}
        <div className="lg:col-span-2 glass-card p-5 rounded-xl border border-white/[0.08] bg-[#0c1324] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" />
                <span>Live Sales Activity</span>
              </h2>
              <p className="text-xs text-muted">Latest completed store transactions</p>
            </div>
            <Link to="/admin/sales" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              <span>View All Sales</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="table-wrapper border-none">
            {loading ? (
              <div className="text-center py-12 text-muted text-xs">Loading sales stream...</div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12 text-muted text-xs">
                <ShoppingCart size={28} className="mx-auto mb-2 opacity-30" />
                No sales recorded yet.
              </div>
            ) : (
              <table className="glass-table text-xs">
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Salesperson</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 7).map(sale => {
                    const dateObj = new Date(sale.actual_sale_date || sale.date);
                    const formattedTime = !isNaN(dateObj) ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    const formattedDate = !isNaN(dateObj) ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                    return (
                      <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="font-mono text-muted">#{sale.id}</td>
                        <td className="font-semibold text-white">
                          <div className="truncate max-w-[170px]" title={sale.product_name}>
                            {sale.product_name}
                          </div>
                        </td>
                        <td className="font-mono font-bold text-white">{sale.quantity}</td>
                        <td className="font-mono text-muted">${parseFloat(sale.selling_price).toFixed(2)}</td>
                        <td className="font-mono font-bold text-emerald-400">${parseFloat(sale.total).toFixed(2)}</td>
                        <td className="text-muted truncate max-w-[100px]">{sale.salesperson_name || 'Staff'}</td>
                        <td className="text-muted whitespace-nowrap">
                          <span>{formattedDate}</span> <span className="opacity-60">{formattedTime}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Selling Products & Quick Actions - Takes 1 Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Top Selling Products */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.08] bg-[#0c1324]">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Tag size={16} className="text-emerald-400" />
                  <span>Top Selling Products</span>
                </h2>
                <p className="text-xs text-muted">Ranked by units moved</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {loading ? (
                <div className="text-center py-8 text-muted text-xs">Analyzing products...</div>
              ) : topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs">No sales data available.</div>
              ) : (
                topProducts.map((product, idx) => {
                  const percentage = Math.round((product.units / maxTopUnits) * 100);
                  return (
                    <div key={product.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-4 text-center font-bold text-muted font-mono text-[11px]">{idx + 1}.</span>
                          <span className="font-semibold text-white truncate" title={product.name}>{product.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-white">{product.units} sold</span>
                          <span className="text-muted text-[10px] ml-1">(${product.revenue.toFixed(0)})</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clean Quick Actions Shortcut */}
          <div className="glass-card p-4 rounded-xl border border-white/[0.08] bg-[#0c1324]">
            <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-3">Quick Actions</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/sales/pos" className="btn btn-secondary py-2.5 px-3 rounded-lg justify-start gap-2">
                <ShoppingCart size={15} className="text-indigo-400" />
                <span>Open POS</span>
              </Link>
              <Link to="/add-reservation" className="btn btn-secondary py-2.5 px-3 rounded-lg justify-start gap-2">
                <Calendar size={15} className="text-emerald-400" />
                <span>New Booking</span>
              </Link>
              <Link to="/admin/products" className="btn btn-secondary py-2.5 px-3 rounded-lg justify-start gap-2">
                <Package size={15} className="text-amber-400" />
                <span>Products</span>
              </Link>
              <Link to="/inventory/price-update" className="btn btn-secondary py-2.5 px-3 rounded-lg justify-start gap-2">
                <DollarSign size={15} className="text-rose-400" />
                <span>Price Update</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
