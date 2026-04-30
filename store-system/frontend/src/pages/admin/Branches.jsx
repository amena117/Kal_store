import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { Building2, Plus, Edit2, X, Download, CheckCircle, XCircle } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'create' | branch-object
  const [form, setForm]         = useState({ name: '', location: '', status: 'active' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/branches');
      setBranches(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  const openCreate = () => {
    setForm({ name: '', location: '', status: 'active' });
    setError('');
    setModal('create');
  };

  const openEdit = (branch) => {
    setForm({ name: branch.name, location: branch.location || '', status: branch.status });
    setError('');
    setModal(branch);
  };

  const closeModal = () => { setModal(null); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'create') {
        await api.post('/branches', form);
      } else {
        await api.put(`/branches/${modal.id}`, form);
      }
      closeModal();
      fetchBranches();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save branch.');
    } finally {
      setSaving(false);
    }
  };

  const exportData = () => {
    exportToCSV(branches.map(b => ({
      ID: b.id,
      Name: b.name,
      Location: b.location || '',
      Status: b.status,
      'Created At': b.created_at
    })), 'Branches');
  };

  const isEditing = modal !== null && modal !== 'create';

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header mb-6">
        <div>
          <h1 className="text-3xl font-bold">Branch Management</h1>
          <p className="text-muted">Create and manage store branches</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-glass btn-sm" onClick={exportData} disabled={branches.length === 0}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Branch
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))' }}>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-main">{branches.length}</div>
          <div className="text-sm text-muted mt-1">Total Branches</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-secondary">{branches.filter(b => b.status === 'active').length}</div>
          <div className="text-sm text-muted mt-1">Active</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-warning">{branches.filter(b => b.status === 'inactive').length}</div>
          <div className="text-sm text-muted mt-1">Inactive</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="glass-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Branch Name</th>
              <th>Location</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr>
            ) : branches.length === 0 ? (
              <tr><td colSpan="6" className="text-center p-4">No branches yet. Create one to get started.</td></tr>
            ) : (
              branches.map(b => (
                <tr key={b.id}>
                  <td className="text-muted text-sm">#{b.id}</td>
                  <td className="font-semibold flex items-center gap-2">
                    <Building2 size={16} className="text-main shrink-0" />
                    {b.name}
                  </td>
                  <td className="text-muted">{b.location || <span className="italic">—</span>}</td>
                  <td>
                    {b.status === 'active'
                      ? <span className="badge badge-success flex items-center gap-1 w-fit"><CheckCircle size={12} /> Active</span>
                      : <span className="badge badge-danger flex items-center gap-1 w-fit"><XCircle size={12} /> Inactive</span>
                    }
                  </td>
                  <td className="text-sm text-muted">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-glass p-2" onClick={() => openEdit(b)} title="Edit Branch">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modal !== null && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-fade-in-up" style={{ 
            maxWidth: '500px', 
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-main/20 text-main rounded-xl shadow-lg border border-main/20 shrink-0">
                  {isEditing ? <Edit2 size={22} strokeWidth={2.5} /> : <Plus size={22} strokeWidth={2.5} />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-white tracking-tight truncate">{isEditing ? `Edit Branch` : 'New Branch'}</h2>
                  {isEditing && <p className="text-xs text-muted font-medium mt-0.5 truncate">{modal.name}</p>}
                </div>
              </div>
              <button 
                type="button"
                onClick={closeModal}
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
              {error && (
                <div className="alert alert-error mb-5 flex items-start gap-3 shadow-lg" style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <XCircle size={18} className="text-danger mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-danger-light leading-snug">{error}</span>
                </div>
              )}
              <form id="branchForm" onSubmit={handleSubmit}>
                <div className="form-group mb-5">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Branch Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 size={16} className="text-muted" />
                    </div>
                    <input
                      type="text"
                      className="form-control pl-10 bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors"
                      placeholder="e.g. Downtown Branch"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '0.95rem' }}
                    />
                  </div>
                </div>
                <div className="form-group mb-5">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Location</label>
                  <input
                    type="text"
                    className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors"
                    placeholder="e.g. 123 Main St, Addis Ababa"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Status</label>
                  <select
                    className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors appearance-none"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}
                  >
                    <option value="active" className="bg-dark text-white">Active</option>
                    <option value="inactive" className="bg-dark text-white">Inactive</option>
                  </select>
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
                onClick={closeModal} 
                disabled={saving}
                style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="branchForm" 
                className="btn btn-primary" 
                disabled={saving}
                style={{ 
                  background: 'var(--main)',
                  color: 'white',
                  padding: '0.6rem 1.5rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexShrink: 0
                }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : isEditing ? 'Save Changes' : 'Create Branch'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default Branches;
