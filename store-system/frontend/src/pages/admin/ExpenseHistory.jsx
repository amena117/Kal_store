import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search, Calendar, X, ChevronLeft, ChevronRight, ArrowRight,
  Download, Eye, Clock, Users, Edit3, TrendingUp, DollarSign, FileText, Tag
} from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const ITEMS_PER_PAGE = 15;

/* ── Helpers ─────────────────────────────────────────────── */
const fmtCurrency = v => (v !== null && v !== undefined && v !== '') ? `$${parseFloat(v).toFixed(2)}` : '—';
const fmtDate     = v => v ? new Date(v).toLocaleString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const fmtTime     = v => v ? new Date(v).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) : '';

const countChanges = h => [
  String(h.old_title||'')   !== String(h.new_title||''),
  parseFloat(h.old_amount||0) !== parseFloat(h.new_amount||0),
].filter(Boolean).length;

/* ── DiffRow ─────────────────────────────────────────────── */
const DiffRow = ({ label, oldVal, newVal, type = 'text', icon: Icon }) => {
  const fmt     = type === 'currency' ? fmtCurrency : v => v || '—';
  const changed = type === 'currency'
    ? parseFloat(oldVal||0) !== parseFloat(newVal||0)
    : String(oldVal||'')    !== String(newVal||'');
  return (
    <div className={`diff-field-row ${changed ? 'diff-field-changed' : ''}`}>
      <div className="diff-field-label">
        {Icon && <Icon size={11}/>} {label}
        {changed && <span className="diff-changed-indicator">CHANGED</span>}
      </div>
      {changed ? (
        <div className="diff-values">
          <span className="diff-old">{fmt(oldVal)}</span>
          <ArrowRight size={13} style={{ color:'var(--text-muted)', flexShrink:0 }}/>
          <span className="diff-new">{fmt(newVal)}</span>
        </div>
      ) : (
        <div className="diff-unchanged">{fmt(newVal)} — no change</div>
      )}
    </div>
  );
};

