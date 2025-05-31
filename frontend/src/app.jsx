import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/authContext';
import { NotificationProvider } from './contexts/notificationContext';
import AppRoutes from './routes';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import config from './config';

// Initialize Stripe
const stripePromise = loadStripe(config.stripePublicKey);

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