import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  // Admin-only: the branch they're currently "viewing as" (null = all branches)
  const [activeBranchId, setActiveBranchId] = useState(null);

  useEffect(() => {
    const token      = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      // Non-admin users: lock to their own branch
      if (parsed.role !== 'Admin') {
        setActiveBranchId(parsed.branch_id ?? null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { name: username, password });
      if (response.data && response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        // Non-admin: lock to their branch; Admin: start combined (null)
        setActiveBranchId(user.role !== 'Admin' ? (user.branch_id ?? null) : null);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to login';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveBranchId(null);
  };

  /** Admin calls this to switch the active branch view (null = all branches combined) */
  const setActiveBranch = (branchId) => {
    setActiveBranchId(branchId);
  };

  /**
   * Returns query params to append to API calls for branch scoping.
   * Non-admins: empty string (branch is enforced server-side by JWT).
   * Admin: '?branch_id=X' or '' for all-combined.
   */
  const branchParam = user?.role === 'Admin' && activeBranchId
    ? `?branch_id=${activeBranchId}`
    : '';

  const value = {
    user,
    login,
    logout,
    loading,
    activeBranchId,
    setActiveBranch,
    branchParam,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
