import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, Plus, Minus, Trash2, Search, Filter, X } from 'lucide-react';

const POS = () => {
  const { activeBranchId, branchParam } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
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
    if (saleData.qty > selectedProduct.quantity) {
      alert('Not enough stock!');
      return;
    }

    const existing = cart.find(item => item.id === selectedProduct.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === selectedProduct.id
          ? { ...item, qty: saleData.qty, selling_price: saleData.price }
          : item
      ));
    } else {
      setCart([...cart, { ...selectedProduct, qty: saleData.qty, selling_price: saleData.price }]);
    }
    setShowSaleModal(false);
  };

  const updateQty = (id, amount) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + amount;
        if (newQty > 0 && newQty <= item.quantity) {
          return { ...item, qty: newQty };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.selling_price * item.qty), 0);

  const processSale = async () => {
    if (cart.length === 0) return;
    try {
      // In a real app, you might send an array of items. 
      // Assuming the backend handles one or multiple. For now, we simulate multiple requests if needed, 
      // or a single bulk request. We'll iterate for simplicity if bulk is not supported.

      for (const item of cart) {
        await api.post('/sales', {
          product_id: item.id,
          quantity: item.qty,
          selling_price: item.selling_price,
          total: item.selling_price * item.qty,
          actual_sale_date: transactionDate
        });
      }

      alert('Sale processed successfully!');
      setCart([]);

      // Refresh products
      const res = await api.get('/products' + branchParam);
      setProducts(res.data || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process sale');
    }
  };

  return (
    <div className="animate-fade-in-up flex flex-col md:flex-row gap-6 h-full">
      {/* Products Selection Section */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Sales Terminal</h1>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-muted" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                className="form-control pl-10 w-64"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 text-muted" size={18} />
              <select
                className="form-control pl-10 w-48"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="text-center p-12">Loading catalog...</div>
          ) : (
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-8">No products found matching filters.</td></tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-glass-bg transition-colors">
                      <td className="font-bold">{p.name}</td>
                      <td>{p.category_name}</td>
                      <td>${parseFloat(p.selling_price).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${p.quantity < 5 ? 'badge-warning' : 'badge-success'}`}>
                          {p.quantity} In Stock
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openSaleModal(p)}
                        >
                          <Plus size={16} /> Select
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full md:w-96 glass-panel flex flex-col h-auto md:h-[calc(100vh-8rem)]">
        <div className="p-4 border-b border-glass-border flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart /> Current Order</h2>
          <span className="badge badge-warning">{cart.length} Items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {cart.length === 0 && (
            <div className="text-center text-muted my-auto py-8">Cart is empty. Select products to add.</div>
          )}
          {cart.map(item => (
            <div key={item.id} className="flex flex-col gap-2 p-3 bg-surface border border-glass-border rounded-lg">
              <div className="flex justify-between font-semibold">
                <span>{item.name}</span>
                <span className="text-secondary">${(item.selling_price * item.qty).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center bg-black bg-opacity-20 rounded-md border border-glass-border">
                  <button className="p-1 hover:bg-glass-bg text-main" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                  <span className="px-3 text-sm font-semibold">{item.qty}</span>
                  <button className="p-1 hover:bg-glass-bg text-main" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                </div>
                <button className="text-danger hover:text-danger-hover" onClick={() => removeFromCart(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-glass-border bg-black bg-opacity-30">
          <div className="mb-4">
            <label className="form-label text-sm font-bold text-muted mb-1 block">Actual Sale Date</label>
            <input
              type="datetime-local"
              className="form-control w-full bg-surface"
              value={transactionDate}
              onChange={e => setTransactionDate(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold text-muted">Total</span>
            <span className="text-3xl font-bold text-gradient">${total.toFixed(2)}</span>
          </div>
          <button
            className="btn btn-primary w-full py-3 text-lg"
            onClick={processSale}
            disabled={cart.length === 0}
          >
            Process Payment
          </button>
        </div>
      </div>

      {/* Sale Customization Modal */}
      {showSaleModal && selectedProduct && createPortal(
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
                  <ShoppingCart size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-white tracking-tight truncate">Process Sale</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaleModal(false)}
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
              <div className="form-group mb-5">
                <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Product</label>
                <input type="text" className="form-control bg-dark/40 border-white/10 text-white/50" value={selectedProduct.name} disabled style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }} />
              </div>
              <div className="form-group mb-5">
                <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Category</label>
                <input type="text" className="form-control bg-dark/40 border-white/10 text-white/50" value={selectedProduct.category_name} disabled style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }} />
              </div>
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div className="form-group">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Sale Quantity (Max: {selectedProduct.quantity})</label>
                  <input
                    type="number"
                    className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors font-bold"
                    value={saleData.qty}
                    onChange={e => setSaleData({ ...saleData, qty: parseInt(e.target.value) || 0 })}
                    min="1"
                    max={selectedProduct.quantity}
                    style={{ padding: '0.75rem 1rem', fontSize: '1rem' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-xs font-bold uppercase tracking-wide text-muted mb-2 block">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control bg-dark/40 border-white/10 focus:border-main/50 focus:bg-dark/60 transition-colors font-bold"
                    value={saleData.price}
                    onChange={e => setSaleData({ ...saleData, price: parseFloat(e.target.value) || 0 })}
                    style={{ padding: '0.75rem 1rem', fontSize: '1rem' }}
                  />
                </div>
              </div>
              <div className="p-5 bg-black bg-opacity-20 rounded-xl mt-5 border border-white/5 shadow-inner">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-muted uppercase tracking-wider text-xs">Subtotal:</span>
                  <span className="text-secondary font-extrabold font-mono text-3xl">
                    ${(saleData.qty * saleData.price).toFixed(2)}
                  </span>
                </div>
              </div>
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
              <button className="btn btn-glass" onClick={() => setShowSaleModal(false)} style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmSale} style={{
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
                <ShoppingCart size={18} /> Add to Order
              </button>
            </div>
          </div>
        </div>
        , document.body)}
    </div>
  );
};

export default POS;
