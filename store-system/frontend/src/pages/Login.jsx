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
      {/* Dynamic Background Elements */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="glass-login-card animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="mx-auto bg-primary bg-opacity-20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-primary border-opacity-30 transform hover:scale-110 transition-transform duration-500 shadow-glow">
            <Package className="text-primary w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold text-gradient mb-3 tracking-tight">Kal Gift Shop And Decor</h1>
          <p className="text-muted text-lg">Secure Merchant Access</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="form-label mb-2" htmlFor="username">Username or Full Name</label>
            <div className="input-icon-wrapper relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                id="username"
                type="text" 
                className="form-control pl-12 pr-4 py-3 bg-opacity-40" 
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label mb-2" htmlFor="password">Password</label>
            <div className="input-icon-wrapper relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                id="password"
                type={showPassword ? "text" : "password"} 
                className="form-control pl-12 pr-12 py-3 bg-opacity-40" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-95"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                title={showPassword ? "Hide password" : "Show password"}
                style={{ color: 'rgba(255, 255, 255, 0.75)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full py-4 text-lg font-bold shadow-xl mt-4 hover:shadow-primary/40 transition-all active:scale-95"
            disabled={loading}
          >
            {loading ? <div className="spinner mx-auto"></div> : 'Initialize Session'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted uppercase tracking-widest opacity-50">Enterprise Edition v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
