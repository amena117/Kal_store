import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  AlertCircle,
  Building2,
  ListFilter
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const ProfitTracking = () => {
  const { user, activeBranchId } = useAuth();
  
  // Format to YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: { totalRevenue: 0, totalCost: 0, netProfit: 0 },
    productBreakdown: [],
    dailyTrend: []
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start_date: startDate,
        end_date: endDate
      };
      
      // Admin users use the activeBranchId from the Sidebar Branch Selector.
      // Manager users have their branch enforced heavily in the Backend API automatically.
      if (user?.role === 'Admin' && activeBranchId) {
        params.branch_id = activeBranchId;
      }

      const res = await api.get('/profit', { params });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load profit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, activeBranchId, user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount).replace('$', 'ETB ');
  };

  return (
    <div className="animate-fade-in-up h-full pb-10">
      
      {/* Header Section */}
      <div className="page-header mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp size={28} className="text-main" /> Analytics & Profit
          </h1>
          <p className="text-muted mt-1 flex items-center gap-2">
            <Building2 size={16} />
            {user?.role === 'Admin' 
              ? (activeBranchId ? 'Showing Data for Selected Branch' : 'Showing Combined Global Data')
              : `Showing Data for ${user?.branch_name || 'Your Branch'}`
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Calendar size={16} className="absolute left-3 top-2.5 text-muted" />
            <input 
              type="date"
              className="form-control pl-9"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <span className="text-muted font-bold text-sm hidden sm:block">TO</span>
          <div className="relative w-full sm:w-auto">
            <Calendar size={16} className="absolute left-3 top-2.5 text-muted" />
            <input 
              type="date"
              className="form-control pl-9"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="alert alert-error mb-6">
          <AlertCircle size={20} />
          {error}
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid-cards mb-8">
        <div className="glass-card flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <DollarSign size={26} strokeWidth={2.5} />
            </div>
            <span className="badge badge-glass flex items-center gap-1">
              <ListFilter size={12} /> Filtered
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">{formatCurrency(data.summary.totalRevenue)}</h2>
            <p className="text-sm text-muted font-medium">Total Gross Revenue</p>
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-warning/10 text-warning rounded-xl">
              <Package size={26} strokeWidth={2.5} />
            </div>
            <span className="badge badge-glass flex items-center gap-1">
              <ListFilter size={12} /> Filtered
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">{formatCurrency(data.summary.totalCost)}</h2>
            <p className="text-sm text-muted font-medium">Total Cost of Goods</p>
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between" style={{ borderColor: 'rgba(29, 185, 84, 0.3)', background: 'rgba(29, 185, 84, 0.05)' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-main/20 text-main rounded-xl">
              <TrendingUp size={26} strokeWidth={2.5} />
            </div>
            <span className="badge" style={{ background: 'rgba(29, 185, 84, 0.2)', color: 'var(--primary)', border: '1px solid rgba(29, 185, 84, 0.3)' }}>Net Profit</span>
          </div>
          <div>
            <h2 className={`text-3xl font-bold tracking-tight mb-1 ${data.summary.netProfit >= 0 ? 'text-main' : 'text-danger'}`}>
              {formatCurrency(data.summary.netProfit)}
            </h2>
            <p className="text-sm text-muted font-medium">Overall Profit Margin</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center glass-card">
          <div className="spinner mb-4"></div>
          <p className="text-muted font-medium animate-pulse">Calculating profitability...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trend Chart */}
          <div className="glass-card lg:col-span-2 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">Profit Growth Trend</h3>
                <p className="text-xs text-muted mt-1">Daily accumulation over the selected range</p>
              </div>
              <div className="p-2 bg-dark/40 rounded-lg">
                <TrendingUp size={20} className="text-main" />
              </div>
            </div>
            
            <div className="w-full flex-grow min-h-[350px]">
              {data.dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1db954" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#1db954" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                    <XAxis 
                      dataKey="sale_date" 
                      stroke="#A0AEC0" 
                      tick={{ fill: '#A0AEC0', fontSize: 12, fontWeight: 500 }} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#A0AEC0" 
                      tick={{ fill: '#A0AEC0', fontSize: 12, fontWeight: 500 }} 
                      tickLine={false} 
                      axisLine={false}
                      dx={-10}
                      tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#1db954', fontWeight: 'bold' }}
                      formatter={(value) => [formatCurrency(value), 'Profit']}
                      labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="daily_profit" 
                      stroke="#1db954" 
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorProfit)"
                      activeDot={{ r: 8, fill: '#1db954', stroke: '#fff', strokeWidth: 2, boxShadow: '0 0 10px #1db954' }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted gap-3 bg-dark/20 rounded-xl border border-white/5">
                  <TrendingUp size={48} className="opacity-20" />
                  <p>No transaction data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Performance Array */}
          <div className="glass-card flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">Top Products</h3>
                <p className="text-xs text-muted mt-1">Highest profit margin items</p>
              </div>
              <div className="p-2 bg-dark/40 rounded-lg">
                <Package size={20} className="text-blue-400" />
              </div>
            </div>

            <div className="flex-grow overflow-hidden relative">
              {data.productBreakdown.length > 0 ? (
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                  {data.productBreakdown.map((prod, idx) => (
                    <div key={idx} className={`product-list-item rank-${idx + 1}`}>
                      
                      <div className="rank-circle">
                        {idx + 1}
                      </div>

                      <div className="flex-grow min-w-0 mr-auto" style={{ marginRight: '1rem' }}>
                        <p className="text-main" style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</p>
                        <div className="progress-track">
                          <div 
                            className="progress-bar" 
                            style={{ width: `${Math.min(100, (prod.qty_sold / (data.productBreakdown[0]?.qty_sold || 1)) * 100)}%` }}
                          ></div>
                        </div>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{prod.qty_sold} units moved</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(prod.prod_profit)}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>PROFIT</p>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted gap-3 bg-dark/20 rounded-xl border border-white/5">
                  <Package size={48} className="opacity-20" />
                  <p>No products sold</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default ProfitTracking;
