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
  Tag,
  ArrowRight,
  HelpCircle,
  Zap,
  Lock,
  Building
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
  const [supplierName, setSupplierName] = useState('Global Vendor Inc.');
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

  const applyRoundUp = () => {
    if (!newPurchasePrice || isNaN(newPurchasePrice)) return;
    const val = parseFloat(newPurchasePrice);
    const rounded = Math.ceil(val);
    setNewPurchasePrice(rounded.toFixed(2));
  };

  const handleReasonPreset = (presetText) => {
    if (remarks.includes(presetText)) return;
    setRemarks((prev) => (prev ? `${prev}, ${presetText}` : presetText));
  };

  const handleCancel = () => {
    setSelectedProductId('');
    setProductSearch('');
    setCurrentPurchasePrice('');
    setNewPurchasePrice('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setSupplierName('Global Vendor Inc.');
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
      const fullRemarks = supplierName.trim()
        ? `[Supplier: ${supplierName.trim()}] ${remarks.trim()}`
        : remarks.trim();

      const payload = {
        product_id: parseInt(selectedProductId),
        new_price: parseFloat(newPurchasePrice),
        effective_date: effectiveDate,
        remarks: fullRemarks
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
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
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
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
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

      {/* Statistics Overview (4 Horizontal Responsive Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[20px]">
        {/* Card 1: Total Revisions */}
        <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#94A3B8]">Total Revisions</span>
            <div className="p-2.5 rounded-xl bg-[#334155]/60 text-[#F8FAFC]">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[32px] font-bold text-[#F8FAFC] leading-none">{historyStats.total}</div>
            <div className="text-[14px] text-[#94A3B8] mt-2">Logged purchase updates</div>
          </div>
        </div>

        {/* Card 2: Cost Increases (Accent: Green) */}
        <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#22C55E]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#94A3B8]">Cost Increases</span>
            <div className="p-2.5 rounded-xl bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/20">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[32px] font-bold text-[#22C55E] leading-none">{historyStats.increasesCount}</div>
            <div className="text-[14px] text-[#94A3B8] mt-2">Supplier price hikes</div>
          </div>
        </div>

        {/* Card 3: Cost Decreases (Accent: Red) */}
        <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#EF4444]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#94A3B8]">Cost Decreases</span>
            <div className="p-2.5 rounded-xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/20">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[32px] font-bold text-[#EF4444] leading-none">{historyStats.decreasesCount}</div>
            <div className="text-[14px] text-[#94A3B8] mt-2">Supplier discounts / cuts</div>
          </div>
        </div>

        {/* Card 4: Latest Update (Accent: Blue) */}
        <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#3B82F6]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#94A3B8]">Latest Update</span>
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/20">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[30px] font-bold text-[#3B82F6] leading-tight truncate">{historyStats.latestItem}</div>
            <div className="text-[14px] text-[#94A3B8] mt-2 truncate">Most recent item changed</div>
          </div>
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
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Package className="text-indigo-400" size={22} />
                    Select Item & Set New Purchase Cost
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Choose an inventory product and input updated purchase rate</p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Form Workspace
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7">
                
                {/* 1. Improved Product Search & Select Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Search size={14} className="text-indigo-400" />
                      Search & Select Inventory Item <span className="text-indigo-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Type item name to autocomplete</span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 pointer-events-none">
                      <Package size={16} />
                    </div>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder="Search inventory product by name..."
                      className="w-full bg-slate-950/90 border border-white/15 rounded-2xl py-4 pl-12 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
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
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Enhanced Dropdown Menu */}
                  {showProductDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-2 max-h-72 overflow-y-auto bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl divide-y divide-white/5 custom-scrollbar">
                      {loadingProducts ? (
                        <div className="p-5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw size={16} className="animate-spin text-indigo-400" />
                          <span>Searching products...</span>
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="p-5 text-center text-xs text-slate-400">
                          No matching inventory items found
                        </div>
                      ) : (
                        filteredProducts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => selectProduct(p)}
                            className="p-4 hover:bg-indigo-600/20 cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm group-hover:scale-105 transition-transform">
                                {p.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                                  {p.name}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.quantity > 10 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {p.quantity} in stock
                                  </span>
                                  <span>•</span>
                                  <span>Selling: ${parseFloat(p.selling_price || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-slate-400 uppercase font-bold">Current Purchase</div>
                              <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 inline-block mt-0.5">
                                ${parseFloat(p.arrival_price || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Item Detail Preview Card */}
                {selectedProduct && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <Package size={22} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {selectedProduct.name}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            ID: #{selectedProduct.id}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                          <span>Stock: <strong>{selectedProduct.quantity} units</strong></span>
                          <span>•</span>
                          <span>Selling Rate: <strong>${parseFloat(selectedProduct.selling_price).toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Current Cost</div>
                        <div className="text-lg font-black text-emerald-400 font-mono">
                          ${parseFloat(selectedProduct.arrival_price).toFixed(2)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                        title="Deselect Item"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Improved Dual Price Input Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Price (Read Only) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock size={12} className="text-slate-500" /> Current Purchase Rate
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold bg-white/5 px-2 py-0.5 rounded">Locked</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500">$</div>
                      <input
                        type="text"
                        readOnly
                        value={currentPurchasePrice ? currentPurchasePrice : '0.00'}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-4 pl-9 pr-4 text-sm font-mono font-bold text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* New Price Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <DollarSign size={14} className="text-indigo-400" /> New Purchase Rate <span className="text-indigo-400">*</span>
                      </span>
                      {calculateMetrics.isValid && (
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          calculateMetrics.diff > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {calculateMetrics.diff > 0 ? '+' : ''}${calculateMetrics.diff.toFixed(2)}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-extrabold text-indigo-400">$</div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newPurchasePrice}
                        onChange={(e) => setNewPurchasePrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-950/90 border border-indigo-500/40 rounded-2xl py-4 pl-9 pr-4 text-base font-mono font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Improved Quick Price Adjust Modifiers */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-950/40 border border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Percent size={14} className="text-indigo-400" /> Quick Price Modifiers
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Click to calculate rate instantly</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[-10, -5, +5, +10, +15, +20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applyQuickPreset(pct)}
                        disabled={!currentPurchasePrice}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                          pct > 0
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        {pct > 0 ? `+${pct}%` : `${pct}%`}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={applyRoundUp}
                      disabled={!newPurchasePrice || isNaN(newPurchasePrice)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Round Up ($)
                    </button>
                  </div>
                </div>

                {/* 4. Improved Effective Date & Supplier Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Effective Date */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-400" /> Effective Date <span className="text-indigo-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/15 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Supplier Vendor Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Building size={14} className="text-indigo-400" /> Supplier / Vendor Name
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="e.g. Global Vendor Inc., Main Warehouse"
                      className="w-full bg-slate-950/80 border border-white/15 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all"
                    />
                  </div>
                </div>

                {/* 5. Improved Supplier Notes / Reason Textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-indigo-400" /> Reason / Adjustment Remarks
                    </label>
                    <div className="flex items-center gap-1">
                      {['Vendor Rate Hike', 'Bulk Discount', 'Freight Cost Shift'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleReasonPreset(tag)}
                          className="text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2 py-0.5 rounded border border-white/10 transition cursor-pointer"
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows="3"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter reason for purchase price adjustment (e.g. Supplier contract renewal, commodity price increase...)"
                    className="w-full bg-slate-950/80 border border-white/15 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all resize-none placeholder:text-slate-600"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3.5 rounded-2xl border border-white/10 bg-slate-800/40 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <X size={16} />
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedProductId || !newPurchasePrice}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {submitting ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Save Price Revision
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
                  Live Cost Impact Preview
                </h3>
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  Real-Time Calculation
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
                  <div className="text-sm font-semibold text-slate-400">Select item & enter new rate</div>
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
