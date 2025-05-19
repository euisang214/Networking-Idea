import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppRoutes from './Routes';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Elements stripe={stripePromise}>
            <AppRoutes />
          </Elements>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;