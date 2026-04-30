import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, DollarSign, TrendingUp, Package, AlertTriangle, Building2, Globe } from 'lucide-react';

const Dashboard = () => {
  const { activeBranchId, branchParam, user } = useAuth();

  const [stats, setStats] = useState({
    capital: 0,
    profit: 0,
    totalSales: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard' + branchParam);
      if (res.data) setStats(res.data);
    } catch (err) {
      setError('Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever active branch changes
  useEffect(() => { fetchStats(); }, [activeBranchId]);

  const branchLabel = activeBranchId === null
    ? 'All Branches'
    : (stats._branch_name || 'Selected Branch');

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted flex items-center gap-2 mt-1">
            {activeBranchId
              ? <><Building2 size={14} /> Viewing: <span className="text-main font-semibold">{branchLabel}</span></>
              : <><Globe size={14} /> Viewing: <span className="text-main font-semibold">All Branches Combined</span></>
            }
          </p>
        </div>
        <button onClick={fetchStats} className="btn btn-primary btn-sm">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error ? (
        <div className="alert alert-error">
          <AlertTriangle size={20} />
          {error}
        </div>
      ) : (
        <div className="grid-cards">
          <div className="glass-card flex items-center justify-between">
            <div>
              <p className="text-sm text-muted uppercase font-semibold">Total Capital</p>
              <h2 className="text-2xl font-bold text-main mt-1">
                {loading ? '—' : `$${parseFloat(stats.capital || 0).toFixed(2)}`}
              </h2>
            </div>
            <div className="bg-primary bg-opacity-20 p-3 rounded-full text-primary">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="glass-card flex items-center justify-between">
            <div>
              <p className="text-sm text-muted uppercase font-semibold">Total Profit</p>
              <h2 className="text-2xl font-bold text-secondary mt-1">
                {loading ? '—' : `$${parseFloat(stats.profit || 0).toFixed(2)}`}
              </h2>
            </div>
            <div className="bg-secondary bg-opacity-20 p-3 rounded-full text-secondary">
              <TrendingUp size={24} />
            </div>
          </div>

          <div className="glass-card flex items-center justify-between">
            <div>
              <p className="text-sm text-muted uppercase font-semibold">Total Revenue</p>
              <h2 className="text-2xl font-bold text-main mt-1">
                {loading ? '—' : `$${parseFloat(stats.totalRevenue || 0).toFixed(2)}`}
              </h2>
            </div>
            <div className="bg-primary bg-opacity-20 p-3 rounded-full text-primary">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="glass-card flex items-center justify-between">
            <div>
              <p className="text-sm text-muted uppercase font-semibold">Items Sold</p>
              <h2 className="text-2xl font-bold text-main mt-1">
                {loading ? '—' : (stats.totalSales || 0)}
              </h2>
            </div>
            <div className="bg-warning bg-opacity-20 p-3 rounded-full text-warning">
              <Package size={24} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
