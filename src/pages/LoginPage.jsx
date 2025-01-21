// LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import bcrypt from 'bcryptjs';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('');

  // Check if user was redirected from another page
  useEffect(() => {
    const checkRedirect = () => {
      if (location.state?.from) {
        setRedirectMessage('Please log in to access that page');
      }
    };

    checkRedirect();
  }, [location]);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = () => {
      const session = localStorage.getItem('session');
      if (session) {
        try {
          const parsedSession = JSON.parse(session);
          if (new Date(parsedSession.expiresAt) > new Date()) {
            // Valid session exists, redirect to home
            navigate('/', { replace: true });
          } else {
            // Session expired
            localStorage.removeItem('session');
            localStorage.removeItem('userPermissions');
          }
        } catch (error) {
          // Invalid session data
          localStorage.removeItem('session');
          localStorage.removeItem('userPermissions');
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Query the database
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('useremail', email.toLowerCase())
        .maybeSingle();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Login failed. Please try again.');
      }

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        throw new Error('Invalid email or password');
      }

      // Create session data
      const sessionData = {
        user: {
          email: user.useremail,
          role: user.role,
          username: user.username,
          employee_code: user.employee_code
        },
        expiresAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      // Create permissions object
      const permissions = {
        role: user.role,
        canEditStaff: user.can_edit_staff || false,
        canEditPipeline: user.can_edit_pipeline || false,
        canEditProduct: user.can_edit_product || false,
        canEditFiles: user.can_edit_files || false,
        canEditEnquiries: user.can_edit_enquiries || false,
        canEditStock: user.can_edit_stock || false,
        canEditProductEnquiry: user.can_edit_product_enquiry || false,
        canEditServiceEnquiry: user.can_edit_service_enquiry || false,
        canEditSales: user.can_edit_sales || false,
        canSeePerformance: user.can_see_performance || false,
        canViewStaff: user.can_view_staff || false,
        canViewPipeline: user.can_view_pipeline || false,
        canViewProduct: user.can_view_product || false,
        canViewFiles: user.can_view_files || false,
        canViewEnquiries: user.can_view_enquiries || false,
        canViewStock: user.can_view_stock || false,
        canViewProductEnquiry: user.can_view_product_enquiry || false,
        canViewServiceEnquiry: user.can_view_service_enquiry || false,
        canViewSales: user.can_view_sales || false
      };

      // Save to localStorage
      localStorage.setItem('session', JSON.stringify(sessionData));
      localStorage.setItem('userPermissions', JSON.stringify(permissions));

      // Redirect to intended page or home
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-20 w-auto"
          src="/haritha.svg"
          alt="Haritha Logo"
        />
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {redirectMessage && (
            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">{redirectMessage}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-2 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;