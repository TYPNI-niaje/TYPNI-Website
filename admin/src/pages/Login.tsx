import { type FC, useState, useEffect } from 'react';
import { supabase, logAdminAction } from '../lib/supabase';
import typniLogo from '../assets/images/TYPNI-11.jpg';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  error?: string | null;
}

const Login: FC<LoginProps> = ({ error: externalError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(externalError || null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  // If user is already authenticated and is admin, redirect to dashboard
  useEffect(() => {
    if (isAdmin) {
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAdmin, navigate, location]);

  // Update error when external error prop changes
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Make sure we don't get stuck in loading state
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      setError('Login attempt timed out. Please try again.');
    }, 10000); // 10 seconds timeout
    
    try {
      // Attempt to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      // Check if user exists and has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (roleError || roleData?.role !== 'Admin') {
        console.error('User is not an admin:', roleError || 'No admin role');
        setError('Access denied. Only administrators can access this panel.');
        
        // Log unauthorized access attempt
        await logAdminAction(
          data.user.id,
          'access_denied',
          {
            email: data.user.email,
            reason: 'Not an admin user',
            ip: window.location.hostname,
            timestamp: new Date().toISOString()
          }
        );
        
        // Sign out the non-admin user
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      
      // Log successful login for admin
      await logAdminAction(
        data.user.id,
        'login',
        {
          email: data.user.email,
          ip: window.location.hostname,
          timestamp: new Date().toISOString()
        }
      );
      
      toast.success('Login successful');
      
      // Redirect to the page they tried to visit or dashboard
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
      
    } catch (error: any) {
      clearTimeout(loginTimeout);
      console.error('Unexpected login error:', error);
      setError(error.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <img 
            src={typniLogo} 
            alt="TYPNI Logo" 
            className="w-24 h-24 object-cover rounded-lg shadow-md" 
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full btn-primary flex justify-center py-2 px-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : 'Log in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 