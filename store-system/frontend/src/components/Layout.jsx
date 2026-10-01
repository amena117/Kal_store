import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import BranchSelector from './BranchSelector';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Package } from 'lucide-react';

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on navigation (mobile)
  useEffect(() => { 
    setSidebarOpen(false); 
  }, [location]);

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Package size={18} />
          </div>
          <span className="font-extrabold text-base text-white truncate shrink tracking-tight">Kal Gift Shop</span>
        </div>
        
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <BranchSelector isMobile={true} />
          <button
            className="p-2 text-white hover:bg-white/10 rounded-lg lg:hidden shrink-0 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
