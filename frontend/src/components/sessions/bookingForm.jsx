import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import SessionsAPI from '../../api/sessions';
import PaymentsAPI from '../../api/payments';
import Button from '../common/Button';
import SessionCalendar from './SessionCalendar';
import Spinner from '../common/Spinner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// Booking form component
const BookingForm = ({ professional, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1); // 1: Select date/time, 2: Payment
  const [sessionId, setSessionId] = useState(null);
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };
  
  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
  };
  
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };
  
  const handleContinue = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      setError('Please select a date and time slot');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Create session reservation
      const startTime = new Date(selectedDate);
      startTime.setHours(selectedTimeSlot.hour, selectedTimeSlot.minute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (professional.sessionSettings?.defaultSessionLength || 30));
      
      const session = await SessionsAPI.createSession({
        professionalId: professional._id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes
      });
      
      setSessionId(session._id);
      setStep(2); // Move to payment step
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book session. Please try again.');
      console.error('Error creating session:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onCancel();
    }
  };
  
  // Calculate session cost
  const calculateSessionCost = () => {
    if (!selectedTimeSlot) return 0;
    
    const sessionLengthHours = (professional.sessionSettings?.defaultSessionLength || 30) / 60;
    return professional.hourlyRate * sessionLengthHours;
  };
  
  return (
    <div>
      {step === 1 ? (
        // Step 1: Select date and time
        <>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Date</h3>
            <SessionCalendar 
              professional={professional}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>
          
          {selectedDate && (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Time Slot</h3>
              <div className="grid grid-cols-3 gap-2">
                {generateTimeSlots(professional, selectedDate).map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`py-2 px-4 text-center rounded-md ${
                      selectedTimeSlot && 
                      selectedTimeSlot.hour === slot.hour && 
                      selectedTimeSlot.minute === slot.minute
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => handleTimeSlotSelect(slot)}
                    disabled={!slot.available}
                  >
                    {formatTime(slot.hour, slot.minute)}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Session Notes</h3>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="What would you like to discuss? Any specific questions or topics?"
              value={notes}
              onChange={handleNotesChange}
            ></textarea>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {selectedTimeSlot && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Session Summary</p>
                  <p className="text-gray-600">
                    {formatDate(selectedDate)} at {formatTime(selectedTimeSlot.hour, selectedTimeSlot.minute)}
                  </p>
                  <p className="text-gray-600">
                    {professional.sessionSettings?.defaultSessionLength || 30} minutes with {professional.anonymizedProfile.displayName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${calculateSessionCost().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <Button variant="light" onClick={handleBack}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleContinue} 
              disabled={!selectedTimeSlot || loading}
              isLoading={loading}
            >
              Continue to Payment
            </Button>
          </div>
        </>
      ) : (
        // Step 2: Payment
        <Elements stripe={stripePromise}>
          <PaymentForm 
            sessionId={sessionId} 
            amount={calculateSessionCost()}
            onBack={handleBack}
            onSuccess={() => navigate('/sessions')}
          />
        </Elements>
      )}
    </div>
  );
};

// Payment form component
const PaymentForm = ({ sessionId, amount, onBack, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }
    
    setError('');
    setProcessing(true);
    
    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)
      });
      
      if (error) {
        setError(error.message);
        setProcessing(false);
        return;
      }
      
      // Process payment
      const result = await PaymentsAPI.processSessionPayment(
        sessionId,
        paymentMethod.id
      );
      
      if (result.success) {
        setSucceeded(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      console.error('Error processing payment:', err);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-md p-3 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {succeeded && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Payment successful! Redirecting to your sessions...
        </div>
      )}
      
      <div className="mb-4 p-4 bg-gray-50 rounded-md">
        <div className="flex justify-between items-center">
          <p className="font-medium text-gray-900">Total Amount</p>
          <p className="text-xl font-bold text-gray-900">
            ${amount.toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="light" 
          onClick={onBack}
          disabled={processing || succeeded}
        >
          Back
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          isLoading={processing}
          disabled={!stripe || processing || succeeded}
        >
          {processing ? 'Processing...' : succeeded ? 'Payment Successful' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
};

// Helper functions
const generateTimeSlots = (professional, date) => {
  // This is a simplified version - in a real app, you'd check the professional's availability
  // and existing bookings to generate available time slots
  const slots = [];
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
  
  // Find availability for the selected day
  const dayAvailability = professional.availability.find(a => a.day === dayOfWeek);
  
  if (!dayAvailability) {
    return slots;
  }
  
  // Parse start and end times
  const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
  const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);
  
  // Generate slots in 30-minute increments
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute of [0, 30]) {
      // Skip if before start time or after end time
      if (
        (hour === startHour && minute < startMinute) ||
        (hour === endHour && minute > endMinute)
      ) {
        continue;
      }
      
      slots.push({
        hour,
        minute,
        available: true // In a real app, check against existing bookings
      });
    }
  }
  
  return slots;
};

const formatTime = (hour, minute) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  const formattedMinute = minute.toString().padStart(2, '0');
  return `${formattedHour}:${formattedMinute} ${period}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
};

BookingForm.propTypes = {
  professional: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired
};

PaymentForm.propTypes = {
  sessionId: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  onBack: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default BookingForm;