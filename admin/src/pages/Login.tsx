import { type FC, useState, useEffect } from 'react';
import { supabase, logAdminAction } from '../lib/supabase';
import typniLogo from '../assets/images/TYPNI-11.jpg';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  error?: string | null;
  }

const Login: FC<LoginProps> = ({ error: externalError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(externalError || null);
  const navigate = useNavigate();

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
      console.log('Attempting login with email:', email);
      
      if (!email || !password) {
        setError('Email and password are required');
        clearTimeout(loginTimeout);
        setLoading(false);
        return;
      }
      
      // Attempt to sign in
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(), 
        password
      });
      
      clearTimeout(loginTimeout);
      
      if (loginError) {
        console.error('Login error:', loginError);
        setError(loginError.message || 'Invalid email or password');
        
        // Log failed login attempt
        await logAdminAction(
          null, 
          'failed_login', 
          { 
            email,
            reason: loginError.message || 'Invalid credentials',
            ip: window.location.hostname,
            timestamp: new Date().toISOString()
          }
        );
        
        setLoading(false);
        return;
      }
      
      if (!data?.user) {
        console.error('No user returned from login');
        setError('Login failed - no user data returned');
        
        // Log failed login attempt
        await logAdminAction(
          null,
          'failed_login',
          {
            email,
            reason: 'No user data returned',
            ip: window.location.hostname,
            timestamp: new Date().toISOString()
          }
        );
        
        setLoading(false);
        return;
      }

      // Check if user has admin role
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
      
      // Always redirect to dashboard after successful login
      navigate('/admin/dashboard');
      
      // Auth state change will be handled by the App component
      // Keep loading state true as we'll redirect shortly
      
    } catch (error: any) {
      clearTimeout(loginTimeout);
      console.error('Unexpected login error:', error);
      setError(error.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src={typniLogo} 
            alt="TYPNI Logo" 
            className="w-24 h-24 object-cover rounded-xl shadow-md"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The Young People's Network International
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
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
    </div>
  );
};

export default Login; 