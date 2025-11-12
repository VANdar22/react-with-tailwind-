import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const ProfileDropdown = () => {
  const { signOut, userId } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: 'Admin',
    avatar: ''
  });

  useEffect(() => {
    const getUserData = async () => {
      if (user) {
        try {
          // Get the primary email address
          const email = user.primaryEmailAddress?.emailAddress || 
                       user.emailAddresses?.[0]?.emailAddress || 
                       user.email || 
                       user.emailAddress || 
                       localStorage.getItem('adminEmail') || 
                       'No email available';

          // Update the state with user data
          setUserData({
            name: user.fullName || user.firstName || 'Admin User',
            email: email,
            role: 'Admin',
            avatar: user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent((user.fullName || 'Admin').replace(/\s+/g, '+'))}&background=4f46e5&color=fff`
          });

          // Update localStorage with the latest email
          if (email && email !== 'No email available') {
            localStorage.setItem('adminEmail', email);
          }
        } catch (error) {
          console.error('Error getting user data:', error);
        }
      }
    };

    getUserData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/sign-in');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="relative ml-3">
      <div>
        <button
          type="button"
          className={`flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600 text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${isOpen ? 'ring-2 ring-red-500' : ''}`}
          id="user-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="sr-only">Open user menu</span>
          {userData.avatar ? (
            <img
              className="h-8 w-8 rounded-full"
              src={userData.avatar}
              alt={userData.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=4f46e5&color=fff`;
              }}
            />
          ) : (
            <span>{userData.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg border border-gray-200 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex="-1"
        >
          {/* Account Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{userData.name || 'User Account'}</p>
            <p className="text-xs text-gray-500 truncate">{userData.email || 'No email'}</p>
          </div>
          
          {/* Sign Out Button */}
          <div className="px-2 py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              role="menuitem"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
