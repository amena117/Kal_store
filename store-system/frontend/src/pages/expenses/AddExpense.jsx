import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Receipt,
  ArrowLeft,
  Save,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Tag
} from 'lucide-react';

const AddExpense = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    expense_date: today,
    description: ''
  });

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
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in pb-24">
      {/* Header */}
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
        <div className="bg-danger/20 text-danger-content border-l-4 border-danger p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Form Container */}
      <div className="glass-panel p-6 md:p-8 rounded-2xl shadow-xl border border-glass-border relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-danger/10 rounded-full blur-3xl pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Tag size={16} className="text-danger" /> Expense Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g., Transport to Mega Mall"
                  className="w-full bg-dark/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:border-danger focus:ring-1 focus:ring-danger transition-all outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <DollarSign size={16} className="text-danger" /> Amount (ETB)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full bg-dark/60 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder-muted focus:border-danger focus:ring-1 focus:ring-danger transition-all outline-none"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Calendar size={16} className="text-danger" /> Expense Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  className="w-full bg-dark/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-danger focus:ring-1 focus:ring-danger transition-all outline-none"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <FileText size={16} className="text-danger" /> Description (Optional)
            </label>
            <div className="relative">
              <textarea
                placeholder="Add any extra details or reference numbers here..."
                rows="4"
                className="w-full bg-dark/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted focus:border-danger focus:ring-1 focus:ring-danger transition-all outline-none resize-none custom-scrollbar"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/expenses')}
              className="px-6 py-3 rounded-xl text-muted hover:text-white font-medium transition-colors mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn bg-gradient-to-r from-danger to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="spinner border-t-white w-5 h-5 rounded-full animate-spin border-2 border-solid"></div>
              ) : (
                <Save size={20} />
              )}
              {loading ? 'Recording...' : 'Record Expense'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
