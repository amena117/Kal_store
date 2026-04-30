import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user's role is not authorized, redirect to their home based on role
    const redirects = {
      'Admin': '/admin/dashboard',
      'Encoder': '/encoder/categories',
      'Salesperson': '/sales/pos'
    };
    return <Navigate to={redirects[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
