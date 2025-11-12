import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { isLoaded: isAuthLoaded, userId } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthLoaded || !isUserLoaded) return;

      try {
        if (userId && user) {
          // Check if user has admin role
          const isUserAdmin = user.publicMetadata?.role === 'admin';
          
          if (!isUserAdmin) {
            console.warn('Non-admin user attempted to access admin route');
            await signOut();
            navigate('/admin/login');
            return;
          }
          
          setIsAdmin(true);
        } else {
          // No active session, redirect to sign in
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        navigate('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [isAuthLoaded, isUserLoaded, userId, user, signOut, navigate]);

  // Show loading state while checking auth
  if (isLoading || !isAuthLoaded || !isUserLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If user is authenticated and admin, render the protected content
  if (isAdmin) {
    return <Outlet />;
  }

  // Default return (should be caught by the redirect in the effect)
  return null;
};

export default AdminRoute;
