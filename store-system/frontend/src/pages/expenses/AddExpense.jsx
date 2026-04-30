import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Receipt,
  ArrowLeft,
  Save,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Tag,
  Building2
} from 'lucide-react';

const AddExpense = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    expense_date: today,
    description: '',
    branch_id: ''
  });

  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (user?.role === 'Admin') {
      api.get('/branches')
        .then(res => {
          setBranches(res.data || []);
          if (res.data?.length > 0) {
            setFormData(prev => ({ ...prev, branch_id: res.data[0].id }));
          }
        })
        .catch(err => console.error('Failed to fetch branches', err));
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.expense_date) {
      setError('Title, Amount, and Date are required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/expenses', formData);
      navigate('/expenses');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to record expense.');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-2xl mx-auto animate-fade-in pb-24">
      {/* Header outside */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/expenses')}
          className="p-2 hover:bg-glass border border-transparent hover:border-glass-border rounded-xl transition-all text-muted hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Record New Expense
          </h1>
          <p className="text-sm text-muted mt-1">Add operational expenses directly to the ledger.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-5 flex items-start gap-3 shadow-lg" style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={18} className="text-danger mt-0.5 shrink-0" />
          <span className="text-sm font-medium text-danger-light leading-snug">{error}</span>
        </div>
      )}

      {/* Main Container styled like the modal */}
      <div className="animate-fade-in-up rounded-2xl" style={{ 
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header with gradient */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-danger/20 text-danger rounded-xl shadow-lg border border-danger/20 shrink-0">
              <Receipt size={22} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-white tracking-tight truncate">New Expense Detail</h2>
              <p className="text-xs text-muted font-medium mt-0.5 truncate">Fill in the expense information below</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <form id="addExpenseForm" onSubmit={handleSubmit}>
            
            <div className="form-group mb-5">
              <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Expense Title</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Receipt size={16} className="text-muted" />
                </div>
                <input
                  type="text"
                  className="form-control pl-10 bg-dark/40 border-white/10 focus:border-danger/50 focus:bg-dark/60 transition-colors"
                  required
                  placeholder="e.g., Office Supplies"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '0.95rem' }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="form-group mb-0">
                <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Amount (ETB)</label>
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
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    style={{ padding: '0.75rem 1rem 0.75rem 2.25rem', fontSize: '1rem' }}
                  />
                </div>
              </div>
              <div className="form-group mb-0">
                <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Record Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-muted" />
                  </div>
                  <input
                    type="date"
                    className="form-control pl-9 bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors"
                    required
                    value={formData.expense_date}
                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                    style={{ padding: '0.75rem 1rem 0.75rem 2.25rem', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
            </div>

            {user?.role === 'Admin' && (
              <div className="form-group mb-5">
                <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Store Branch</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={16} className="text-muted" />
                  </div>
                  <select
                    className="form-control pl-10 bg-dark/40 border-white/10 focus:border-danger/50 focus:bg-dark/60 transition-colors appearance-none"
                    required
                    value={formData.branch_id}
                    onChange={e => setFormData({ ...formData, branch_id: e.target.value })}
                    style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '0.95rem' }}
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id} style={{ background: '#1e293b', color: 'white' }}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-group mb-0">
              <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Description (Optional)</label>
              <textarea
                className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors"
                rows={3}
                placeholder="Provide additional context or reason for this expense..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ resize: 'vertical', padding: '0.75rem 1rem', fontSize: '0.95rem' }}
              />
            </div>
          </form>
        </div>
        
        <div style={{ 
          background: 'rgba(0,0,0,0.2)', 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button 
            type="button"
            className="btn btn-glass" 
            onClick={() => navigate('/expenses')} 
            disabled={loading}
            style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="addExpenseForm"
            className="btn"
            disabled={loading}
            style={{ 
              background: 'var(--danger)',
              color: 'white',
              padding: '0.6rem 1.5rem',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Recording...
              </>
            ) : (
              <>
                <Save size={16} /> Record Expense
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
