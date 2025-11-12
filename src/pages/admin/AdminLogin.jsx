import React, { useState, useEffect } from 'react';
import { useAuth, useSignIn, useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();
  const { isSignedIn, isLoaded: isAuthLoaded, signOut } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Redirect if already signed in and is admin
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (isAuthLoaded && isSignedIn) {
        try {
          // Ensure we have the latest user data
          const session = await window.Clerk.session;
          const userData = await window.Clerk.user;
          
          if (userData?.publicMetadata?.role === 'admin') {
            // Force a full page reload to ensure all auth state is properly set
            window.location.href = '/admin/dashboard';
          } else {
            await signOut();
            setError('You do not have admin privileges');
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
          setError('Error checking your permissions');
        }
      }
    };

    checkAndRedirect();
  }, [isAuthLoaded, isSignedIn, navigate, signOut]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSignInLoaded) {
      setError('Authentication service is not ready');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Store email in localStorage before sign in attempt
      localStorage.setItem('adminEmail', email);
      
      // Attempt to sign in
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        // Sign in was successful, set the active session
        await setActive({ session: result.createdSessionId });
        
        try {
          // Get the latest user data after setting the active session
          const userData = await window.Clerk.user;
          
          // Update user's email if it's not set in Clerk
          if (userData && !userData.primaryEmailAddress) {
            await userData.update({
              primaryEmailAddress: email
            });
          }
          
          // Check if user is admin after successful sign in
          if (userData?.publicMetadata?.role === 'admin') {
            // Store user data in localStorage
            localStorage.setItem('adminUser', JSON.stringify({
              email: email,
              name: userData.fullName || 'Admin User',
              lastLogin: new Date().toISOString()
            }));
            
            // Force a full page reload to ensure all auth state is properly set
            window.location.href = '/admin/dashboard';
          } else {
            await signOut();
            setError('You do not have admin privileges');
          }
        } catch (error) {
          console.error('Error updating user data:', error);
          // Continue with login even if update fails
          window.location.href = '/admin/dashboard';
        }
      } else {
        console.error('Sign in not complete:', result);
        setError('Sign in could not be completed');
      }
    } catch (err) {
      console.error('Error during sign in:', err);
      setError(err.errors?.[0]?.longMessage || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-700">AutoTime</h1>
        </div>
        
        {/* Login Card */}
        <div className="bg-white border border-gray-200 p-8 w-full max-w-5xl mx-auto">
          
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-red-600 hover:text-red-500">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember this device
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} AutoCare. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;