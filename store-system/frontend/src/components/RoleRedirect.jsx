import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const redirects = {
    'Admin': '/admin/dashboard',
    'Manager': '/manager/dashboard',
    'Encoder': '/encoder/categories',
    'Salesperson': '/sales/pos'
  };

  return <Navigate to={redirects[user.role] || '/login'} replace />;
};

export default RoleRedirect;
