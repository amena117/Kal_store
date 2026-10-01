import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Calendar,
  Package,
  ArrowRight
} from 'lucide-react';

const POS = () => {
  const { activeBranchId, branchParam } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filtering states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saleData, setSaleData] = useState({
    qty: 1,
    price: 0
  });

  const getLocalDatetime = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  };
  const [transactionDate, setTransactionDate] = useState(getLocalDatetime());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products' + branchParam),
        api.get('/categories')
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBranchId]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category_name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const openSaleModal = (product) => {
    if (product.quantity <= 0) {
      alert('Product is out of stock!');
      return;
    }
    setSelectedProduct(product);
    setSaleData({ qty: 1, price: product.selling_price });
    setShowSaleModal(true);
  };

  const confirmSale = () => {
    const existingIndex = cart.findIndex(
      item => item.id === selectedProduct.id && item.selling_price === saleData.price
    );

    const currentTotalQtyInCart = cart
      .filter(item => item.id === selectedProduct.id)
      .reduce((sum, item) => sum + item.qty, 0);

    const totalRequestedQty = currentTotalQtyInCart + saleData.qty;

    if (totalRequestedQty > selectedProduct.quantity) {
      alert('Not enough stock available!');
      return;
    }

    if (existingIndex > -1) {
      setCart(cart.map((item, idx) =>
        idx === existingIndex
          ? { ...item, qty: item.qty + saleData.qty }
          : item
      ));
    } else {
      const cartItemId = `${selectedProduct.id}-${saleData.price}-${Date.now()}`;
      setCart([
        ...cart,
        {
          ...selectedProduct,
          cartItemId,
          qty: saleData.qty,
          selling_price: saleData.price
        }
      ]);
    }

    setShowSaleModal(false);
  };

  const updateQty = (cartItemId, amount) => {
    setCart(cart.map(item => {
      const currentKey = item.cartItemId || item.id;
      if (currentKey === cartItemId) {
        const otherLinesQty = cart
          .filter(i => i.id === item.id && (i.cartItemId || i.id) !== cartItemId)
          .reduce((sum, i) => sum + i.qty, 0);

        const newQty = item.qty + amount;
        if (newQty > 0 && (otherLinesQty + newQty) <= item.quantity) {
          return { ...item, qty: newQty };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => (item.cartItemId || item.id) !== cartItemId));
  };

  const total = cart.reduce((sum, item) => sum + (item.selling_price * item.qty), 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const processSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      for (const item of cart) {
        await api.post('/sales', {
          product_id: item.id,
          quantity: item.qty,
          selling_price: item.selling_price,
          total: item.selling_price * item.qty,
          actual_sale_date: transactionDate
        });
      }

      setSuccessToast(`Order completed successfully! ($${total.toFixed(2)})`);
      setTimeout(() => setSuccessToast(null), 4000);
      setCart([]);

      // Refresh products
      const res = await api.get('/products' + branchParam);
      setProducts(res.data || []);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to process sale');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in-up flex flex-col xl:flex-row gap-6 h-full pb-4">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in flex items-center gap-3 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <span className="font-semibold text-sm">{successToast}</span>
        </div>
      )}

      {/* Catalog & Filters Section */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} /> Point of Sale
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Sales Terminal
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="view-toggle-bar">
              <button 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={15} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <List size={15} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            <button 
              onClick={fetchData} 
              className="btn btn-secondary text-xs py-2 px-3"
              title="Refresh Products"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Search & Category Pills */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              type="text"
              placeholder="Search product name or barcode..."
              className="form-control pl-10 pr-4 py-2.5 bg-black/30 border-white/10 text-white rounded-xl text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white p-1"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="relative shrink-0 md:w-56">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <select
              className="form-control pl-10 pr-4 py-2.5 bg-black/30 border-white/10 text-white rounded-xl text-sm w-full"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Display Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[350px]">
          {loading ? (
            <div className="empty-state-card">
              <div className="spinner mx-auto mb-3"></div>
              <p className="text-muted text-sm">Loading product catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state-card glass-panel rounded-2xl">
              <div className="empty-state-icon">
                <Package size={28} />
              </div>
              <h3 className="text-lg font-bold text-white">No products found</h3>
              <p className="text-muted text-sm max-w-sm">
                No items match your search or category filter. Try clearing your search term.
              </p>
              {search && (
                <button onClick={() => setSearch('')} className="btn btn-secondary text-xs mt-2">
                  Clear Search
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Visual Card Grid */
            <div className="pos-product-grid pb-4">
              {filteredProducts.map(p => {
                const isOut = p.quantity <= 0;
                const isLow = p.quantity <= 5 && !isOut;
                return (
                  <div 
                    key={p.id}
                    className={`pos-product-card group ${isOut ? 'out-of-stock' : ''}`}
                    onClick={() => !isOut && openSaleModal(p)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-white/5 border border-white/5 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                        {p.category_name || 'General'}
                      </span>
                      <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'} text-[10px] font-bold py-0.5 px-2 shrink-0`}>
                        {isOut ? 'Out of Stock' : `${p.quantity} In Stock`}
                      </span>
                    </div>

                    <div className="my-2">
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {p.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                      <div>
                        <span className="text-[10px] text-muted block uppercase font-bold">Price</span>
                        <span className="pos-price-pill">${parseFloat(p.selling_price).toFixed(2)}</span>
                      </div>
                      <button 
                        className="btn btn-sm btn-primary rounded-xl px-3 py-1.5 shadow-md group-hover:scale-105 transition-transform"
                        disabled={isOut}
                        onClick={(e) => { e.stopPropagation(); openSaleModal(p); }}
                      >
                        <Plus size={15} /> Select
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compact Table View */
            <div className="table-wrapper pb-4">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const isOut = p.quantity <= 0;
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="font-bold text-white">{p.name}</td>
                        <td className="text-muted text-sm">{p.category_name}</td>
                        <td className="font-mono font-bold text-emerald-400">${parseFloat(p.selling_price).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${isOut ? 'badge-danger' : p.quantity < 5 ? 'badge-warning' : 'badge-success'}`}>
                            {isOut ? 'Out of Stock' : `${p.quantity} Left`}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            className="btn btn-sm btn-primary py-1 px-3 rounded-lg"
                            disabled={isOut}
                            onClick={() => openSaleModal(p)}
                          >
                            <Plus size={14} /> Select
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modern Order Receipt Sidebar */}
      <div className="w-full xl:w-[380px] shrink-0 glass-panel flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b1122]/90 backdrop-blur-2xl">
        {/* Receipt Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <ShoppingCart size={17} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white leading-tight">Order Receipt</h2>
              <span className="text-[11px] text-muted">{totalItemsCount} units total</span>
            </div>
          </div>

          {cart.length > 0 && (
            <button 
              onClick={() => setCart([])}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Order Line Items */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar min-h-[220px] max-h-[400px] xl:max-h-none">
          {cart.length === 0 ? (
            <div className="empty-state-card my-auto">
              <ShoppingCart size={36} className="text-muted/30 mb-1" />
              <p className="text-white text-sm font-semibold">Order is Empty</p>
              <p className="text-muted text-xs max-w-[200px]">
                Click "Select" on products to add them to this order.
              </p>
            </div>
          ) : (
            cart.map(item => {
              const lineKey = item.cartItemId || item.id;
              const lineTotal = item.selling_price * item.qty;
              return (
                <div 
                  key={lineKey} 
                  className="p-3 bg-white/[0.025] hover:bg-white/[0.045] border border-white/5 rounded-xl transition-all"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted font-mono mt-0.5">
                        ${parseFloat(item.selling_price).toFixed(2)} / unit
                      </div>
                    </div>
                    <div className="text-emerald-400 font-mono font-bold text-sm shrink-0">
                      ${lineTotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
                    {/* Stepper */}
                    <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-0.5">
                      <button 
                        className="w-6 h-6 flex items-center justify-center text-muted hover:text-white rounded hover:bg-white/10 transition-colors"
                        onClick={() => updateQty(lineKey, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white font-mono">
                        {item.qty}
                      </span>
                      <button 
                        className="w-6 h-6 flex items-center justify-center text-muted hover:text-white rounded hover:bg-white/10 transition-colors"
                        onClick={() => updateQty(lineKey, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button 
                      className="p-1.5 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" 
                      onClick={() => removeFromCart(lineKey)}
                      title="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Receipt Footer & Payment */}
        <div className="p-4 border-t border-white/10 bg-black/30 space-y-3 shrink-0">
          {/* Transaction Date */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Calendar size={12} className="text-indigo-400" />
              <span>Sale Record Date</span>
            </label>
            <input
              type="datetime-local"
              className="form-control w-full bg-black/40 border-white/10 text-white text-xs py-2 px-3 rounded-lg"
              value={transactionDate}
              onChange={e => setTransactionDate(e.target.value)}
            />
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1.5 pt-2 border-t border-white/5 text-sm">
            <div className="flex justify-between text-muted text-xs">
              <span>Items Total ({totalItemsCount})</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted text-xs">
              <span>Tax / Fees</span>
              <span className="font-mono">$0.00</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
              <span className="text-sm font-extrabold text-white uppercase tracking-wider">Grand Total</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-400">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Button */}
          <button
            className="btn btn-primary w-full py-3 text-base font-extrabold rounded-xl shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2"
            onClick={processSale}
            disabled={cart.length === 0 || processing}
          >
            {processing ? (
              <div className="spinner"></div>
            ) : (
              <>
                <span>Complete Checkout</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sale Customization Modal */}
      {showSaleModal && selectedProduct && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-fade-in-up" style={{
            maxWidth: '480px',
            background: 'linear-gradient(150deg, #0f172a 0%, #172033 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8)',
            padding: 0,
            overflow: 'hidden',
            borderRadius: '24px'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Configure Sale Item</h2>
                  <p className="text-xs text-muted">Adjust quantity and unit pricing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaleModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500/20 text-muted hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-xs text-muted uppercase font-bold tracking-wider">Product Name</div>
                <div className="text-base font-bold text-white mt-0.5">{selectedProduct.name}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-muted">
                    {selectedProduct.category_name}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    Available Stock: {selectedProduct.quantity}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted mb-1.5 block">
                    Quantity (Max: {selectedProduct.quantity})
                  </label>
                  <input
                    type="number"
                    className="form-control bg-black/40 border-white/10 text-white font-bold text-lg text-center rounded-xl"
                    value={saleData.qty}
                    onChange={e => setSaleData({ ...saleData, qty: Math.max(1, parseInt(e.target.value) || 1) })}
                    min="1"
                    max={selectedProduct.quantity}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted mb-1.5 block">
                    Selling Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control bg-black/40 border-white/10 text-white font-bold text-lg text-center rounded-xl"
                    value={saleData.price}
                    onChange={e => setSaleData({ ...saleData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Subtotal Banner */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Line Item Subtotal</span>
                <span className="text-2xl font-extrabold font-mono text-emerald-400">
                  ${(saleData.qty * saleData.price).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button 
                type="button"
                className="btn btn-secondary text-sm px-4" 
                onClick={() => setShowSaleModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn btn-primary text-sm px-5 shadow-lg shadow-indigo-500/30" 
                onClick={confirmSale}
              >
                <Plus size={16} /> Add to Order
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default POS;