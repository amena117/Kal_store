import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, User, Calendar, CreditCard, ChevronDown, Package, CheckCircle } from 'lucide-react';

const RentalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rentals/${id}`);
      setRental(res.data);
    } catch (err) {
      console.error('Failed to fetch rental', err);
      navigate('/rentals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, navigate]);

  const handleMarkAsPaid = async () => {
    if (!window.confirm("Are you sure you want to mark this rental as fully paid? This will set the remaining balance to $0.")) {
      return;
    }
    
    try {
      setLoading(true);
      await api.post(`/rentals/${id}/mark-paid`);
      await fetchDetails();
      alert("Rental marked as fully paid successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update payment status.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin text-main rounded-full h-12 w-12 border-t-2 border-b-2 border-main border-r-2 border-r-transparent"></div>
      </div>
    );
  }

  if (!rental) return null;

  return (
    <div className="animate-fade-in-up pb-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button className="btn btn-glass btn-sm p-2 rounded-full" onClick={() => navigate('/rentals')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Rental <span className="text-main">#{rental.id}</span>
            </h1>
            <p className="text-muted">Recorded on {new Date(rental.created_at).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canEdit && parseFloat(rental.remaining_payment) > 0 && (
            <button 
              className="btn btn-success flex items-center gap-2"
              onClick={handleMarkAsPaid}
              disabled={loading}
            >
              <CheckCircle size={18} /> Mark as Paid
            </button>
          )}
          
          {canEdit && (
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/edit-rental/${rental.id}`)}
              disabled={loading}
            >
              Edit Rental
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-main">
            <CreditCard size={20} /> Financials
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span className="text-muted">Total Payment</span>  <br />
              <span className="font-bold text-lg">${parseFloat(rental.total_payment).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span className="text-muted">Advance Payment</span>  <br />
              <span className="font-semibold text-success">${parseFloat(rental.advance_payment).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted">Remaining Balance</span>  <br />
              <span className={`font-bold text-lg ${parseFloat(rental.remaining_payment) > 0 ? 'text-warning' : 'text-success'}`}>
                ${parseFloat(rental.remaining_payment).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
            <Calendar size={20} /> Customer & Timeline
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span className="text-muted">Customer Name</span>  <br />
              <span className="font-bold text-main">{rental.customer_name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span className="text-muted">Phone Number</span>  <br />
              <span className="font-semibold">{rental.phone_number}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span className="text-muted">Take Away Date</span>  <br />
              <span className="font-semibold">{new Date(rental.take_away_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span className="text-muted">Return Date</span>  <br />
              <span className="font-semibold text-warning">{new Date(rental.return_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span className="text-muted flex items-center gap-2"><User size={14} /> Received By</span>  <br />
              <span className="font-bold text-secondary">{rental.receiver_name || `ID: ${rental.received_by}`}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-xs">
              <span className="text-muted">Recorded By</span> <br />
              <span>{rental.creator_name || 'System Generated'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-secondary">
          <Package size={20} /> Rented Items
        </h2>

        <div className="overflow-x-auto">
          <table className="glass-table w-full">
            <thead>
              <tr>
                <th className="text-left w-12 pb-2">#</th>
                <th className="text-left pb-2">Product Name</th>
                <th className="text-left pb-2">Category</th>
                <th className="text-right pb-2">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {rental.items && rental.items.length > 0 ? (
                rental.items.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-glass-border/30 last:border-0 hover:bg-glass-bg transition-colors">
                    <td className="py-3 text-muted">{idx + 1}</td>
                    <td className="py-3 font-semibold">{item.product_name}</td>
                    <td className="py-3"><span className="badge badge-glass">{item.category}</span></td>
                    <td className="py-3 text-right font-bold text-main">{item.quantity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-muted">No items recorded for this rental.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RentalDetails;
