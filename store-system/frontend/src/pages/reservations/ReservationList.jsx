import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Calendar, MapPin, Eye, ChevronRight, Plus, Download, AlertCircle, Edit2 } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const ReservationList = () => {
  const navigate = useNavigate();
  const { activeBranchId, branchParam } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reservations' + branchParam);
      setReservations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch reservations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [activeBranchId]);

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = res.place.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          res.contact_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || res.category === filterCategory;
    const matchesDate = filterDate === '' || res.event_date === filterDate;
    return matchesSearch && matchesCategory && matchesDate;
  });

  const exportData = () => {
    const formatted = filteredReservations.map(r => ({
      'Event Date': r.event_date,
      Location: r.place,
      Category: r.category,
      'Advance Payment': r.advance_payment,
      'Contact Name': r.contact_name,
      Phone: r.phone
    }));
    exportToCSV(formatted, 'Reservations');
  };

  const categories = [...new Set(reservations.map(r => r.category))];

  return (
    <div className="animate-fade-in-up h-full pb-10">
      <div className="page-header mb-8">
        <div>
          <h1 className="text-3xl font-bold">Decor Reservations</h1>
          <p className="text-muted">Manage all upcoming event decorations</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-glass" onClick={exportData} disabled={filteredReservations.length === 0}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/add-reservation')}>
            <Plus size={18} /> New Reservation
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-muted mb-1 block">Search Location or Name</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted" size={18} />
            <input type="text" className="form-control pl-10" placeholder="Search..." 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="w-full sm:w-48">
          <label className="text-xs font-semibold text-muted mb-1 block">Category</label>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-muted" size={16} />
            <select className="form-control pl-10" value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="w-full sm:w-48">
          <label className="text-xs font-semibold text-muted mb-1 block">Event Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-muted" size={18} />
            <input type="date" className="form-control pl-10" 
              value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>
        </div>

        <button className="btn btn-glass" onClick={() => { setSearchTerm(''); setFilterCategory(''); setFilterDate(''); }}>
          Reset
        </button>
      </div>

      <div className="glass-card">
        <div className="table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Event Date</th>
                <th>Location / Place</th>
                <th>Category</th>
                <th>Advance Payment</th>
                <th>Contact Name</th>
                <th>Phone</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-10"><div className="animate-pulse text-muted">Loading reservations...</div></td></tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-20">
                    <div className="flex flex-col items-center gap-2 text-muted">
                      <AlertCircle size={40} />
                      <p>No reservations found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReservations.map(res => (
                  <tr key={res.id} className="hover:bg-glass-bg transition-colors cursor-pointer" onClick={() => navigate(`/reservations/${res.id}`)}>
                    <td className="font-medium">{new Date(res.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-main" />
                        {res.place}
                      </div>
                    </td>
                    <td><span className="badge badge-glass">{res.category}</span></td>
                    <td className="font-bold text-secondary">{parseFloat(res.advance_payment).toLocaleString()} <span className="text-[10px]">ETB</span></td>
                    <td>{res.contact_name}</td>
                    <td className="text-muted">{res.phone}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="btn btn-glass btn-sm p-2 rounded-full text-main hover:bg-main/10" 
                          onClick={(e) => { e.stopPropagation(); navigate(`/edit-reservation/${res.id}`); }}
                          title="Edit Reservation"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-glass btn-sm p-2 rounded-full" title="View Details">
                          <ChevronRight size={18} />
                        </button>
                      </div>
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

export default ReservationList;
