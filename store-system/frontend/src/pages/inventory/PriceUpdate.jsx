import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
  Package,
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  X,
  Save,
  History,
  ArrowRight,
  ChevronRight,
  Tag,
  User,
  Info,
  BarChart3,
  Zap,
  Edit3,
  Clock,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const money = (val) =>
  `$${(isNaN(parseFloat(val)) ? 0 : parseFloat(val)).toFixed(2)}`;
const todayISO = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => {
  if (!d) return 'â€”';
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return d; }
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const PriceUpdate = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(todayISO());
  const [supplierName, setSupplierName] = useState('');
  const [remarks, setRemarks] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState('update');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [statusMessage, setStatusMessage] = useState(null);
  const [step, setStep] = useState(1); // 1: select product  2: set price  3: details

  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowProductDropdown(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => { fetchProducts(); fetchHistory(); }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try { const res = await api.get('/products'); setProducts(res.data || []); }
    catch (err) { console.error('Failed to load products', err); }
    finally { setLoadingProducts(false); }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try { const res = await api.get('/price-updates'); setHistory(res.data || []); }
    catch (err) { console.error('Failed to load history', err); }
    finally { setLoadingHistory(false); }
  };

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(selectedProductId)) || null,
    [products, selectedProductId]
  );

  const selectProduct = (prod) => {
    setSelectedProductId(String(prod.id));
    setProductSearch(prod.name);
    setNewPurchasePrice('');
    setNewSellingPrice('');
    setShowProductDropdown(false);
    setStep(2);
  };

  const metrics = useMemo(() => {
    const curr = parseFloat(selectedProduct?.arrival_price);
    const next = parseFloat(newPurchasePrice);
    if (!selectedProduct || isNaN(curr) || isNaN(next) || newPurchasePrice === '')
      return { diff: 0, percent: 0, isValid: false };
    const diff = next - curr;
    const percent = curr > 0 ? (diff / curr) * 100 : 0;
    return { diff, percent, isValid: true, curr, next };
  }, [selectedProduct, newPurchasePrice]);

  const applyQuickPreset = (pct) => {
    if (!selectedProduct) return;
    const curr = parseFloat(selectedProduct.arrival_price);
    if (isNaN(curr)) return;
    setNewPurchasePrice((curr * (1 + pct / 100)).toFixed(2));
  };

  const handleReasonPreset = (tag) => {
    if (remarks.includes(tag)) return;
    setRemarks((prev) => (prev ? `${prev}, ${tag}` : tag));
  };

  const handleReset = () => {
    setSelectedProductId(''); setProductSearch(''); setNewPurchasePrice(''); setNewSellingPrice('');
    setEffectiveDate(todayISO()); setSupplierName(''); setRemarks('');
    setStatusMessage(null); setShowProductDropdown(false); setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) { setStatusMessage({ type: 'error', text: 'Choose a product first.' }); return; }
    if (!newPurchasePrice || isNaN(newPurchasePrice) || parseFloat(newPurchasePrice) < 0) {
      setStatusMessage({ type: 'error', text: 'Enter a valid new purchase price.' }); return;
    }
    setSubmitting(true); setStatusMessage(null);
    try {
      const fullRemarks = supplierName.trim()
        ? `[Supplier: ${supplierName.trim()}] ${remarks.trim()}` : remarks.trim();
      const res = await api.post('/price-updates', {
        product_id: parseInt(selectedProductId, 10),
        new_price: parseFloat(newPurchasePrice),
        new_selling_price: newSellingPrice !== '' ? parseFloat(newSellingPrice) : null,
        effective_date: effectiveDate,
        remarks: fullRemarks,
      });
      if (res.data?.success) {
        setStatusMessage({ type: 'success', text: `Price updated for "${selectedProduct?.name}".` });
        handleReset(); fetchProducts(); fetchHistory();
      } else {
        setStatusMessage({ type: 'error', text: res.data?.message || 'Could not save the price update.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Something went wrong.' });
    } finally { setSubmitting(false); }
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase();
    return history.filter((item) => {
      const matches =
        (item.product_name || '').toLowerCase().includes(q) ||
        (item.updated_by_name || '').toLowerCase().includes(q) ||
        (item.remarks || '').toLowerCase().includes(q);
      const diff = parseFloat(item.price_difference);
      if (historyFilter === 'increase') return matches && diff > 0;
      if (historyFilter === 'decrease') return matches && diff < 0;
      return matches;
    });
  }, [history, historySearch, historyFilter]);

  const stats = useMemo(() => {
    const increases = history.filter((h) => parseFloat(h.price_difference) > 0);
    const decreases = history.filter((h) => parseFloat(h.price_difference) < 0);
    return { total: history.length, increases: increases.length, decreases: decreases.length };
  }, [history]);

  /* â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const s = {
    page: { minHeight: '100%', background: 'var(--bg-gradient)', color: 'var(--text-main)', fontFamily: 'Inter,sans-serif' },
    wrap: { maxWidth: 1080, margin: '0 auto', padding: '28px 24px' },
    card: { background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: 16 },
    input: (pl = 12) => ({
      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: `9px 12px 9px ${pl}px`, fontSize: 13, color: '#f1f5f9',
      outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box',
    }),
    divider: { width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' },
    sectionLabel: { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 },
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 26 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag size={18} color="#fff" />
              </div>
              <h1 style={{ fontSize: 21, fontWeight: 700, color: '#fff', margin: 0 }}>Purchase Price Manager</h1>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
              Track supplier cost changes â€” past sales &amp; profit reports are never affected.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <MiniStat label="Total changes" value={stats.total} icon={<BarChart3 size={15} />} color="#6366f1" />
            <MiniStat label="Increases" value={stats.increases} icon={<TrendingUp size={15} />} color="#ef4444" />
            <MiniStat label="Decreases" value={stats.decreases} icon={<TrendingDown size={15} />} color="#10b981" />
          </div>
        </div>

        {/* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 22 }}>
          {[
            { id: 'update', label: 'Update Price', icon: <Edit3 size={14} /> },
            { id: 'history', label: `History (${stats.total})`, icon: <History size={14} /> },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: activeTab === tab.id ? 'rgba(79,70,229,0.14)' : 'transparent',
              color: activeTab === tab.id ? '#818cf8' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === tab.id ? '#6366f1' : 'transparent'}`,
              fontFamily: 'inherit', transition: 'all 0.18s',
            }}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* â”€â”€ Status banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {statusMessage && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '11px 15px', borderRadius: 10, marginBottom: 18,
            background: statusMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span style={{ fontSize: 13, fontWeight: 500 }}>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• UPDATE TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === 'update' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>

            {/* â”€â”€ Form card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div style={s.card}>

              {/* Step indicator */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {[{ n: 1, label: 'Select Product' }, { n: 2, label: 'Set Price' }, { n: 3, label: 'Details & Save' }].map((st, i, arr) => {
                  const active = step === st.n; const done = step > st.n;
                  return (
                    <React.Fragment key={st.n}>
                      <button onClick={() => { if (done || active) setStep(st.n); }} disabled={st.n > step && !done}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 10px', background: active ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', borderBottom: `2px solid ${active ? '#6366f1' : 'transparent'}`, cursor: (done || active) ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: done ? '#10b981' : active ? '#6366f1' : 'rgba(255,255,255,0.1)', color: '#fff', flexShrink: 0 }}>
                          {done ? <CheckCircle2 size={12} /> : st.n}
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: active ? '#a5b4fc' : done ? '#6ee7b7' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{st.label}</span>
                      </button>
                      {i < arr.length - 1 && <div style={{ alignSelf: 'center', color: 'rgba(255,255,255,0.12)', flexShrink: 0 }}><ChevronRight size={13} /></div>}
                    </React.Fragment>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} style={{ padding: 22 }}>

                {/* STEP 1 */}
                <div>
                  <span style={s.sectionLabel}>Step 1 â€” Select a product</span>
                  {selectedProduct ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 13px', borderRadius: 10, background: 'rgba(99,102,241,0.09)', border: '1px solid rgba(99,102,241,0.28)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={16} color="#818cf8" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedProduct.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {selectedProduct.quantity} in stock &middot; Cost: <strong style={{ color: '#a5b4fc' }}>{money(selectedProduct.arrival_price)}</strong>
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={handleReset} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>Change</button>
                    </div>
                  ) : (
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input id="product-search" type="text" value={productSearch} autoComplete="off"
                          onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                          onFocus={() => setShowProductDropdown(true)}
                          placeholder="Type to search productsâ€¦"
                          style={{ ...s.input(38), border: '1px solid rgba(255,255,255,0.12)' }}
                        />
                        {productSearch && (
                          <button type="button" onClick={() => { setProductSearch(''); setSelectedProductId(''); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      {showProductDropdown && (
                        <div style={{ position: 'absolute', zIndex: 30, left: 0, right: 0, top: 'calc(100% + 5px)', maxHeight: 255, overflowY: 'auto', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
                          {loadingProducts ? (
                            <div style={{ padding: 18, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <RefreshCw size={13} style={{ animation: 'pu-spin 1s linear infinite' }} /> Loadingâ€¦
                            </div>
                          ) : filteredProducts.length === 0 ? (
                            <div style={{ padding: 18, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>No products match "{productSearch}"</div>
                          ) : filteredProducts.map((p) => (
                            <button type="button" key={p.id} onClick={() => selectProduct(p)}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 13px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.12s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.quantity} in stock &middot; sells for {money(p.selling_price)}</div>
                              </div>
                              <div style={{ flexShrink: 0, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#34d399' }}>{money(p.arrival_price)}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* STEP 2 */}
                {step >= 2 && (
                  <>
                    <div style={s.divider} />
                    <span style={s.sectionLabel}>Step 2 â€” Set the new purchase price</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 5 }}>Current cost</div>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 14 }}>$</span>
                          <input readOnly value={selectedProduct ? parseFloat(selectedProduct.arrival_price || 0).toFixed(2) : '0.00'}
                            style={{ ...s.input(26), color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', cursor: 'default' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, marginBottom: 5 }}>New cost <span style={{ color: '#f87171' }}>*</span></div>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'monospace', color: '#818cf8', fontSize: 14, fontWeight: 700 }}>$</span>
                          <input id="new-price" type="number" step="0.01" min="0" required
                            value={newPurchasePrice} disabled={!selectedProduct}
                            onChange={(e) => { setNewPurchasePrice(e.target.value); if (e.target.value && step < 3) setStep(3); }}
                            placeholder="0.00"
                            style={{ ...s.input(26), border: '1px solid rgba(99,102,241,0.45)', fontWeight: 700, color: '#fff' }} />
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 5 }}>Current Selling Price</div>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 14 }}>$</span>
                          <input readOnly value={selectedProduct ? parseFloat(selectedProduct.selling_price || 0).toFixed(2) : '0.00'}
                            style={{ ...s.input(26), color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', cursor: 'default' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginBottom: 5 }}>New Selling Price</div>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'monospace', color: '#34d399', fontSize: 14, fontWeight: 700 }}>$</span>
                          <input id="new-selling-price" type="number" step="0.01" min="0"
                            value={newSellingPrice} disabled={!selectedProduct}
                            onChange={(e) => setNewSellingPrice(e.target.value)}
                            placeholder="0.00 (optional)"
                            style={{ ...s.input(26), border: '1px solid rgba(16,185,129,0.45)', fontWeight: 700, color: '#fff' }} />
                        </div>
                      </div>
                    </div>
                    {/* Quick presets */}
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Zap size={12} /> Quick adjust
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[-15, -10, -5, 5, 10, 15, 20].map((pct) => (
                          <QuickBtn key={pct} label={pct > 0 ? `+${pct}%` : `${pct}%`} color={pct > 0 ? '#ef4444' : '#10b981'}
                            onClick={() => applyQuickPreset(pct)} disabled={!selectedProduct} />
                        ))}
                        <QuickBtn label="Round up" color="#6366f1"
                          onClick={() => { if (newPurchasePrice && !isNaN(newPurchasePrice)) setNewPurchasePrice(Math.ceil(parseFloat(newPurchasePrice)).toFixed(2)); }}
                          disabled={!newPurchasePrice} />
                      </div>
                    </div>
                    {step === 2 && !metrics.isValid && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 11.5, marginTop: 14 }}>
                        <Info size={12} /> Enter a new price above to continue to step 3.
                      </div>
                    )}
                  </>
                )}

                {/* STEP 3 */}
                {step >= 3 && (
                  <>
                    <div style={s.divider} />
                    <span style={s.sectionLabel}>Step 3 â€” Fill in details &amp; save</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <div>
                        <label htmlFor="effective-date" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 5 }}>
                          Effective date <span style={{ color: '#f87171' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Calendar size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                          <input id="effective-date" type="date" required value={effectiveDate}
                            onChange={(e) => setEffectiveDate(e.target.value)}
                            style={s.input(34)} />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="supplier" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 5 }}>
                          Supplier <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Building size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                          <input id="supplier" type="text" value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            placeholder="Vendor name" style={s.input(34)} />
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 7, marginBottom: 7 }}>
                        <label htmlFor="remarks" style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                          Reason <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                        </label>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {['Supplier tariff', 'Volume discount', 'Freight cost', 'Currency change'].map((tag) => (
                            <button key={tag} type="button" onClick={() => handleReasonPreset(tag)}
                              style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.13s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.14)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >+ {tag}</button>
                          ))}
                        </div>
                      </div>
                      <textarea id="remarks" rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Why is this price changing? (e.g. new supplier contract, seasonal tariffâ€¦)"
                        style={{ ...s.input(), resize: 'none', lineHeight: 1.6, paddingTop: 10, paddingBottom: 10 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button type="button" onClick={handleReset}
                        style={{ padding: '8px 17px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >Reset</button>
                      <button type="submit" disabled={submitting || !selectedProductId || !newPurchasePrice}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: (submitting || !selectedProductId || !newPurchasePrice) ? 0.45 : 1, transition: 'all 0.18s', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', fontFamily: 'inherit' }}>
                        {submitting ? <RefreshCw size={14} style={{ animation: 'pu-spin 1s linear infinite' }} /> : <Save size={14} />}
                        Save price update
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>

            {/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Live preview */}
              <div style={{ ...s.card, padding: 18 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BarChart3 size={12} /> Live Preview
                </div>
                {metrics.isValid ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <PriceBox label="Old" value={money(metrics.curr)} muted />
                      <ArrowRight size={14} color="#6366f1" style={{ flexShrink: 0 }} />
                      <PriceBox label="New" value={money(metrics.next)} accent />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 13px', borderRadius: 9, marginBottom: 10, background: metrics.diff > 0 ? 'rgba(239,68,68,0.09)' : metrics.diff < 0 ? 'rgba(16,185,129,0.09)' : 'rgba(255,255,255,0.04)', border: `1px solid ${metrics.diff > 0 ? 'rgba(239,68,68,0.22)' : metrics.diff < 0 ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.07)'}` }}>
                      <div>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net change</div>
                        <div style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 800, color: metrics.diff > 0 ? '#f87171' : metrics.diff < 0 ? '#34d399' : '#fff', marginTop: 3 }}>
                          {metrics.diff > 0 ? '+' : ''}{money(metrics.diff)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', color: metrics.diff > 0 ? '#f87171' : metrics.diff < 0 ? '#34d399' : '#fff', fontWeight: 800, fontSize: 15 }}>
                          {metrics.diff > 0 ? <TrendingUp size={15} /> : metrics.diff < 0 ? <TrendingDown size={15} /> : null}
                          {metrics.percent > 0 ? '+' : ''}{metrics.percent.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 3 }}>{metrics.diff > 0 ? 'Cost increase' : metrics.diff < 0 ? 'Cost reduction' : 'No change'}</div>
                      </div>
                    </div>
                    <ImpactPill percent={Math.abs(metrics.percent)} isIncrease={metrics.diff > 0} />
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 14px', border: '1px dashed rgba(255,255,255,0.09)', borderRadius: 9, textAlign: 'center' }}>
                    <DollarSign size={26} color="rgba(255,255,255,0.13)" style={{ marginBottom: 9 }} />
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                      Select a product and enter a price to see the impact here.
                    </p>
                  </div>
                )}
              </div>

              {/* Safety note */}
              <div style={{ display: 'flex', gap: 10, padding: '13px 15px', borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
                <ShieldCheck size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: '#6ee7b7' }}>Safe to use.</strong> Past sales and profit reports are never modified â€” only new stock going forward is affected.
                </p>
              </div>

              {/* Recent updates */}
              {history.slice(0, 4).length > 0 && (
                <div style={{ ...s.card, padding: '15px 17px' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={12} /> Recent updates
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {history.slice(0, 4).map((h) => {
                      const diff = parseFloat(h.price_difference);
                      return (
                        <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 7, padding: '7px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.product_name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{fmtDate(h.effective_date || h.created_at?.split(' ')[0])}</div>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: diff > 0 ? '#f87171' : diff < 0 ? '#34d399' : '#94a3b8', flexShrink: 0 }}>
                            {diff > 0 ? '+' : ''}{money(diff)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HISTORY TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === 'history' && (
          <div style={s.card}>
            {/* toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '15px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', margin: 0 }}>Price Update History</h2>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>All supplier cost changes, most recent first</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7 }}>
                <div style={{ display: 'flex', gap: 3, background: 'rgba(0,0,0,0.22)', borderRadius: 7, padding: 3 }}>
                  {[
                    { key: 'all', label: `All (${stats.total})` },
                    { key: 'increase', label: `â†‘ Up (${stats.increases})`, col: '#f87171' },
                    { key: 'decrease', label: `â†“ Down (${stats.decreases})`, col: '#34d399' },
                  ].map((f) => (
                    <button key={f.key} onClick={() => setHistoryFilter(f.key)}
                      style={{ padding: '4px 11px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: historyFilter === f.key ? '#4f46e5' : 'transparent', color: historyFilter === f.key ? '#fff' : (f.col || 'var(--text-muted)'), transition: 'all 0.13s', fontFamily: 'inherit' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input type="text" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Searchâ€¦" style={{ ...s.input(30), width: 190, fontSize: 11.5, padding: '6px 10px 6px 30px' }} />
                </div>
                <button onClick={fetchHistory}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <RefreshCw size={11} style={loadingHistory ? { animation: 'pu-spin 1s linear infinite' } : {}} /> Refresh
                </button>
              </div>
            </div>

            {loadingHistory ? (
              <div style={{ padding: '56px 0', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <RefreshCw size={20} color="#6366f1" style={{ animation: 'pu-spin 1s linear infinite' }} />
                <span style={{ fontSize: 13 }}>Loading historyâ€¦</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ padding: '56px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Info size={26} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.35 }} />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>No records found</div>
                <p style={{ fontSize: 12 }}>Try a different search term or filter.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                      {[['Date', 'left'], ['Product', 'left'], ['Old Cost', 'right'], ['New Cost', 'right'], ['Change', 'right'], ['Updated by', 'left'], ['Notes', 'left']].map(([h, align]) => (
                        <th key={h} style={{ padding: '9px 13px', textAlign: align, fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((row) => {
                      const diff = parseFloat(row.price_difference);
                      return (
                        <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '11px 13px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(row.effective_date || row.created_at?.split(' ')[0])}</td>
                          <td style={{ padding: '11px 13px' }}><span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{row.product_name}</span></td>
                          <td style={{ padding: '11px 13px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{money(row.previous_price)}</td>
                          <td style={{ padding: '11px 13px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#fff' }}>{money(row.new_price)}</td>
                          <td style={{ padding: '11px 13px', textAlign: 'right' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 5, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, background: diff > 0 ? 'rgba(239,68,68,0.1)' : diff < 0 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: diff > 0 ? '#f87171' : diff < 0 ? '#34d399' : '#94a3b8', border: `1px solid ${diff > 0 ? 'rgba(239,68,68,0.2)' : diff < 0 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                              {diff > 0 ? <TrendingUp size={10} /> : diff < 0 ? <TrendingDown size={10} /> : null}
                              {diff > 0 ? '+' : ''}{money(diff)}
                            </span>
                          </td>
                          <td style={{ padding: '11px 13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <User size={10} color="#818cf8" />
                              </div>
                              <span style={{ fontSize: 12, color: '#cbd5e1' }}>{row.updated_by_name || 'â€”'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '11px 13px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.remarks || ''}>{row.remarks || <span style={{ opacity: 0.4 }}>â€”</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes pu-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const MiniStat = ({ label, value, icon, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 90 }}>
    <div style={{ width: 26, height: 26, borderRadius: 6, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const PriceBox = ({ label, value, muted, accent }) => (
  <div style={{ flex: 1, textAlign: 'center', padding: '9px 10px', borderRadius: 8, background: accent ? 'rgba(99,102,241,0.09)' : 'rgba(255,255,255,0.03)', border: `1px solid ${accent ? 'rgba(99,102,241,0.28)' : 'rgba(255,255,255,0.07)'}` }}>
    <div style={{ fontSize: 10, color: accent ? '#a5b4fc' : 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 15, fontFamily: 'monospace', fontWeight: 800, color: accent ? '#c7d2fe' : 'var(--text-muted)' }}>{value}</div>
  </div>
);

const ImpactPill = ({ percent, isIncrease }) => {
  const level = percent < 5 ? 'Minor' : percent < 15 ? 'Moderate' : 'Significant';
  const color = isIncrease
    ? (percent < 5 ? '#fb923c' : percent < 15 ? '#f87171' : '#ef4444')
    : (percent < 5 ? '#4ade80' : percent < 15 ? '#34d399' : '#10b981');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
        Impact: <strong style={{ color }}>{level}</strong> ({percent.toFixed(1)}% {isIncrease ? 'increase' : 'reduction'})
      </span>
    </div>
  );
};

const QuickBtn = ({ label, color, onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: `${color}12`, border: `1px solid ${color}3a`, color, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1, transition: 'all 0.13s', fontFamily: 'inherit' }}
    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = `${color}26`; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = `${color}12`; }}>
    {label}
  </button>
);

export default PriceUpdate;
