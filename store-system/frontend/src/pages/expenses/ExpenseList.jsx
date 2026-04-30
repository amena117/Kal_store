import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt,
  PlusSquare,
  AlertCircle,
  Clock,
  User as UserIcon,
  Search,
  DollarSign,
  Edit2,
  X
} from 'lucide-react';

const ExpenseList = () => {
  const { user, activeBranchId } = useAuth();
  const navigate = useNavigate();
  
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', amount: '', description: '', expense_date: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.role === 'Admin' && activeBranchId) {
        params.branch_id = activeBranchId;
      }
      const res = await api.get('/expenses', { params });
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [activeBranchId, user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount).replace('$', 'ETB ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const filteredExpenses = expenses.filter(exp => 
    exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (exp.description && exp.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    exp.registered_by.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setEditForm({
      title: expense.title,
      amount: expense.amount,
      description: expense.description || '',
      expense_date: expense.expense_date ? expense.expense_date.substring(0, 10) : ''
    });
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingExpense(null);
    setEditForm({ title: '', amount: '', description: '', expense_date: '' });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingExpense) return;
    setEditLoading(true);
    setEditError('');
    try {
      await api.put(`/expenses/${editingExpense.id}`, {
        title: editForm.title,
        amount: parseFloat(editForm.amount),
        description: editForm.description,
        expense_date: editForm.expense_date
      });
      closeEditModal();
      fetchExpenses();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update expense.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up h-full pb-10">
      
      {/* Header */}
      <div className="page-header mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="text-danger" size={28} /> Operations Expenses
          </h1>
          <p className="text-muted mt-1">
             Log and track store operational spending directly here.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/add-expense')}
            className="btn btn-primary"
          >
            <PlusSquare size={18} />
            Record Expense
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning mb-6">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Overview & Filter Card */}
      <div className="glass-card mb-6 flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-danger/20 text-danger rounded-xl">
              <DollarSign size={24} />
           </div>
           <div>
             <p className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Total Expenses</p>
             <p className="text-2xl font-bold text-white leading-none">{formatCurrency(total)}</p>
           </div>
        </div>
         
         <div className="flex-1 min-w-[200px] max-w-sm">
            <label className="text-xs font-semibold text-muted mb-1 block">Search expenses</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-muted" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="form-control pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="spinner"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center p-12 text-muted">
            <Receipt size={48} className="mx-auto mb-3 opacity-20" />
            <p>No expenses found. Click <strong>Record Expense</strong> to add one.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Expense Title</th>
                  <th>Amount</th>
                  <th className="hidden md:table-cell">Description</th>
                  <th className="hidden sm:table-cell">Date</th>
                  <th className="hidden lg:table-cell">Recorded By</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <div className="font-bold text-white">{exp.title}</div>
                      <div className="text-xs text-muted sm:hidden flex items-center gap-1 mt-1">
                        <Clock size={10} /> {formatDate(exp.expense_date)}
                      </div>
                    </td>
                    <td>
                      <span className="font-bold text-danger">{formatCurrency(exp.amount)}</span>
                    </td>
                    <td className="hidden md:table-cell max-w-[200px] truncate text-muted text-sm whitespace-normal">
                      {exp.description || '-'}
                    </td>
                    <td className="hidden sm:table-cell text-sm text-muted">
                      {formatDate(exp.expense_date)}
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="badge badge-glass flex items-center gap-1 w-fit">
                        <UserIcon size={12} /> {exp.registered_by}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <button
                          className="btn btn-sm btn-glass p-2"
                          onClick={() => openEditModal(exp)}
                          title="Edit Expense"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingExpense && createPortal(
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
            
            {/* Header with gradient */}
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
                  <h2 className="text-xl font-extrabold text-white tracking-tight truncate">Edit Expense</h2>
                  <p className="text-xs text-muted font-medium mt-0.5 truncate">Ref #{editingExpense.id}</p>
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
                  <AlertCircle size={18} className="text-danger mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-danger-light leading-snug">{editError}</span>
                </div>
              )}
              
              <form id="editExpenseForm" onSubmit={handleEditSubmit}>
                
                {/* Current Value Summary Card */}
                <div className="mb-6 p-4 rounded-xl border border-white/5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-xs text-muted font-bold uppercase tracking-wider">Current Amount</span>
                     <span className="text-sm text-muted line-through">{formatCurrency(editingExpense.amount)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-xs text-main font-bold uppercase tracking-wider">New Target Amount</span>
                     <span className="text-lg font-extrabold text-danger shadow-sm">
                       {editForm.amount ? formatCurrency(editForm.amount) : '---'}
                     </span>
                   </div>
                </div>

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
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
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
                        value={editForm.amount}
                        onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                        style={{ padding: '0.75rem 1rem 0.75rem 2.25rem', fontSize: '1rem' }}
                      />
                    </div>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Record Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock size={16} className="text-muted" />
                      </div>
                      <input
                        type="date"
                        className="form-control pl-9 bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors"
                        required
                        value={editForm.expense_date}
                        onChange={e => setEditForm({ ...editForm, expense_date: e.target.value })}
                        style={{ padding: '0.75rem 1rem 0.75rem 2.25rem', fontSize: '0.95rem' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Description (Optional)</label>
                  <textarea
                    className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors"
                    rows={3}
                    placeholder="Provide additional context or reason for this edit..."
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    style={{ resize: 'vertical', padding: '0.75rem 1rem', fontSize: '0.95rem' }}
                  />
                </div>
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
              <button 
                type="button"
                className="btn btn-glass" 
                onClick={closeEditModal} 
                disabled={editLoading}
                style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editExpenseForm"
                className="btn"
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

    </div>
  );
};

export default ExpenseList;