/* ── Detail Drawer ───────────────────────────────────────── */
const DetailDrawer = ({ record, onClose }) => {
  if (!record) return null;
  const initials = (record.editor_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const n = countChanges(record);
  const amountDiff = parseFloat(record.new_amount||0) - parseFloat(record.old_amount||0);
  return (
    <>
      <div className="audit-drawer-overlay" onClick={onClose}/>
      <div className="audit-drawer">
        <div className="audit-drawer-header">
          <div>
            <div style={{ fontWeight:700, fontSize:'1rem' }}>Edit Detail</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>Expense #{record.expense_id}</div>
          </div>
          <button className="btn btn-glass btn-icon" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="audit-drawer-body">
          {/* Editor strip */}
          <div className="audit-editor-strip">
            <div className="editor-avatar">{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{record.editor_name || 'Unknown User'}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{fmtDate(record.date)}</div>
            </div>
            <span className={`changes-badge ${n>0 ? 'changes-badge-active' : 'changes-badge-none'}`}>{n} field{n!==1?'s':''} changed</span>
          </div>

          {/* Amount delta card */}
          {parseFloat(record.old_amount||0) !== parseFloat(record.new_amount||0) && (
            <div style={{
              background: amountDiff > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${amountDiff > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
              borderRadius:'var(--radius-md)', padding:'1rem 1.25rem', marginBottom:'1rem',
              display:'flex', alignItems:'center', gap:'0.75rem',
            }}>
              <DollarSign size={20} style={{ color: amountDiff > 0 ? '#FCA5A5' : '#6EE7B7', flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem' }}>
                  Amount {amountDiff > 0 ? 'Increased' : 'Decreased'}
                </div>
                <div style={{ fontWeight:700, fontSize:'1.1rem', color: amountDiff > 0 ? '#FCA5A5' : '#6EE7B7' }}>
                  {amountDiff > 0 ? '+' : ''}{fmtCurrency(amountDiff)}
                </div>
              </div>
            </div>
          )}

          {/* Field diffs */}
          <div className="audit-section-title"><Edit3 size={11}/> Field Changes</div>
          <DiffRow label="Title"  oldVal={record.old_title}  newVal={record.new_title}  type="text"     icon={Tag}/>
          <DiffRow label="Amount" oldVal={record.old_amount} newVal={record.new_amount} type="currency" icon={DollarSign}/>

          {/* Note */}
          {record.note && (
            <div className="audit-note-box">
              <div className="audit-note-label"><FileText size={10} style={{ display:'inline', marginRight:'0.3rem' }}/>Editor Note</div>
              {record.note}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ── Main Page ───────────────────────────────────────────── */
const ExpenseHistory = () => {
  const { activeBranchId, branchParam } = useAuth();
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [page,     setPage]     = useState(1);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses/history' + branchParam);
      setHistory(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, [activeBranchId]);
  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo]);

  const filtered = useMemo(() => history.filter(h => {
    const sl = search.toLowerCase();
    const ok = !search ||
      h.old_title?.toLowerCase().includes(sl) ||
      h.new_title?.toLowerCase().includes(sl) ||
      h.editor_name?.toLowerCase().includes(sl) ||
      String(h.expense_id).includes(sl);
    const d = new Date(h.date);
    return ok && (!dateFrom || d >= new Date(dateFrom)) && (!dateTo || d <= new Date(dateTo+'T23:59:59'));
  }), [history, search, dateFrom, dateTo]);

  const uniqueRecords      = new Set(history.map(h => h.expense_id)).size;
  const thisWeek           = history.filter(h => new Date(h.date) > new Date(Date.now()-7*86400000)).length;
  const totalAmountChanged = history.reduce((s,h) => s + Math.abs(parseFloat(h.new_amount||0) - parseFloat(h.old_amount||0)), 0);
  const totalPages         = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated          = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);
  const hasFilters         = search || dateFrom || dateTo;

  const exportData = () => exportToCSV(
    filtered.map(h => ({
      'Edit Date': h.date, 'Expense ID': h.expense_id,
      'Old Title': h.old_title, 'New Title': h.new_title,
      'Old Amount': h.old_amount, 'New Amount': h.new_amount,
      'Edited By': h.editor_name || 'Deleted User', Note: h.note || '',
      'Fields Changed': countChanges(h),
    })),
    'Expense_Edit_History'
  );

  const STATS = [
    { icon: Edit3,      label: 'Total Edits',     value: history.length,                          color: '#6366F1', bg: 'rgba(99,102,241,0.15)' },
    { icon: Users,      label: 'Expenses Touched', value: uniqueRecords,                           color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    { icon: Clock,      label: 'This Week',         value: thisWeek,                               color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    { icon: DollarSign, label: 'Amt. Adjusted',    value: fmtCurrency(totalAmountChanged),         color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  ];

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom:'2rem' }}>
      {selected && <DetailDrawer record={selected} onClose={() => setSelected(null)}/>}

      {/* Header */}
      <div className="page-header mb-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
            <span style={{ background:'linear-gradient(135deg,#F59E0B,#EF4444)', borderRadius:'0.5rem', padding:'0.4rem 0.6rem', display:'inline-flex', alignItems:'center' }}>
              <Edit3 size={20} color="white"/>
            </span>
            Expense Edit Audit
          </h1>
          <p className="text-muted" style={{ marginTop:'0.25rem' }}>Full change history — every expense modification tracked</p>
        </div>
        <div className="flex items-center gap-3">
          {filtered.length !== history.length && <span className="badge badge-success">{filtered.length} of {history.length}</span>}
          {hasFilters && <button className="btn btn-glass btn-sm" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}><X size={14}/> Clear</button>}
          <button className="btn btn-primary btn-sm" onClick={exportData} disabled={!filtered.length}><Download size={14}/> Export CSV</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {STATS.map((s,i) => (
          <div key={i} className="audit-stat-card">
            <div className="audit-stat-icon" style={{ background:s.bg, color:s.color }}><s.icon size={18}/></div>
            <div>
              <div style={{ fontSize: typeof s.value === 'string' ? '1rem' : '1.4rem', fontWeight:700, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1" style={{ minWidth:'220px' }}>
            <Search className="absolute left-3 top-2.5 text-muted" size={16}/>
            <input type="text" placeholder="Search title, editor, expense ID..." className="form-control pl-9" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-muted" size={16}/>
            <input type="date" className="form-control pl-9" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date"/>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-muted" size={16}/>
            <input type="date" className="form-control pl-9" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date"/>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Edit Date</th><th>Exp. ID</th><th>Title Change</th>
              <th>Amount Change</th><th>Δ Amount</th>
              <th>Changed</th><th>Edited By</th><th style={{ textAlign:'center' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>No audit records found.</td></tr>
            ) : paginated.map(h => {
              const titleChg  = String(h.old_title||'')   !== String(h.new_title||'');
              const amountChg = parseFloat(h.old_amount||0) !== parseFloat(h.new_amount||0);
              const n         = countChanges(h);
              const delta     = parseFloat(h.new_amount||0) - parseFloat(h.old_amount||0);
              const amtUp     = delta >= 0;
              return (
                <tr key={h.id} className={selected?.id === h.id ? 'audit-selected-row' : ''}>
                  <td style={{ fontSize:'0.8rem', whiteSpace:'nowrap' }}>
                    <div style={{ fontWeight:600 }}>{new Date(h.date).toLocaleDateString()}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{fmtTime(h.date)}</div>
                  </td>
                  <td><span className="badge badge-success">#{h.expense_id}</span></td>

                  {/* Title change */}
                  <td style={{ maxWidth:160 }}>
                    {titleChg ? (
                      <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', flexWrap:'wrap' }}>
                        <span className="change-pill change-pill-text" style={{ maxWidth:70, overflow:'hidden', textOverflow:'ellipsis', fontSize:'0.7rem' }}>{h.old_title||'—'}</span>
                        <ArrowRight size={10} style={{ color:'var(--text-muted)', flexShrink:0 }}/>
                        <span className="change-pill change-pill-up" style={{ maxWidth:70, overflow:'hidden', textOverflow:'ellipsis', fontSize:'0.7rem' }}>{h.new_title||'—'}</span>
                      </div>
                    ) : <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{h.new_title||'—'}</span>}
                  </td>

                  {/* Amount change */}
                  <td>
                    {amountChg ? (
                      <div className="diff-values" style={{ gap:'0.3rem' }}>
                        <span className="change-pill change-pill-down">{fmtCurrency(h.old_amount)}</span>
                        <ArrowRight size={10} style={{ color:'var(--text-muted)', flexShrink:0 }}/>
                        <span className={`change-pill ${amtUp ? 'change-pill-up' : 'change-pill-down'}`}>{fmtCurrency(h.new_amount)}</span>
                      </div>
                    ) : <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{fmtCurrency(h.new_amount)}</span>}
                  </td>

                  {/* Delta */}
                  <td>
                    {amountChg ? (
                      <span className={`change-pill ${amtUp ? 'change-pill-up' : 'change-pill-down'}`} style={{ fontWeight:700 }}>
                        {delta > 0 ? '+' : ''}{fmtCurrency(delta)}
                      </span>
                    ) : <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>—</span>}
                  </td>

                  <td><span className={`changes-badge ${n>0?'changes-badge-active':'changes-badge-none'}`}>{n} field{n!==1?'s':''}</span></td>
                  <td style={{ fontWeight:500 }}>{h.editor_name || <span style={{ color:'var(--text-muted)', fontStyle:'italic' }}>Deleted User</span>}</td>
                  <td style={{ textAlign:'center' }}>
                    <button className="btn btn-glass btn-icon btn-sm" title="View Details" onClick={() => setSelected(selected?.id === h.id ? null : h)}>
                      <Eye size={15}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Page {page} of {totalPages} &middot; {filtered.length} records</span>
          <div className="flex gap-2">
            <button className="btn btn-glass btn-sm" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}><ChevronLeft size={16}/></button>
            <button className="btn btn-glass btn-sm" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}><ChevronRight size={16}/></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseHistory;
