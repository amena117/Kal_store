import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Calendar, MapPin, Tag, DollarSign, User, Phone, Mail, FileText, Image as ImageIcon, Upload, X, ArrowLeft } from 'lucide-react';

const AddReservation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState({ contract: null, sample: null });
  
  const [formData, setFormData] = useState({
    event_date: '',
    place: '',
    category: 'Birthday',
    custom_category: '',
    advance_payment: '',
    description: '',
    contact_name: '',
    phone: '',
    email: '',
    contract_image: null,
    sample_image: null
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [type]: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [type === 'contract_image' ? 'contract' : 'sample']: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (type) => {
    setFormData({ ...formData, [type]: null });
    setPreviews(prev => ({ ...prev, [type === 'contract_image' ? 'contract' : 'sample']: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'category' && formData.category === 'Other') {
          data.append('category', formData.custom_category);
        } else if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      await api.post('/reservations', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Reservation added successfully!');
      navigate('/reservations');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-glass p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">New Reservation</h1>
          <p className="text-muted">Create a new decor event booking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Event Details */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="text-main" size={20} /> Event Information
          </h2>
          
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Event Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-muted" size={18} />
                <input type="date" className="form-control pl-10" required
                  value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location / Place</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-muted" size={18} />
                <input type="text" className="form-control pl-10" placeholder="e.g. Sheraton Hotel, Ballroom A" required
                  value={formData.place} onChange={e => setFormData({...formData, place: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Category</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 text-muted" size={18} />
                  <select className="form-control pl-10" value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Birthday">Birthday</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Graduation">Graduation</option>
                    <option value="Shemgelena">Shemgelena</option>
                    <option value="Annversary">Annversary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
                  
              {formData.category === 'Other' && (
                <div className="form-group animate-fade-in">
                  <label className="form-label">Specify Category</label>
                  <input type="text" className="form-control" placeholder="Enter category" required
                    value={formData.custom_category} onChange={e => setFormData({...formData, custom_category: e.target.value})} />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Advance Payment</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-muted" size={18} />
                <input type="number" className="form-control pl-10" placeholder="0.00" required
                  value={formData.advance_payment} onChange={e => setFormData({...formData, advance_payment: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Special Requirements</label>
              <textarea className="form-control min-h-[120px]" placeholder="Add event details, themes, etc."
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Files */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User className="text-main" size={20} /> Contact Information
            </h2>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Customer Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-muted" size={18} />
                  <input type="text" className="form-control pl-10" required
                    value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-muted" size={18} />
                    <input type="tel" className="form-control pl-10" required
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-muted" size={18} />
                    <input type="email" className="form-control pl-10"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <FileText className="text-main" size={20} /> Documents & Samples
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Contract Image */}
              <div className="form-group">
                <label className="form-label">Contract / Agreement (Required)</label>
                {!previews.contract ? (
                  <div className="upload-zone" onClick={() => document.getElementById('contract-upload').click()}>
                    <Upload size={24} className="text-muted mb-2" />
                    <p className="text-xs text-muted text-center">Click to upload contract</p>
                    <input type="file" id="contract-upload" hidden accept="image/*"
                      onChange={(e) => handleFileChange(e, 'contract_image')} required />
                  </div>
                ) : (
                  <div className="relative group rounded-lg overflow-hidden border border-glass-border">
                    <img src={previews.contract} alt="Contract" className="w-full h-40 object-cover" />
                    <button type="button" onClick={() => removeFile('contract_image')}
                      className="absolute top-2 right-2 p-1 bg-danger rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Sample Image */}
              <div className="form-group">
                <label className="form-label">Sample Image (Optional)</label>
                {!previews.sample ? (
                  <div className="upload-zone" onClick={() => document.getElementById('sample-upload').click()}>
                    <Upload size={24} className="text-muted mb-2" />
                    <p className="text-xs text-muted text-center">Click to upload sample</p>
                    <input type="file" id="sample-upload" hidden accept="image/*"
                      onChange={(e) => handleFileChange(e, 'sample_image')} />
                  </div>
                ) : (
                  <div className="relative group rounded-lg overflow-hidden border border-glass-border">
                    <img src={previews.sample} alt="Sample" className="w-full h-40 object-cover" />
                    <button type="button" onClick={() => removeFile('sample_image')}
                      className="absolute top-2 right-2 p-1 bg-danger rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-4 text-lg font-bold">
            {loading ? 'Processing...' : 'Save Reservation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddReservation;
