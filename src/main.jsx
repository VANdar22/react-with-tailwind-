import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

// Custom navigation function
const clerkNavigate = (to) => {
  // Handle MFA redirects
  if (to.startsWith('/login/factor-one')) {
    // Redirect to our custom MFA page or handle it in the current context
    window.location.href = '/sign-in#/factor-one';
    return;
  }
  window.location.href = to;
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      navigate={clerkNavigate}
      appearance={{
        layout: {
          showOptionalFields: false,
          socialButtonsPlacement: 'none',
          socialButtonsVariant: 'blockButton',
          termsPageUrl: 'https://clerk.com/terms',
          privacyPageUrl: 'https://clerk.com/privacy',
          helpPageUrl: '/help',
          logoPlacement: 'none',
          logoLinkUrl: '/',
          showOptionalFields: false,
          helpPageUrl: false,
          privacyPageUrl: false,
          termsPageUrl: false
        },
        variables: {
          colorPrimary: '#4f46e5',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          colorTextOnPrimaryBackground: '#ffffff',
          colorDanger: '#ef4444',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorInputText: '#1f2937',
          colorInputBorder: '#d1d5db',
          colorShimmer: 'rgba(0, 0, 0, 0.05)',
          shadowShimmer: '1px 1px 2px rgba(0, 0, 0, 0.2)'
        },
        elements: {
          card: { 
            boxShadow: 'none',
            border: 'none',
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto',
            backgroundColor: 'transparent'
          },
          headerTitle: {
            display: 'none'
          },
          headerSubtitle: {
            display: 'none'
          },
          socialButtonsBlockButton: {
            display: 'none'
          },
          dividerLine: {
            display: 'none'
          },
          dividerText: {
            display: 'none'
          },
          formFieldLabel: {
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#4a5568'
          },
          formFieldInput: {
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e2e8f0',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            '&:focus': {
              outline: 'none',
              borderColor: '#3182ce',
              boxShadow: '0 0 0 1px #3182ce'
            }
          },
          formButtonPrimary: {
            width: '100%',
            backgroundColor: '#3182ce',
            color: 'white',
            padding: '0.75rem',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#2c5282'
            },
            '&:disabled': {
              opacity: '0.7',
              cursor: 'not-allowed',
              backgroundColor: '#a0aec0'
            }
          },
          footer: {
            display: 'none'
          }
        },
        variables: {
          colorPrimary: '#3182ce',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorText: '#1a202c',
          colorTextSecondary: '#4a5568',
          colorTextOnPrimaryBackground: '#ffffff',
          colorDanger: '#e53e3e',
          colorSuccess: '#38a169'
        }
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
