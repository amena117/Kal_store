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
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <Package className="text-white shrink-0" size={22} />
          <span className="font-bold text-lg text-white truncate shrink transition-all">Kal Gift Shop</span>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <BranchSelector isMobile={true} />
          <button
            className="p-2 text-white hover:bg-glass-bg rounded-md lg:hidden shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
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
