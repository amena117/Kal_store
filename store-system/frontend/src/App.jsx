import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import RoleRedirect from './components/RoleRedirect';
// Public Pages
import Login from './pages/Login';
// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Branches from './pages/admin/Branches';
import SalesLog from './pages/admin/SalesLog';
import AuditHistory from './pages/admin/AuditHistory';
import LowStock from './pages/admin/LowStock';
import SalesEditHistory from './pages/admin/SalesEditHistory';
import ProfitTracking from './pages/admin/ProfitTracking';
import ReservationHistory from './pages/admin/ReservationHistory';
import RentalHistory from './pages/admin/RentalHistory';
import ExpenseHistory from './pages/admin/ExpenseHistory';
// Encoder Pages
import Categories from './pages/encoder/Categories';
import Products from './pages/encoder/Products';
// Salesperson Pages
import POS from './pages/sales/POS';
// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';

// Reservation Pages
import ReservationList from './pages/reservations/ReservationList';
import AddReservation from './pages/reservations/AddReservation';
import ReservationDetails from './pages/reservations/ReservationDetails';
import EditReservation from './pages/reservations/EditReservation';

// Rental Pages
import RentalList from './pages/rentals/RentalList';
import AddRental from './pages/rentals/AddRental';
import RentalDetails from './pages/rentals/RentalDetails';
import EditRental from './pages/rentals/EditRental';

// Expense Pages
import ExpenseList from './pages/expenses/ExpenseList';
import AddExpense from './pages/expenses/AddExpense';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Super Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/users"     element={<ProtectedRoute allowedRoles={['Admin']}><Users /></ProtectedRoute>} />
            <Route path="/admin/branches"  element={<ProtectedRoute allowedRoles={['Admin']}><Branches /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Products /></ProtectedRoute>} />
            <Route path="/admin/sales" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><SalesLog /></ProtectedRoute>} />
            <Route path="/admin/history" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><AuditHistory /></ProtectedRoute>} />
            <Route path="/admin/low-stock" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><LowStock /></ProtectedRoute>} />
            <Route path="/admin/sales-history" element={<ProtectedRoute allowedRoles={['Admin']}><SalesEditHistory /></ProtectedRoute>} />
            <Route path="/admin/reservation-history" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><ReservationHistory /></ProtectedRoute>} />
            <Route path="/admin/rental-history" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><RentalHistory /></ProtectedRoute>} />
            <Route path="/admin/expense-history" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><ExpenseHistory /></ProtectedRoute>} />
            <Route path="/admin/profit" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><ProfitTracking /></ProtectedRoute>} />

            {/* Manager Routes */}
            <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['Manager']}><ManagerDashboard /></ProtectedRoute>} />
            <Route path="/manager/sales-history" element={<ProtectedRoute allowedRoles={['Manager']}><SalesEditHistory /></ProtectedRoute>} />
            <Route path="/manager/reservation-history" element={<ProtectedRoute allowedRoles={['Manager']}><ReservationHistory /></ProtectedRoute>} />
            <Route path="/manager/rental-history" element={<ProtectedRoute allowedRoles={['Manager']}><RentalHistory /></ProtectedRoute>} />
            <Route path="/manager/expense-history" element={<ProtectedRoute allowedRoles={['Manager']}><ExpenseHistory /></ProtectedRoute>} />

            {/* Encoder Routes */}
            <Route path="/encoder/categories" element={<ProtectedRoute allowedRoles={['Encoder', 'Admin']}><Categories /></ProtectedRoute>} />
            <Route path="/encoder/products" element={<ProtectedRoute allowedRoles={['Encoder']}><Products /></ProtectedRoute>} />
            <Route path="/encoder/sales" element={<ProtectedRoute allowedRoles={['Encoder']}><SalesLog /></ProtectedRoute>} />

            {/* Sales Routes */}
            <Route path="/sales/pos" element={<ProtectedRoute allowedRoles={['Salesperson', 'Encoder', 'Admin', 'Manager']}><POS /></ProtectedRoute>} />

            {/* Reservation Routes */}
            <Route path="/reservations" element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Encoder', 'Salesperson']}><ReservationList /></ProtectedRoute>} />
            <Route path="/add-reservation" element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Encoder', 'Salesperson']}><AddReservation /></ProtectedRoute>} />
            <Route path="/reservations/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Encoder', 'Salesperson']}><ReservationDetails /></ProtectedRoute>} />
            <Route path="/edit-reservation/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><EditReservation /></ProtectedRoute>} />

            {/* Rental Routes */}
            <Route path="/rentals" element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Encoder', 'Salesperson']}><RentalList /></ProtectedRoute>} />
            <Route path="/add-rental" element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Encoder', 'Salesperson']}><AddRental /></ProtectedRoute>} />
            <Route path="/rentals/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Encoder', 'Salesperson']}><RentalDetails /></ProtectedRoute>} />
            <Route path="/edit-rental/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><EditRental /></ProtectedRoute>} />

            {/* Expense Routes */}
            <Route path="/expenses" element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Encoder', 'Salesperson']}><ExpenseList /></ProtectedRoute>} />
            <Route path="/add-expense" element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Encoder', 'Salesperson']}><AddExpense /></ProtectedRoute>} />

            {/* Intelligent Fallback */}
            <Route path="/" element={<RoleRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;