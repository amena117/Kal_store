import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Tags,
  Package,
  History,
  LogOut,
  X,
  Bell,
  Calendar,
  PlusSquare,
  ClipboardList,
  ShoppingBag,
  Building2,
  TrendingUp,
  Receipt,
  Settings,
  UserCog
} from 'lucide-react';
import api from '../services/api';
import BranchSelector from './BranchSelector';
import ProfileModal from './ProfileModal';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  const fetchNotifications = async () => {
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      try {
        const res = await api.get('/products/low-stock');
        setNotifications(res.data || []);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const roleNavItems = {
    'Admin': [
     
      { path: '/admin/dashboard',     name: 'Dashboard',            icon: <LayoutDashboard size={20} /> },
      { path: '/admin/users',         name: 'User Management',      icon: <Users size={20} /> },
      { path: '/admin/branches',      name: 'Branches',             icon: <Building2 size={20} /> },
       { path: '/sales/pos',           name: 'Point of Sale',        icon: <ShoppingCart size={20} /> },
      { path: '/admin/sales',         name: 'Sales Log',            icon: <ShoppingCart size={20} /> },
      { path: '/admin/sales-history', name: 'Sales Edit Audit',     icon: <ClipboardList size={20} /> },
      { path: '/encoder/categories',  name: 'Categories',           icon: <Tags size={20} /> },
      { path: '/admin/products',      name: 'Products',             icon: <Package size={20} /> },
      { path: '/admin/history',       name: 'Product Audit History',icon: <History size={20} /> },
      { path: '/admin/low-stock',     name: 'Low Stock',            icon: <Bell size={20} className={notifications.length > 0 ? "text-warning" : ""} /> },
      { path: '/add-reservation',     name: 'Add Decor Reservation',icon: <PlusSquare size={20} /> },
      { path: '/reservations',        name: 'Decor Reservations',   icon: <Calendar size={20} /> },
      { path: '/admin/reservation-history', name: 'Reserv. Edit Audit', icon: <ClipboardList size={20} /> },
      { path: '/rentals',             name: 'Standalone Rentals',   icon: <ShoppingBag size={20} /> },
      { path: '/admin/rental-history',name: 'Rental Edit Audit',    icon: <ClipboardList size={20} /> },
      { path: '/admin/profit',        name: 'Profit Tracking',      icon: <TrendingUp size={20} /> },
      { path: '/expenses',            name: 'Expenses',             icon: <Receipt size={20} /> },
      { path: '/admin/expense-history',name:'Expense Edit Audit',   icon: <ClipboardList size={20} /> },
      { path: '#profile',             name: 'Profile Settings',     icon: <UserCog size={20} />, onClick: () => setShowProfile(true) },
    ],
    'Manager': [    
      { path: '/manager/dashboard',      name: 'Dashboard',            icon: <LayoutDashboard size={20} /> },
       { path: '/sales/pos',              name: 'Point of Sale',        icon: <ShoppingCart size={20} /> },
      { path: '/admin/sales',            name: 'Sales Log',            icon: <ShoppingCart size={20} /> },
      { path: '/manager/sales-history',  name: 'Sales Edit Audit',     icon: <ClipboardList size={20} /> },
      { path: '/admin/products',         name: 'Products',             icon: <Package size={20} /> },
      { path: '/admin/history',          name: 'Product Audit History',icon: <History size={20} /> },
      { path: '/admin/low-stock',        name: 'Low Stock',            icon: <Bell size={20} /> },
      { path: '/add-reservation',        name: 'Add Reservation',      icon: <PlusSquare size={20} /> },
      { path: '/reservations',           name: 'Reservations',         icon: <Calendar size={20} /> },
      { path: '/manager/reservation-history', name: 'Reserv. Edit Audit', icon: <ClipboardList size={20} /> },
      { path: '/rentals',                name: 'Standalone Rentals',   icon: <ShoppingBag size={20} /> },
      { path: '/manager/rental-history', name: 'Rental Edit Audit',    icon: <ClipboardList size={20} /> },
      { path: '/admin/profit',           name: 'Profit Tracking',      icon: <TrendingUp size={20} /> },
      { path: '/expenses',               name: 'Expenses',             icon: <Receipt size={20} /> },
      { path: '/manager/expense-history',name: 'Expense Edit Audit',   icon: <ClipboardList size={20} /> },
      { path: '#profile',                name: 'Profile Settings',     icon: <UserCog size={20} />, onClick: () => setShowProfile(true) },
    ],
    'Encoder': [
      { path: '/encoder/categories', name: 'Categories',       icon: <Tags size={20} /> },
      { path: '/encoder/products',   name: 'Products',         icon: <Package size={20} /> },
      { path: '/encoder/sales',      name: 'Sales Log',        icon: <ShoppingCart size={20} /> },
      { path: '/sales/pos',          name: 'Point of Sale',    icon: <ShoppingCart size={20} /> },
      { path: '/add-reservation',    name: 'Add Decor Reservation',icon: <PlusSquare size={20} /> },
      { path: '/reservations',       name: 'Decor Reservations',icon: <Calendar size={20} /> },
      { path: '/rentals',            name: 'Standalone Rentals',icon: <ShoppingBag size={20} /> },
      { path: '/expenses',           name: 'Expenses',         icon: <Receipt size={20} /> },
      { path: '#profile',            name: 'Profile Settings', icon: <UserCog size={20} />, onClick: () => setShowProfile(true) },
    ],
    'Salesperson': [
      { path: '/sales/pos', name: 'Point of Sale',     icon: <ShoppingCart size={20} /> },
      { path: '/add-reservation', name: 'Add Decor Reservation',icon: <PlusSquare size={20} /> },
      { path: '/reservations',    name: 'Decor Reservations',   icon: <Calendar size={20} /> },
      { path: '/rentals',   name: 'Standalone Rentals',icon: <ShoppingBag size={20} /> },
      { path: '/expenses',  name: 'Expenses',          icon: <Receipt size={20} /> },
      { path: '#profile',   name: 'Profile Settings',  icon: <UserCog size={20} />, onClick: () => setShowProfile(true) },
    ]
  };

  const navItems = roleNavItems[user.role] || [];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="p-6 pb-2 flex justify-between items-start shrink-0">
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-xl font-bold flex items-center gap-3 leading-tight">
            <Package className="text-white shrink-0" />
            Kal Gift Shop And Decor
          </h2>
        </div>
        <button className="lg:hidden p-2 text-muted hover:text-main" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      {(user?.role === 'Admin' || user?.role === 'Manager') && (
        <div className="px-5 mb-6 shrink-0">
          <BranchSelector />
        </div>
      )}

      <nav className="px-5 pb-6">
        {navItems.map((item) => (
          item.onClick ? (
            <button
              key={item.name}
              onClick={item.onClick}
              className="nav-link w-full border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-4">
                {item.icon}
                <span>{item.name}</span>
              </div>
            </button>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-4">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.path === '/admin/low-stock' && notifications.length > 0 && (
                  <span className="bg-warning text-[#0f172a] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    {notifications.length}
                  </span>
                )}
              </div>
            </NavLink>
          )
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto p-4 border-t border-glass-border bg-black bg-opacity-30 shrink-0">
        <div className="glass-panel p-4 mb-4 text-center cursor-pointer hover:bg-white/10 transition-all relative group border border-transparent hover:border-white/10 shadow-sm" onClick={() => setShowProfile(true)} title="Update Profile">
          <div className="absolute top-2 right-2 flex items-center gap-2 px-2 py-1 bg-white/10 text-white rounded-full transition-all duration-300 group-hover:bg-white/20 shadow-sm" title="Edit Profile">
           
     
             
          </div>
          <div className="text-sm font-semibold text-main">{user.name}</div>
          <div className="text-xs text-muted badge badge-success inline-block mt-1">{user.role}</div>
          {/* Show branch name for non-Admin users */}
          {user.role !== 'Admin' && user.branch_name && (
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted">
              <Building2 size={11} />
              <span>{user.branch_name}</span>
            </div>
          )}
        </div>
        <button onClick={logout} className="btn btn-danger w-full justify-start py-3">
          <LogOut size={20} />
          Logout
        </button>
      </div>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </aside>
  );
};

export default Sidebar;
