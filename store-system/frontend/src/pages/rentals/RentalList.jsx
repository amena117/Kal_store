import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, ChevronRight, AlertCircle, ShoppingBag, Download } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const RentalList = () => {
  const navigate = useNavigate();
  const { user, activeBranchId, branchParam } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rentals' + branchParam);
      setRentals(res.data || []);
    } catch (err) {
      console.error('Failed to fetch rentals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [activeBranchId]);

  const filteredRentals = rentals.filter(res => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (res.receiver_name && res.receiver_name.toLowerCase().includes(term)) ||
      (res.customer_name && res.customer_name.toLowerCase().includes(term)) ||
      (res.phone_number && res.phone_number.toLowerCase().includes(term)) ||
      (res.id && res.id.toString().includes(term))
    );
  });

  const exportData = () => {
    const formatted = filteredRentals.map(r => ({
      ID: r.id,
      'Take Away Date': r.take_away_date,
      'Return Date': r.return_date,
      'Total Payment': r.total_payment,
      Advance: r.advance_payment,
      Remaining: r.remaining_payment,
      Customer: r.customer_name,
      Phone: r.phone_number,
      Receiver: r.receiver_name || `User ID: ${r.received_by}`
    }));
    exportToCSV(formatted, 'Rentals');
  };

  return (
    <div className="animate-fade-in-up h-full pb-10">
      <div className="page-header mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="text-main" size={28} />
            Standalone Rentals
          </h1>
          <p className="text-muted">Manage all non-product rental agreements</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-glass" onClick={exportData} disabled={filteredRentals.length === 0}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/add-rental')}>
            <Plus size={18} /> New Rental
          </button>
        </div>
      </div>

      <div className="glass-card p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-muted mb-1 block">Search by Customer, Receiver, Phone or ID</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted" size={18} />
            <input type="text" className="form-control pl-10" placeholder="Search..." 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-glass" onClick={() => setSearchTerm('')}>
          Reset
        </button>
      </div>

      <div className="glass-card">
        <div className="table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Take Away Date</th>
                <th>Return Date</th>
                <th>Total Payment</th>
                <th>Advance</th>
                <th>Remaining</th>
                <th>Customer</th>
                <th>Receiver</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center p-10"><div className="animate-pulse text-muted">Loading rentals...</div></td></tr>
              ) : filteredRentals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-20">
                    <div className="flex flex-col items-center gap-2 text-muted">
                      <AlertCircle size={40} />
                      <p>No rentals found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRentals.map(rental => (
                  <tr key={rental.id} className="hover:bg-glass-bg transition-colors cursor-pointer" onClick={() => navigate(`/rentals/${rental.id}`)}>
                    <td className="font-bold text-main">#{rental.id}</td>
                    <td>{new Date(rental.take_away_date).toLocaleDateString()}</td>
                    <td>{new Date(rental.return_date).toLocaleDateString()}</td>
                    <td className="font-bold">${parseFloat(rental.total_payment).toLocaleString()}</td>
                    <td className="text-success font-semibold">${parseFloat(rental.advance_payment).toLocaleString()}</td>
                    <td className={`font-bold ${parseFloat(rental.remaining_payment) > 0 ? 'text-warning' : 'text-success'}`}>
                      ${parseFloat(rental.remaining_payment).toLocaleString()}
                    </td>
                    <td className="font-semibold">{rental.customer_name} <br/><small className="text-muted">{rental.phone_number}</small></td>
                    <td>{rental.receiver_name || `User ID: ${rental.received_by}`}</td>
                    <td className="text-right">
                      {canEdit ? (
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-glass btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/edit-rental/${rental.id}`); }}>
                            Edit
                          </button>
                          <button className="btn btn-glass btn-sm p-2 rounded-full" title="View Details">
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-glass btn-sm p-2 rounded-full" title="View Details">
                          <ChevronRight size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RentalList;
