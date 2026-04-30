import React, { useState, useEffect, useRef } from 'react';
import { Building2, Globe, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const BranchSelector = ({ isMobile = false }) => {
  const { user, activeBranchId, setActiveBranch } = useAuth();
  const [branches, setBranches] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchBranches = async () => {
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      try {
        const res = await api.get('/branches');
        setBranches(res.data || []);
      } catch (err) {
        console.error('Failed to fetch branches', err);
      }
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  if (user?.role !== 'Admin' && user?.role !== 'Manager') return null;

  const activeBranchName = activeBranchId
    ? (branches.find(b => b.id === activeBranchId)?.name || 'Branch')
    : 'All Branches Combined';

  const handleBranchSelect = (id) => {
    setActiveBranch(id);
    setDropdownOpen(false);
  };

  return (
    <div 
      className={isMobile ? 'ml-2' : 'w-full'} 
      ref={dropdownRef}
      style={{ position: 'relative' }}
    >
      
      {/* Top Button */}
      <button
        onClick={() => setDropdownOpen(o => !o)}
        className="glass-panel w-full flex items-center justify-between"
        style={{
          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
          transition: 'all 0.3s ease',
          borderColor: dropdownOpen ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
          background: dropdownOpen ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          boxShadow: dropdownOpen ? '0 0 15px rgba(79, 70, 229, 0.3)' : 'none',
          cursor: 'pointer',
          borderRadius: '12px'
        }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div style={{
            background: 'var(--primary)',
            padding: isMobile ? '0.35rem' : '0.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.4)'
          }}>
            {activeBranchId ? (
              <Building2 size={isMobile ? 16 : 20} color="#fff" />
            ) : (
              <Globe size={isMobile ? 16 : 20} color="#fff" />
            )}
          </div>

          <div className="flex flex-col text-left overflow-hidden">
            {!isMobile && (
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                Active Store context
              </span>
            )}
            <span style={{ 
              fontSize: isMobile ? '0.9rem' : '1rem', 
              fontWeight: 700, 
              color: '#ffffff', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              lineHeight: 1.2
            }}>
              {activeBranchName}
            </span>
          </div>
        </div>

        <ChevronDown
          size={18}
          color="var(--text-muted)"
          style={{ 
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            marginLeft: '0.5rem'
          }}
        />
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          className="glass-card custom-scrollbar"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: isMobile ? 'auto' : 0,
            right: 0,
            zIndex: 1001,
            padding: '0.5rem',
            minWidth: '260px',
            maxHeight: '350px',
            overflowY: 'auto',
            animation: 'fadeInUp 0.2s ease-out',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}
        >
          
          {/* All Branches Option */}
          <button
            className="w-full flex items-center justify-between"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              background: !activeBranchId ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
              border: !activeBranchId ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid transparent',
              marginBottom: '4px',
              textAlign: 'left'
            }}
            onClick={() => handleBranchSelect(null)}
            onMouseOver={(e) => { if (activeBranchId) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseOut={(e) => { if (activeBranchId) e.currentTarget.style.background = 'transparent' }}
          >
            <div className="flex items-center gap-3">
              <Globe size={18} color={!activeBranchId ? '#fff' : 'var(--text-muted)'} />
              <span style={{ 
                color: !activeBranchId ? '#fff' : 'var(--text-main)', 
                fontWeight: !activeBranchId ? 700 : 500,
                fontSize: '0.95rem'
              }}>
                All Branches Combined
              </span>
            </div>
            {!activeBranchId && <Check size={16} color="var(--primary)" />}
          </button>

          {branches.length > 0 && (
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
          )}

          {/* Branch List */}
          <div className="flex flex-col gap-1">
            {branches.map((b) => (
              <button
                key={b.id}
                className="w-full flex items-center justify-between"
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  background: activeBranchId === b.id ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
                  border: activeBranchId === b.id ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid transparent',
                  textAlign: 'left'
                }}
                onClick={() => handleBranchSelect(b.id)}
                onMouseOver={(e) => { if (activeBranchId !== b.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseOut={(e) => { if (activeBranchId !== b.id) e.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <Building2 size={18} color={activeBranchId === b.id ? '#fff' : 'var(--text-muted)'} />
                  <span style={{ 
                    color: activeBranchId === b.id ? '#fff' : 'var(--text-main)', 
                    fontWeight: activeBranchId === b.id ? 700 : 500,
                    fontSize: '0.95rem'
                  }}>
                    {b.name}
                  </span>
                </div>
                {activeBranchId === b.id && <Check size={16} color="var(--primary)" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSelector;