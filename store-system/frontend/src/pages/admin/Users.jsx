import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus, Check, X, Edit2, Lock, Unlock,
  Search, Filter, Shield, Eye, EyeOff, RefreshCw, Download, Building2
} from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const ROLE_BADGE = {
  Admin:       'badge-warning',
  Manager:     'badge-success',
  Encoder:     'badge-success',
  Salesperson: 'badge-success',
};

const Users = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);

  // Filter state
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');

  // Branches list
  const [branches, setBranches] = useState([]);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', username: '', password: '', confirmPassword: '', role: 'Encoder', branch_id: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showCreatePwd, setShowCreatePwd] = useState(false);

  // Edit modal
  const [editingUser, setEditingUser]   = useState(null);
  const [editForm, setEditForm]         = useState({ name: '', username: '', role: '', status: '', password: '', branch_id: '' });
  const [editLoading, setEditLoading]   = useState(false);
  const [editError, setEditError]       = useState('');
  const [showEditPwd, setShowEditPwd]   = useState(false);

  // Toggle loading per row
  const [togglingId, setTogglingId] = useState(null);

  const { activeBranchId, branchParam } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users' + branchParam);
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchUsers(); fetchBranches(); }, [activeBranchId]);

  /* ─── Filtering ──────────────────────────────────────── */
  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch  = !search || u.name.toLowerCase().includes(search.toLowerCase());
      const matchRole    = roleFilter   === 'All' || u.role   === roleFilter;
      const matchStatus  = statusFilter === 'All' || u.status === statusFilter;
      const matchBranch  = branchFilter === 'All' || String(u.branch_id) === String(branchFilter);
      return matchSearch && matchRole && matchStatus && matchBranch;
    });
  }, [users, search, roleFilter, statusFilter, branchFilter]);

  const hasActiveFilters = search || roleFilter !== 'All' || statusFilter !== 'All' || branchFilter !== 'All';
  const clearFilters = () => { setSearch(''); setRoleFilter('All'); setStatusFilter('All'); setBranchFilter('All'); };

  const exportData = () => {
    const formatted = filtered.map(u => ({
      ID: u.id,
      Name: u.name,
      Role: u.role,
      Branch: u.branch_name || 'N/A',
      Status: u.status,
      Created: u.created_at ? new Date(u.created_at).toLocaleString() : ''
    }));
    exportToCSV(formatted, 'Users');
  };

  /* ─── Create ─────────────────────────────────────────── */
  const openCreate = () => {
    setCreateForm({ name: '', username: '', password: '', confirmPassword: '', role: 'Encoder', branch_id: branches.length > 0 ? branches[0].id : '' });
    setCreateError('');
    setShowCreatePwd(false);
    setShowCreate(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    
    if (createForm.password !== createForm.confirmPassword) {
      setCreateError('Passwords do not match.');
      setCreateLoading(false);
      return;
    }

    try {
      await api.post('/users', createForm);
      setShowCreate(false);
      fetchUsers();
    } catch (err) {
      setCreateError(err.response?.data?.error || err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  /* ─── Edit ───────────────────────────────────────────── */
  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({ name: u.name, username: u.username || '', role: u.role, status: u.status, password: '', branch_id: u.branch_id || '' });
    setEditError('');
    setShowEditPwd(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setEditError('');
    const payload = { name: editForm.name, username: editForm.username, role: editForm.role, status: editForm.status, branch_id: editForm.branch_id };
    if (editForm.password) payload.password = editForm.password;
    try {
      await api.put(`/users/${editingUser.id}`, payload);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  /* ─── Quick toggle active/blocked ───────────────────── */
  const toggleStatus = async (u) => {
    setTogglingId(u.id);
    try {
      const newStatus = u.status === 'active' ? 'blocked' : 'active';
      await api.put(`/users/${u.id}`, { name: u.name, role: u.role, status: newStatus, branch_id: u.branch_id });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status');
    } finally {
      setTogglingId(null);
    }
  };

  /* ─── Helpers ────────────────────────────────────────── */
  const isProtected = (u) => u.role === 'Admin' || u.id === currentUser?.id;

  return (
    <div className="animate-fade-in-up h-full">
      <div className="glass-card min-h-full">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted">Manage system access and roles</p>
          </div>
          <div className="flex items-center gap-3">
            {filtered.length !== users.length && (
              <span className="badge badge-success text-sm">{filtered.length} of {users.length}</span>
            )}
            <button className="btn btn-glass btn-sm" onClick={fetchUsers} title="Refresh">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-primary" onClick={exportData} disabled={filtered.length === 0}>
              <Download size={18} /> Export CSV
            </button>
            <button className="btn btn-primary" onClick={openCreate}>
              <UserPlus size={18} /> New User
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel p-4 mb-4" style={{ borderRadius: '12px' }}>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1" style={{ minWidth: '200px' }}>
              <Search className="absolute left-3 top-2.5 text-muted" size={16} />
              <input
                type="text"
                placeholder="Search by name..."
                className="form-control pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="relative" style={{ minWidth: '160px' }}>
              <Shield className="absolute left-3 top-2.5 text-muted" size={16} />
              <select className="form-control pl-9" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Encoder">Encoder</option>
                <option value="Salesperson">Salesperson</option>
              </select>
            </div>
            <div className="relative" style={{ minWidth: '160px' }}>
              <Filter className="absolute left-3 top-2.5 text-muted" size={16} />
              <select className="form-control pl-9" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="relative" style={{ minWidth: '160px' }}>
              <Building2 className="absolute left-3 top-2.5 text-muted" size={16} />
              <select className="form-control pl-9" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                <option value="All">All Branches</option>
                {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
            {hasActiveFilters && (
              <button className="btn btn-glass btn-sm self-center" onClick={clearFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-4">No users found.</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id}>
                    <td className="text-muted text-sm">#{u.id}</td>
                    <td className="font-semibold">{u.name}</td>
                    <td className="text-muted">{u.username || '—'}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role] || 'badge-success'}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-sm text-muted">
                        <Building2 size={12} />{u.branch_name || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {u.status === 'active'
                        ? <span className="text-secondary flex items-center gap-1 text-sm"><Check size={13}/> Active</span>
                        : <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-danger, #f87171)' }}><X size={13}/> Blocked</span>
                      }
                    </td>
                    <td className="text-sm text-muted">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {/* Edit button — always show except for self-protection of Admin row */}
                        {!isProtected(u) && (
                          <>
                            <button
                              className="btn btn-sm btn-glass p-2"
                              title="Edit User"
                              onClick={() => openEdit(u)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className={`btn btn-sm p-2 ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                              title={u.status === 'active' ? 'Block User' : 'Unblock User'}
                              onClick={() => toggleStatus(u)}
                              disabled={togglingId === u.id}
                            >
                              {togglingId === u.id
                                ? <RefreshCw size={13} className="animate-spin" />
                                : u.status === 'active' ? <Lock size={13}/> : <Unlock size={13}/>
                              }
                            </button>
                          </>
                        )}
                        {isProtected(u) && (
                          <span className="text-xs text-muted italic">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create User Modal ──────────────────────────── */}
      {showCreate && createPortal(
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
                  <UserPlus size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-white tracking-tight truncate">Create New User</h2>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowCreate(false)}
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
              {createError && (
                <div className="alert alert-error mb-5 flex items-start gap-3 shadow-lg" style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <X size={18} className="text-danger mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-danger-light leading-snug">{createError}</span>
                </div>
              )}
              <form id="createUserForm" onSubmit={handleCreate}>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Full Name</label>
                    <input type="text" className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors" required
                      placeholder="Enter user's full name"
                      value={createForm.name}
                      onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                      style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Username</label>
                    <input type="text" className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors" required
                      placeholder="Enter login username"
                      value={createForm.username}
                      onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                      style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Password</label>
                    <div className="relative">
                      <input
                        type={showCreatePwd ? 'text' : 'password'}
                        className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors pr-10"
                        required minLength={6}
                        placeholder="Min. 6 characters"
                        value={createForm.password}
                        onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                        style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}
                      />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors"
                        onClick={() => setShowCreatePwd(p => !p)}
                        tabIndex="-1"
                        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                      >
                        {showCreatePwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showCreatePwd ? 'text' : 'password'}
                        className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors pr-10"
                        required minLength={6}
                        placeholder="Confirm password"
                        value={createForm.confirmPassword}
                        onChange={e => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                        style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}
                      />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors"
                        onClick={() => setShowCreatePwd(p => !p)}
                        tabIndex="-1"
                        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                      >
                        {showCreatePwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="form-group mb-5">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Role</label>
                  <select className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors appearance-none" value={createForm.role}
                    onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                    style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}>
                    <option value="Encoder" className="bg-dark text-white">Encoder</option>
                    <option value="Salesperson" className="bg-dark text-white">Salesperson</option>
                    <option value="Manager" className="bg-dark text-white">Manager</option>
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Branch</label>
                  <select className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors appearance-none" value={createForm.branch_id}
                    onChange={e => setCreateForm({ ...createForm, branch_id: e.target.value })} required
                    style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}>
                    <option value="" className="bg-dark text-white">— Select Branch —</option>
                    {branches.filter(b => b.status === 'active').map(b => (
                      <option key={b.id} value={b.id} className="bg-dark text-white">{b.name}</option>
                    ))}
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
              <button className="btn btn-glass" onClick={() => setShowCreate(false)} disabled={createLoading} style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}>Cancel</button>
              <button type="submit" form="createUserForm" className="btn btn-primary" disabled={createLoading} style={{ 
                  background: 'var(--main)',
                  color: 'white',
                  padding: '0.6rem 1.5rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexShrink: 0
                }}>
                {createLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* ── Edit User Modal ────────────────────────────── */}
      {editingUser && createPortal(
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
                  <Edit2 size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-white tracking-tight truncate">Edit User</h2>
                  <p className="text-xs text-muted font-medium mt-0.5 truncate">#{editingUser.id} — {editingUser.name}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
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
                  <X size={18} className="text-danger mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-danger-light leading-snug">{editError}</span>
                </div>
              )}
              <form id="editUserForm" onSubmit={handleEdit}>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Full Name</label>
                    <input type="text" className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors" required
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Username</label>
                    <input type="text" className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors" required
                      value={editForm.username}
                      onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                      style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Role</label>
                    <select className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors appearance-none" value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}>
                      <option value="Encoder" className="bg-dark text-white">Encoder</option>
                      <option value="Salesperson" className="bg-dark text-white">Salesperson</option>
                      <option value="Manager" className="bg-dark text-white">Manager</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Status</label>
                    <select className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors appearance-none" value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}>
                      <option value="active" className="bg-dark text-white">Active</option>
                      <option value="blocked" className="bg-dark text-white">Blocked</option>
                    </select>
                  </div>
                </div>
                <div className="form-group mb-5">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Branch</label>
                  <select className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors appearance-none" value={editForm.branch_id}
                    onChange={e => setEditForm({ ...editForm, branch_id: e.target.value })}
                    style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}>
                    {branches.map(b => (<option key={b.id} value={b.id} className="bg-dark text-white">{b.name}</option>))}
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">
                    New Password
                    <span className="text-muted font-normal text-xs ml-2">(leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPwd ? 'text' : 'password'}
                      className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors pr-10"
                      placeholder="New password (optional)"
                      minLength={6}
                      value={editForm.password}
                      onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                      style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}
                    />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                      onClick={() => setShowEditPwd(p => !p)}
                      tabIndex="-1"
                    >
                      {showEditPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
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
              <button className="btn btn-glass" onClick={() => setEditingUser(null)} disabled={editLoading} style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}>Cancel</button>
              <button type="submit" form="editUserForm" className="btn btn-primary" disabled={editLoading} style={{ 
                  background: 'var(--main)',
                  color: 'white',
                  padding: '0.6rem 1.5rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexShrink: 0
                }}>
                {editLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default Users;
