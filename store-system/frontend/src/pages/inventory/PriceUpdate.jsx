import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
  Package,
  Calendar,
  FileText,
  User,
  History,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Percent,
  Layers,
  ShieldCheck,
  Tag
} from 'lucide-react';

const PriceUpdate = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  const [currentPurchasePrice, setCurrentPurchasePrice] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  // UI State
  const [activeTab, setActiveTab] = useState('update'); // 'update' or 'history'
  const [historySearch, setHistorySearch] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchHistory();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/price-updates');
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load price update history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p.id) === String(selectedProductId)) || null;
  }, [products, selectedProductId]);

  const selectProduct = (prod) => {
    setSelectedProductId(String(prod.id));
    setProductSearch(prod.name);
    setCurrentPurchasePrice(prod.arrival_price !== undefined ? parseFloat(prod.arrival_price).toFixed(2) : '0.00');
    setNewPurchasePrice('');
    setShowProductDropdown(false);
  };

  const calculateMetrics = useMemo(() => {
    if (!currentPurchasePrice || !newPurchasePrice || isNaN(newPurchasePrice)) {
      return { diff: 0, percent: 0, isValid: false };
    }
    const curr = parseFloat(currentPurchasePrice);
    const next = parseFloat(newPurchasePrice);
    const diff = next - curr;
    const percent = curr > 0 ? (diff / curr) * 100 : 0;
    return { diff, percent, isValid: true };
  }, [currentPurchasePrice, newPurchasePrice]);

  const applyQuickPreset = (percentage) => {
    if (!currentPurchasePrice || isNaN(currentPurchasePrice)) return;
    const curr = parseFloat(currentPurchasePrice);
    const next = curr * (1 + percentage / 100);
    setNewPurchasePrice(next.toFixed(2));
  };

  const handleCancel = () => {
    setSelectedProductId('');
    setProductSearch('');
    setCurrentPurchasePrice('');
    setNewPurchasePrice('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setStatusMessage(null);
    setShowProductDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      setStatusMessage({ type: 'error', text: 'Please select an item to update.' });
      return;
    }
    if (newPurchasePrice === '' || isNaN(newPurchasePrice) || parseFloat(newPurchasePrice) < 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid new purchase price.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        product_id: parseInt(selectedProductId),
        new_price: parseFloat(newPurchasePrice),
        effective_date: effectiveDate,
        remarks: remarks.trim()
      };

      const res = await api.post('/price-updates', payload);

      if (res.data && res.data.success) {
        setStatusMessage({ type: 'success', text: `Purchase price updated successfully for ${selectedProduct?.name || 'item'}!` });
        handleCancel();
        fetchProducts();
        fetchHistory();
      } else {
        setStatusMessage({ type: 'error', text: res.data.message || 'Failed to update purchase price.' });
      }
    } catch (err) {
      console.error('Error updating price', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'An error occurred while saving the price update.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase();
    return history.filter((item) => {
      const prodName = (item.product_name || '').toLowerCase();
      const updatedBy = (item.updated_by_name || '').toLowerCase();
      const rem = (item.remarks || '').toLowerCase();
      return prodName.includes(q) || updatedBy.includes(q) || rem.includes(q);
    });
  }, [history, historySearch]);

  // Analytics Stats
  const historyStats = useMemo(() => {
    const total = history.length;
    const increases = history.filter((h) => parseFloat(h.price_difference) > 0);
    const decreases = history.filter((h) => parseFloat(h.price_difference) < 0);
    return {
      total,
      increasesCount: increases.length,
      decreasesCount: decreases.length,
      latestItem: history[0]?.product_name || 'None'
    };
  }, [history]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900/80 to-purple-900/60 p-8 border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={14} /> Inventory Cost Management
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Supplier Price Update
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Adjust purchase prices effortlessly when suppliers increase or lower rates. Historical sales & profit analytics remain 100% locked and protected.
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/10 shadow-inner shrink-0">
            <button
              onClick={() => setActiveTab('update')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'update'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign size={16} />
              Update Price
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <History size={16} />
              View Price History ({historyStats.total})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/40 transition duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revisions</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3 font-mono">{historyStats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Logged purchase updates</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group hover:border-rose-500/40 transition duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost Increases</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 mt-3 font-mono">{historyStats.increasesCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Supplier price hikes</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost Decreases</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-3 font-mono">{historyStats.decreasesCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Supplier discounts / cuts</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latest Update</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Tag size={18} />
            </div>
          </div>
          <div className="text-base font-bold text-white mt-3 truncate">{historyStats.latestItem}</div>
          <div className="text-[11px] text-slate-400 mt-1">Most recent item changed</div>
        </div>
      </div>

      {/* Global Status Feedback Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border backdrop-blur-xl shadow-lg transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={22} className="text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-semibold">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'update' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-8 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl space-y-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Package className="text-indigo-400" size={22} />
                    Select Item & Set New Cost
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Choose an inventory product and input updated purchase rate</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Form Workspace
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Searchable Product Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Search & Select Product <span className="text-indigo-400">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder="Type to filter inventory items by name..."
                      className="w-full bg-slate-950/80 border border-white/15 rounded-2xl py-3.5 pl-11 pr-10 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearch('');
                          setSelectedProductId('');
                          setCurrentPurchasePrice('');
                          setNewPurchasePrice('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Menu */}
                  {showProductDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-2 max-h-64 overflow-y-auto bg-slate-900 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl divide-y divide-white/5">
                      {loadingProducts ? (
                        <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw size={14} className="animate-spin text-indigo-400" />
                          Fetching products...
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No matching items found
                        </div>
                      ) : (
                        filteredProducts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => selectProduct(p)}
                            className="p-3.5 hover:bg-indigo-600/20 cursor-pointer transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <div className="text-sm font-semibold text-white group-hover:text-indigo-300">
                                {p.name}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Stock: {p.quantity} units</span>
                                <span>•</span>
                                <span>Selling: ${parseFloat(p.selling_price || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                ${parseFloat(p.arrival_price || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Item Detail Badge */}
                {selectedProduct && (
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{selectedProduct.name}</div>
                        <div className="text-xs text-indigo-300/80 mt-0.5">
                          Current Stock: {selectedProduct.quantity} units | Selling Price: ${parseFloat(selectedProduct.selling_price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Current Cost</div>
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        ${parseFloat(selectedProduct.arrival_price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dual Price Input Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Price Readonly */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Current Purchase Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                      <input
                        type="text"
                        readOnly
                        value={currentPurchasePrice ? `$${currentPurchasePrice}` : '$0.00'}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-3.5 pl-9 pr-4 text-sm font-mono font-bold text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* New Price Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      New Purchase Price <span className="text-indigo-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 font-mono font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newPurchasePrice}
                        onChange={(e) => setNewPurchasePrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-950/90 border border-indigo-500/40 rounded-2xl py-3.5 pl-9 pr-4 text-sm font-mono font-extrabold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Presets Buttons */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Percent size={12} className="text-indigo-400" /> Quick Price Adjust Modifiers
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[-10, -5, +5, +10, +15, +20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applyQuickPreset(pct)}
                        disabled={!currentPurchasePrice}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          pct > 0
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        {pct > 0 ? `+${pct}%` : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Effective Date & User Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-400" /> Effective Date <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/15 rounded-2xl p-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User size={14} className="text-indigo-400" /> Updated By (Automatic)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={user?.name || 'Authorized User'}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-2xl p-3.5 text-sm font-semibold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-400" /> Supplier Notes / Reason (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter reason for price adjustment (e.g., Raw material cost shift, vendor contract renewal...)"
                    className="w-full bg-slate-950/80 border border-white/15 rounded-2xl p-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-slate-600"
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 rounded-2xl border border-white/10 bg-slate-800/40 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedProductId || !newPurchasePrice}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save Price Update
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Live Comparison Widget & Protection Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Price Comparison Card */}
            <div className="glass-card p-8 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={18} />
                  Live Cost Preview
                </h3>
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  Calculated Real-Time
                </span>
              </div>

              {calculateMetrics.isValid ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-center">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Old Purchase Price</div>
                      <div className="text-xl font-black text-slate-300 font-mono mt-1">
                        ${parseFloat(currentPurchasePrice).toFixed(2)}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center">
                      <div className="text-[11px] font-bold text-indigo-300 uppercase">New Purchase Price</div>
                      <div className="text-xl font-black text-indigo-400 font-mono mt-1">
                        ${parseFloat(newPurchasePrice).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Impact Highlight Box */}
                  <div
                    className={`p-5 rounded-2xl border backdrop-blur-xl flex items-center justify-between ${
                      calculateMetrics.diff > 0
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : calculateMetrics.diff < 0
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800/40 border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs uppercase font-bold tracking-wider">Unit Cost Impact</div>
                      <div className="text-2xl font-black font-mono">
                        {calculateMetrics.diff > 0 ? '+' : ''}${calculateMetrics.diff.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          calculateMetrics.diff > 0
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : calculateMetrics.diff < 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        {calculateMetrics.diff > 0 ? (
                          <TrendingUp size={14} />
                        ) : calculateMetrics.diff < 0 ? (
                          <TrendingDown size={14} />
                        ) : null}
                        {calculateMetrics.percent > 0 ? '+' : ''}{calculateMetrics.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-white/15 rounded-2xl space-y-2">
                  <DollarSign size={28} className="mx-auto text-slate-600" />
                  <div className="text-sm font-semibold text-slate-400">Select item & enter new price</div>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Real-time cost variation and percentage adjustments will be previewed here.
                  </p>
                </div>
              )}

              {/* Security & Profit Locking Guarantee Badge */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={16} /> Historical Profit Protection
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Saving this price update modifies future inventory costs. All past sales and historical profit reports remain <strong>strictly preserved and unaffected</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Price Update History Table Content */
        <div className="glass-card p-8 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <History className="text-indigo-400" size={20} />
                Price Update History
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Audit log of all purchase price revisions</p>
            </div>

            {/* Search Filter */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search item, user, or remarks..."
                className="w-full bg-[#0f172a] border border-white/15 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw size={24} className="animate-spin text-indigo-400" />
              <span>Loading price history records...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No price update history found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400 bg-slate-950/50">
                    <th className="p-3">Date</th>
                    <th className="p-3">Item</th>
                    <th className="p-3 text-right">Previous Price</th>
                    <th className="p-3 text-right">New Price</th>
                    <th className="p-3 text-right">Difference</th>
                    <th className="p-3">Updated By</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm">
                  {filteredHistory.map((row) => {
                    const diff = parseFloat(row.price_difference);
                    return (
                      <tr key={row.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 text-xs text-slate-400 whitespace-nowrap">
                          {row.effective_date || row.created_at?.split(' ')[0]}
                        </td>
                        <td className="p-3 font-semibold text-white">{row.product_name}</td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          ${parseFloat(row.previous_price).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          ${parseFloat(row.new_price).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs ${
                              diff > 0
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : diff < 0
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400'
                            }`}
                          >
                            {diff > 0 ? '+' : ''}${diff.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-white/90">{row.updated_by_name}</td>
                        <td className="p-3 text-xs text-slate-400 max-w-xs truncate">
                          {row.remarks || '—'}
                        </td>
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
  );
};

export default PriceUpdate;
