import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp as ClerkSignUp } from '@clerk/clerk-react';
import Home from './pages/Home';

import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Notifications from './pages/admin/Notifications';
import AppointmentsList from './pages/admin/AppointmentsList';
import AddAppointment from './pages/admin/AddAppointment';
import SimpleNavbar from './components/SimpleNavbar';
import Footer from './components/footer';
import ServicePage from './pages/ServicePage';
import AdminRoute from './components/AdminRoute';
import AdminPortal from './pages/AdminPortal';
import TestSupabase from './test/TestSupabase';

// ClerkProvider has been moved to main.jsx

// Wrapper component to conditionally show the navbar and footer
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/signup';
  const isAdminPage = location.pathname.startsWith('/admin');
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAuthPage && !isAdminPage && <SimpleNavbar />}
      <main style={{ flex: 1 }}>
        {children}
      </main>
      {!isAuthPage && !isAdminPage && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
          {/* Public routes */}
          {/* Public routes */}
          
          {/* Public home page */}
          <Route
            path="/"
            element={
              <AppLayout>
                <Home />
              </AppLayout>
            }
          />
          <Route
            path="/services"
            element={
              <AppLayout>
                <ServicePage />
              </AppLayout>
            }
          />
          
          {/* Clerk Auth Routes */}
          <Route
            path="/sign-in/*"
            element={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <SignIn 
                  routing="path" 
                  path="/sign-in" 
                  signUpUrl="/sign-up"
                  afterSignInUrl="/"
                  afterSignUpUrl="/"
                />
              </div>
            }
          />
          
          {/* MFA Route */}
          <Route
            path="/login/factor-one"
            element={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <SignIn 
                  routing="path" 
                  path="/login/factor-one"
                  redirectUrl="/"
                />
              </div>
            }
          />
          <Route
            path="/sign-up/*"
            element={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <ClerkSignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
              </div>
            }
          />
          
          {/* Admin Authentication */}
          <Route
            path="/admin/sign-in"
            element={
              <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AdminLogin />
              </div>
            }
          />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPortal />
            </AdminRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="appointments" element={<AppointmentsList />} />
            <Route path="appointments/new" element={<AddAppointment />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          
          {/* Redirect /login to /admin/sign-in */}
          <Route
            path="/login"
            element={
              <Navigate to="/admin/sign-in" replace />
            }
          />
          
          {/* Catch-all route for Clerk's authentication pages */}
          <Route
            path="/*"
            element={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
              </div>
            }
          />
          
          {/* Test route - remove in production */}
          <Route path="/test-supabase" element={<TestSupabase />} />
          
          {/* Add more protected routes as needed */}
          {/* 
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          */}
        </Routes>
      </Router>
  );
};

export default App;