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
  UserCog,
  DollarSign,
  Sparkles
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

  const roleNavSections = {
    'Admin': [
      {
        title: 'Overview',
        items: [
          { path: '/admin/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        ]
      },
      {
        title: 'Store Operations',
        items: [
          { path: '/sales/pos', name: 'Point of Sale', icon: <ShoppingCart size={18} /> },
          { path: '/admin/sales', name: 'Sales Log', icon: <Receipt size={18} /> },
        ]
      },
      {
        title: 'Catalog & Inventory',
        items: [
          { path: '/admin/products', name: 'Products', icon: <Package size={18} /> },
          { path: '/encoder/categories', name: 'Categories', icon: <Tags size={18} /> },
          { path: '/inventory/price-update', name: 'Price Update', icon: <DollarSign size={18} /> },
          {
            path: '/admin/low-stock',
            name: 'Low Stock Alert',
            icon: <Bell size={18} />,
            badge: notifications.length > 0 ? notifications.length : null
          },
        ]
      },
      {
        title: 'Bookings & Rentals',
        items: [
          { path: '/reservations', name: 'Decor Reservations', icon: <Calendar size={18} /> },
          { path: '/add-reservation', name: 'New Reservation', icon: <PlusSquare size={18} /> },
          { path: '/rentals', name: 'Standalone Rentals', icon: <ShoppingBag size={18} /> },
        ]
      },
      {
        title: 'Finance & Accounts',
        items: [
          { path: '/admin/profit', name: 'Profit Tracking', icon: <TrendingUp size={18} /> },
          { path: '/expenses', name: 'Expenses', icon: <DollarSign size={18} /> },
        ]
      },
      {
        title: 'Audits & Logs',
        items: [
          { path: '/admin/history', name: 'Product Audit', icon: <History size={18} /> },
          { path: '/admin/sales-history', name: 'Sales Edit Audit', icon: <ClipboardList size={18} /> },
          { path: '/admin/reservation-history', name: 'Reserv. Audit', icon: <ClipboardList size={18} /> },
          { path: '/admin/rental-history', name: 'Rental Audit', icon: <ClipboardList size={18} /> },
          { path: '/admin/expense-history', name: 'Expense Audit', icon: <ClipboardList size={18} /> },
        ]
      },
      {
        title: 'Administration',
        items: [
          { path: '/admin/users', name: 'User Management', icon: <Users size={18} /> },
          { path: '/admin/branches', name: 'Store Branches', icon: <Building2 size={18} /> },
        ]
      }
    ],
    'Manager': [
      {
        title: 'Overview',
        items: [
          { path: '/manager/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        ]
      },
      {
        title: 'Store Operations',
        items: [
          { path: '/sales/pos', name: 'Point of Sale', icon: <ShoppingCart size={18} /> },
          { path: '/admin/sales', name: 'Sales Log', icon: <Receipt size={18} /> },
        ]
      },
      {
        title: 'Catalog & Inventory',
        items: [
          { path: '/admin/products', name: 'Products', icon: <Package size={18} /> },
          { path: '/inventory/price-update', name: 'Price Update', icon: <DollarSign size={18} /> },
          {
            path: '/admin/low-stock',
            name: 'Low Stock Alert',
            icon: <Bell size={18} />,
            badge: notifications.length > 0 ? notifications.length : null
          },
        ]
      },
      {
        title: 'Bookings & Rentals',
        items: [
          { path: '/reservations', name: 'Reservations', icon: <Calendar size={18} /> },
          { path: '/add-reservation', name: 'New Reservation', icon: <PlusSquare size={18} /> },
          { path: '/rentals', name: 'Standalone Rentals', icon: <ShoppingBag size={18} /> },
        ]
      },
      {
        title: 'Finance',
        items: [
          { path: '/admin/profit', name: 'Profit Tracking', icon: <TrendingUp size={18} /> },
          { path: '/expenses', name: 'Expenses', icon: <DollarSign size={18} /> },
        ]
      },
      {
        title: 'Audits & Logs',
        items: [
          { path: '/admin/history', name: 'Product Audit', icon: <History size={18} /> },
          { path: '/manager/sales-history', name: 'Sales Edit Audit', icon: <ClipboardList size={18} /> },
          { path: '/manager/reservation-history', name: 'Reserv. Audit', icon: <ClipboardList size={18} /> },
          { path: '/manager/rental-history', name: 'Rental Audit', icon: <ClipboardList size={18} /> },
          { path: '/manager/expense-history', name: 'Expense Audit', icon: <ClipboardList size={18} /> },
        ]
      }
    ],
    'Encoder': [
      {
        title: 'Catalog Management',
        items: [
          { path: '/encoder/categories', name: 'Categories', icon: <Tags size={18} /> },
          { path: '/encoder/products', name: 'Products', icon: <Package size={18} /> },
          { path: '/inventory/price-update', name: 'Price Update', icon: <DollarSign size={18} /> },
        ]
      },
      {
        title: 'Store Operations',
        items: [
          { path: '/sales/pos', name: 'Point of Sale', icon: <ShoppingCart size={18} /> },
          { path: '/encoder/sales', name: 'Sales Log', icon: <Receipt size={18} /> },
          { path: '/reservations', name: 'Decor Reservations', icon: <Calendar size={18} /> },
          { path: '/add-reservation', name: 'New Reservation', icon: <PlusSquare size={18} /> },
          { path: '/rentals', name: 'Standalone Rentals', icon: <ShoppingBag size={18} /> },
          { path: '/expenses', name: 'Expenses', icon: <DollarSign size={18} /> },
        ]
      }
    ],
    'Salesperson': [
      {
        title: 'Terminal & Bookings',
        items: [
          { path: '/sales/pos', name: 'Point of Sale', icon: <ShoppingCart size={18} /> },
          { path: '/reservations', name: 'Decor Reservations', icon: <Calendar size={18} /> },
          { path: '/add-reservation', name: 'New Reservation', icon: <PlusSquare size={18} /> },
          { path: '/rentals', name: 'Standalone Rentals', icon: <ShoppingBag size={18} /> },
          { path: '/expenses', name: 'Expenses', icon: <DollarSign size={18} /> },
        ]
      }
    ]
  };

  const navSections = roleNavSections[user.role] || [];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header-brand shrink-0">
        <div className="brand-icon-box">
          <Sparkles size={22} />
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-white text-base font-extrabold tracking-tight truncate leading-tight">
            Kal Gift Shop
          </h2>
          <span className="text-[11px] font-semibold text-muted tracking-wider uppercase opacity-80">
            Decor &amp; Inventory
          </span>
        </div>
        <button
          className="lg:hidden ml-auto p-2 text-muted hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Branch Selector for Admin/Manager */}
      {(user?.role === 'Admin' || user?.role === 'Manager') && (
        <div className="px-3 mb-3 shrink-0">
          <BranchSelector />
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="px-2 pb-6 flex-1 overflow-y-auto custom-scrollbar">
        {navSections.map((section, sIdx) => (
          <div key={section.title || sIdx} className="mb-2">
            {section.title && (
              <div className="sidebar-section-title">
                {section.title}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="shrink-0 opacity-85">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-warning text-[#090D16] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm shrink-0">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer — User Profile & Logout */}
      <div className="mt-auto p-3.5 border-t border-glass-border bg-black/40 shrink-0 backdrop-blur-md">
        <div
          className="glass-panel p-3 mb-3 cursor-pointer hover:bg-white/10 transition-all border border-white/5 hover:border-white/15 shadow-sm group rounded-xl"
          onClick={() => setShowProfile(true)}
          title="Update Profile"
        >
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-md text-sm border border-white/10">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0B1120] rounded-full"></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                {user.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                  {user.role}
                </span>
                {user.branch_name && (
                  <span className="text-[11px] text-muted truncate flex items-center gap-0.5">
                    <Building2 size={10} className="shrink-0" />
                    <span className="truncate">{user.branch_name}</span>
                  </span>
                )}
              </div>
            </div>
            <UserCog size={16} className="text-muted group-hover:text-white transition-colors shrink-0" />
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-danger w-full justify-center py-2.5 rounded-xl font-semibold text-sm shadow-md gap-2"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </aside>
  );
};

export default Sidebar;
