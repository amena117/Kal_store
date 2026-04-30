import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar, MapPin, Tag, DollarSign, User, Phone, Mail,
  FileText, Upload, X, ArrowLeft, RefreshCw
} from 'lucide-react';

const EditReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBranchId, branchParam } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  
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

  const [previews, setPreviews] = useState({
    contract: null,
    sample: null
  });

  const [existingImages, setExistingImages] = useState({
    contract: null,
    sample: null
  });

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/reservations/${id}${branchParam}`);
        const data = res.data;
        
        const standardCategories = ['Birthday', 'Wedding', 'Proposal', 'Graduation', 'Shemgelena', 'Annversary'];
        const isCustom = !standardCategories.includes(data.category);

        setFormData({
          event_date: data.event_date,
          place: data.place,
          category: isCustom ? 'Other' : data.category,
          custom_category: isCustom ? data.category : '',
          advance_payment: data.advance_payment,
          description: data.description || '',
          contact_name: data.contact_name,
          phone: data.phone,
          email: data.email || '',
          contract_image: null,
          sample_image: null
        });

        setExistingImages({
          contract: data.contract_image,
          sample: data.sample_image
        });

        const baseUrl = api.defaults.baseURL.replace('/api', '');
        setPreviews({
          contract: data.contract_image ? `${baseUrl}/${data.contract_image}` : null,
          sample: data.sample_image ? `${baseUrl}/${data.sample_image}` : null
        });

      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reservation details');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id, activeBranchId, branchParam]);

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
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    setPreviews(prev => ({ 
      ...prev, 
      [type === 'contract_image' ? 'contract' : 'sample']: existingImages[type === 'contract_image' ? 'contract' : 'sample'] 
        ? `${baseUrl}/${existingImages[type === 'contract_image' ? 'contract' : 'sample']}`
        : null 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'category' && formData.category === 'Other') {
          data.append('category', formData.custom_category);
        } else if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      // Using POST with ID in URL for update compatibility with PHP $_FILES
      await api.post(`/reservations/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Reservation updated successfully!');
      navigate(`/reservations/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reservation');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 glass-card">
      <RefreshCw className="animate-spin text-main mb-4" size={40} />
      <p className="text-muted">Loading reservation data...</p>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center glass-card border-danger/30">
      <p className="text-danger mb-4">{error}</p>
      <button onClick={() => navigate(-1)} className="btn btn-glass">Go Back</button>
    </div>
  );

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-glass p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Edit Reservation</h1>
          <p className="text-muted">Modify event booking details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <input type="text" className="form-control pl-10" placeholder="e.g. Venue Name" required
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
              <label className="form-label">Advance Payment (ETB)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-muted" size={18} />
                <input type="number" className="form-control pl-10" placeholder="0.00" required
                  value={formData.advance_payment} onChange={e => setFormData({...formData, advance_payment: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Special Requirements</label>
              <textarea className="form-control min-h-[120px]" placeholder="Add event details..."
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>
        </div>

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
              <div className="form-group">
                <label className="form-label">Contract / Agreement (Required)</label>
                <div className="relative group rounded-lg overflow-hidden border border-glass-border">
                  {previews.contract ? (
                    <img src={previews.contract} alt="Contract" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-black/20 flex items-center justify-center text-muted text-xs">No Image Selected</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => document.getElementById('contract-upload').click()} className="btn btn-primary btn-sm">Replace Image</button>
                  </div>
                  <input type="file" id="contract-upload" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'contract_image')} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sample Image (Optional)</label>
                <div className="relative group rounded-lg overflow-hidden border border-glass-border">
                  {previews.sample ? (
                    <img src={previews.sample} alt="Sample" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-black/20 flex items-center justify-center text-muted text-xs">No Image Selected</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => document.getElementById('sample-upload').click()} className="btn btn-primary btn-sm">Replace Image</button>
                  </div>
                  <input type="file" id="sample-upload" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'sample_image')} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saveLoading} className="btn btn-primary w-full py-4 text-lg font-bold">
            {saveLoading ? 'Updating...' : 'Update Reservation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditReservation;
