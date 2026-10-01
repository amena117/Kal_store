import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const result = await login(username, password);
    if (result.success) {
      const from = location.state?.from?.pathname || '/';
      // If going to root, the protected route will auto redirect based on role
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Dynamic Ambient Background Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="glass-login-card animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-violet-600/20 border border-indigo-500/40 flex items-center justify-center mb-4 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)] transform hover:scale-105 transition-transform duration-300">
            <Package size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Kal Gift Shop &amp; Decor
          </h1>
          <p className="text-muted text-sm font-medium">Enterprise Management System</p>
        </div>

        {error && (
          <div className="alert alert-error mb-5 text-sm py-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label text-xs font-bold uppercase tracking-wider text-muted mb-1.5" htmlFor="username">
              Username or Account
            </label>
            <div className="input-icon-wrapper relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
              <input 
                id="username"
                type="text" 
                className="form-control pl-10 pr-4 py-3 bg-black/40 border-white/10 text-white rounded-xl text-sm w-full transition-all focus:border-indigo-500/60 focus:bg-black/60" 
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label text-xs font-bold uppercase tracking-wider text-muted mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="input-icon-wrapper relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
              <input 
                id="password"
                type={showPassword ? "text" : "password"} 
                className="form-control pl-10 pr-11 py-3 bg-black/40 border-white/10 text-white rounded-xl text-sm w-full transition-all focus:border-indigo-500/60 focus:bg-black/60" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full py-3.5 text-base font-bold rounded-xl shadow-xl shadow-indigo-500/30 mt-2 transition-all"
            disabled={loading}
          >
            {loading ? <div className="spinner mx-auto"></div> : 'Sign In to Workspace'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-4">
          <p className="text-[11px] text-muted tracking-widest uppercase opacity-60">Store Edition v2.5 • Authorized Access</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
