import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Calendar, MapPin, Tag, DollarSign, User, Phone, Mail, FileText, Image as ImageIcon, Download, ArrowLeft, Clock, ShieldCheck, Edit2 } from 'lucide-react';

const ReservationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reservations/${id}`);
      setReservation(res.data);
    } catch (err) {
      console.error('Failed to fetch reservation', err);
      alert('Reservation not found');
      navigate('/reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-main"></div>
      </div>
    );
  }

  if (!reservation) return null;

  // Use base URL for images
  const apiBaseUrl = 'http://localhost:8000/';

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/reservations')} className="btn btn-glass p-2 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Reservation Details</h1>
            <p className="text-muted text-sm">#{reservation.id} - Created on {new Date(reservation.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <button onClick={() => navigate(`/edit-reservation/${reservation.id}`)} className="btn btn-primary flex items-center gap-2">
          <Edit2 size={18} /> Edit Reservation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-main to-secondary opacity-50"></div>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <MapPin className="text-main" /> {reservation.place}
                  </h2>
                  <div className="flex items-center gap-4 text-muted">
                    <span className="flex items-center gap-1"><Calendar size={16}/> {new Date(reservation.event_date).toLocaleDateString()}</span>
                    <span className="badge badge-glass">{reservation.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted mb-1 font-semibold uppercase tracking-wider">Advance Payment</div>
                  <div className="text-3xl font-bold text-secondary">{parseFloat(reservation.advance_payment).toLocaleString()} <span className="text-xs">ETB</span></div>
                </div>
              </div>

              <div className="border-t border-glass-border pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="text-main" size={20} /> Event Description
                </h3>
                <p className="text-muted leading-relaxed whitespace-pre-wrap italic">
                  {reservation.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <ImageIcon className="text-main" size={20} /> Documents & Samples
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contract Image */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-muted block">Contract / Signed Agreement</label>
                <div className="relative group rounded-xl overflow-hidden border border-glass-border">
                  <img src={`${apiBaseUrl}${reservation.contract_image}`} alt="Contract" className="w-full h-80 object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <a href={`${apiBaseUrl}${reservation.contract_image}`} target="_blank" rel="noreferrer" 
                      className="btn btn-secondary p-3 rounded-full" title="Download">
                      <Download size={24} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Sample Image */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-muted block">Sample Reference / Sample Image</label>
                {reservation.sample_image ? (
                  <div className="relative group rounded-xl overflow-hidden border border-glass-border">
                    <img src={`${apiBaseUrl}${reservation.sample_image}`} alt="Sample" className="w-full h-80 object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <a href={`${apiBaseUrl}${reservation.sample_image}`} target="_blank" rel="noreferrer" 
                        className="btn btn-secondary p-3 rounded-full" title="Download">
                        <Download size={24} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-80 flex flex-col items-center justify-center bg-black bg-opacity-20 rounded-xl border border-glass-border text-muted italic">
                    <ImageIcon size={32} className="mb-2 opacity-50" />
                    No sample image provided
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Contact Info & Status */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
              <User className="text-main" size={20} /> Contact Details
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-glass-bg rounded-lg text-main">
                  <User size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted mb-1 tracking-wider uppercase">Full Name</div>
                  <div className="text-lg font-bold text-white">{reservation.contact_name}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-glass-bg rounded-lg text-secondary">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted mb-1 tracking-wider uppercase">Phone Number</div>
                  <div className="text-lg font-bold text-white">{reservation.phone}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-glass-bg rounded-lg text-muted">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted mb-1 tracking-wider uppercase">Email Address</div>
                  <div className="text-lg font-bold text-white">{reservation.email || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-success">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-success" size={24} />
              <h3 className="text-lg font-semibold text-white">Registration Info</h3>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center text-muted border-b border-glass-border pb-2">
                <span>Created By:</span>
                <span className="font-bold text-white">{reservation.creator_name}</span>
              </div>
              <div className="flex justify-between items-center text-muted border-b border-glass-border pb-2">
                <span>Created At:</span>
                <span className="font-bold text-white">{new Date(reservation.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>Event Status:</span>
                <span className="badge badge-success">Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetails;
