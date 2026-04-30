import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Save, Trash2, Plus, ArrowLeft } from 'lucide-react';

const EditRental = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [memory, setMemory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [formData, setFormData] = useState({
    total_payment: '',
    advance_payment: '',
    take_away_date: '',
    return_date: '',
    received_by: '',
    customer_name: '',
    phone_number: ''
  });

  const [items, setItems] = useState([
    { product_name: '', category: '', quantity: 1 }
  ]);

  useEffect(() => {
    // If not Admin or Manager, kick them out
    if (user?.role !== 'Admin' && user?.role !== 'Manager') {
      navigate('/rentals');
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, memoryRes, rentalRes] = await Promise.all([
          api.get('/users').catch(() => ({ data: [] })),
          api.get('/rentals/memory').catch(() => ({ data: [] })),
          api.get(`/rentals/${id}`)
        ]);
        
        setUsers(usersRes.data || []);
        setMemory(memoryRes.data || []);
        
        const rData = rentalRes.data;
        if (rData) {
          setFormData({
            total_payment: rData.total_payment || '',
            advance_payment: rData.advance_payment || '',
            take_away_date: rData.take_away_date?.split('T')[0] || '',
            return_date: rData.return_date?.split('T')[0] || '',
            received_by: rData.received_by || '',
            customer_name: rData.customer_name || '',
            phone_number: rData.phone_number || ''
          });
          
          if (rData.items && rData.items.length > 0) {
            setItems(rData.items.map(item => ({
              product_name: item.product_name,
              category: item.category,
              quantity: item.quantity
            })));
          }
        }
      } catch (err) {
        console.error("Failed to load rental data", err);
        alert("Rental not found or error loading data.");
        navigate('/rentals');
      } finally {
        setInitialLoad(false);
      }
    };
    fetchData();
  }, [id, navigate, user?.role]);

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems(prev => [...prev, { product_name: '', category: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.advance_payment) > (parseFloat(formData.total_payment) || 0)) {
      alert("Advance payment cannot exceed total payment.");
      return;
    }
    
    const invalidItem = items.find(i => !i.product_name.trim() || !i.category.trim() || i.quantity < 1);
    if (invalidItem) {
      alert("Please ensure all items have a name, category, and valid quantity.");
      return;
    }

    setLoading(true);
    try {
      const remaining = parseFloat(formData.total_payment) - parseFloat(formData.advance_payment);
      await api.put(`/rentals/${id}`, {
        ...formData,
        remaining_payment: remaining,
        items
      });
      navigate(`/rentals/${id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update rental");
    } finally {
      setLoading(false);
    }
  };

  const remainingCalc = (parseFloat(formData.total_payment || 0) - parseFloat(formData.advance_payment || 0)).toFixed(2);
  const memoryProducts = [...new Set(memory.map(m => m.product_name))];
  const memoryCategories = [...new Set(memory.map(m => m.category))];

  if (initialLoad) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin text-main rounded-full h-12 w-12 border-t-2 border-b-2 border-main border-r-2 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up pb-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button className="btn btn-glass btn-sm p-2 rounded-full" onClick={() => navigate(`/rentals/${id}`)}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">Edit Rental <span className="text-main">#{id}</span></h1>
          <p className="text-muted">Modify rental specifics and inventory items</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4 text-main border-b border-glass-border pb-2">Rental Financials & Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="form-group">
              <label>Total Payment</label>
              <input type="number" required step="0.01" className="form-control" name="total_payment" value={formData.total_payment} onChange={handleTextChange} placeholder="e.g. 500.00" />
            </div>
            
            <div className="form-group">
              <label>Advance Payment</label>
              <input type="number" required step="0.01" className="form-control" name="advance_payment" value={formData.advance_payment} onChange={handleTextChange} placeholder="e.g. 100.00" />
            </div>

            <div className="form-group col-span-1 md:col-span-2">
              <label className="text-muted block text-sm">Calculated Remaining Payment</label>
              <div className="text-xl font-bold text-warning p-2 bg-glass-bg border border-glass-border rounded-md">
                ${remainingCalc}
              </div>
            </div>

            <div className="form-group">
              <label>Take Away Date</label>
              <input type="date" required className="form-control" name="take_away_date" value={formData.take_away_date} onChange={handleTextChange} />
            </div>

            <div className="form-group">
              <label>Return Date</label>
              <input type="date" required className="form-control" name="return_date" value={formData.return_date} onChange={handleTextChange} min={formData.take_away_date} />
            </div>

            <div className="form-group">
              <label>Customer Name</label>
              <input type="text" required className="form-control" name="customer_name" value={formData.customer_name} onChange={handleTextChange} placeholder="e.g. John Doe" />
            </div>

            <div className="form-group">
              <label>Customer Phone Number</label>
              <input type="text" required className="form-control" name="phone_number" value={formData.phone_number} onChange={handleTextChange} placeholder="e.g. +251 9..." />
            </div>

            <div className="form-group col-span-1 md:col-span-2">
              <label>Payment Received By</label>
              <select required className="form-control" name="received_by" value={formData.received_by} onChange={handleTextChange}>
                <option value="">Select receiver...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4 border-b border-glass-border pb-2">
             <h2 className="text-lg font-bold text-secondary">Rented Items</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
              <Plus size={16} /> Add Row
            </button>
          </div>

          <datalist id="edit-product-memory">
            {memoryProducts.map((p, idx) => <option key={idx} value={p} />)}
          </datalist>
          
          <datalist id="edit-category-memory">
            {memoryCategories.map((c, idx) => <option key={idx} value={c} />)}
          </datalist>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-3 items-center bg-glass-bg p-3 border border-glass-border rounded-lg relative group transition-all">
                <div className="flex-1 w-full">
                  <label className="text-xs text-muted mb-1 block">Product Name</label>
                  <input type="text" required list="edit-product-memory" className="form-control" placeholder="e.g. Chair"
                    value={item.product_name} onChange={e => handleItemChange(index, 'product_name', e.target.value)} />
                </div>
                <div className="flex-1 w-full">
                  <label className="text-xs text-muted mb-1 block">Category</label>
                  <input type="text" required list="edit-category-memory" className="form-control" placeholder="e.g. Furniture"
                    value={item.category} onChange={e => handleItemChange(index, 'category', e.target.value)} />
                </div>
                <div className="w-24 shrink-0">
                  <label className="text-xs text-muted mb-1 block">Qty</label>
                  <input type="number" required min="1" className="form-control"
                    value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                </div>
                
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} 
                    className="mt-5 p-2 text-danger hover:bg-glass-border rounded-md transition-colors" title="Remove item">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : <><Save size={18} /> Update Rental</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRental;
