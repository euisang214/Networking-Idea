import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const EnhancedBookingForm = ({ professional, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: DateTime, 2: Payment, 3: Confirmation
  
  // Form data
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [sessionData, setSessionData] = useState(null);
  
  // Step 1: Date and Time Selection
  const handleContinueToPayment = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      setError('Please select a date and time slot');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Create session (but don't confirm until payment)
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
      
      setSessionData(session);
      setStep(2); // Move to payment
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Step 2: Payment Processing
  const handlePayment = (e) => {
    e.preventDefault();
    
    if (!sessionData) {
      return;
    }
    
    setError('');
    setLoading(true);
    
    // Mock payment processing for demo
    setTimeout(() => {
      setStep(3); // Move to confirmation
      setLoading(false);
    }, 2000);
  };
  
  // Calculate session cost
  const calculateSessionCost = () => {
    if (!selectedTimeSlot) return 0;
    const sessionLengthHours = (professional.sessionSettings?.defaultSessionLength || 30) / 60;
    return professional.hourlyRate * sessionLengthHours;
  };
  
  // Generate available time slots
  const generateTimeSlots = (date) => {
    const slots = [];
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    const dayAvailability = professional.availability?.find(a => a.day === dayOfWeek);
    
    if (!dayAvailability) return slots;
    
    const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute of [0, 30]) {
        if ((hour === startHour && minute < startMinute) ||
            (hour === endHour && minute > endMinute)) {
          continue;
        }
        
        slots.push({
          hour,
          minute,
          available: true, // TODO: Check against existing bookings
          display: formatTime(hour, minute)
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
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= stepNumber 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`h-1 w-16 ${
                  step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Select Time</span>
          <span>Payment</span>
          <span>Confirmation</span>
        </div>
      </div>
      
      {/* Step Content */}
      {step === 1 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Select Date & Time</h3>
          
          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              value={selectedDate || ''}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTimeSlot(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Time Slots */}
          {selectedDate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Times
              </label>
              <div className="grid grid-cols-3 gap-2">
                {generateTimeSlots(selectedDate).map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`py-2 px-4 text-center rounded-md transition-colors ${
                      selectedTimeSlot?.hour === slot.hour && selectedTimeSlot?.minute === slot.minute
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedTimeSlot(slot)}
                    disabled={!slot.available}
                  >
                    {slot.display}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
              placeholder="What would you like to discuss?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          {/* Session Summary */}
          {selectedTimeSlot && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Session Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Professional:</span> {professional.user.firstName} {professional.user.lastName}</p>
                <p><span className="font-medium">Date:</span> {new Date(selectedDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Time:</span> {selectedTimeSlot.display}</p>
                <p><span className="font-medium">Duration:</span> {professional.sessionSettings?.defaultSessionLength || 30} minutes</p>
                <p><span className="font-medium">Cost:</span> ${calculateSessionCost().toFixed(2)}</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="flex justify-between">
            <button 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${(!selectedTimeSlot || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleContinueToPayment}
              disabled={!selectedTimeSlot || loading}
            >
              {loading ? 'Loading...' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Payment Details</h3>
          
          <form onSubmit={handlePayment}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Information
              </label>
              <div className="border border-gray-300 rounded-md p-3">
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full border-none outline-none"
                />
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-gray-900">
                  ${calculateSessionCost().toFixed(2)}
                </span>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="flex justify-between">
              <button 
                type="button" 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </button>
              <button 
                type="submit" 
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? 'opacity-50' : ''}`}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay ${calculateSessionCost().toFixed(2)}`}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {step === 3 && (
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Session Booked Successfully!
            </h3>
            <p className="text-gray-600">
              You'll receive a confirmation email with Zoom meeting details shortly.
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => alert('Navigate to sessions')}
            >
              View My Sessions
            </button>
            <button 
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={onCancel}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

EnhancedBookingForm.propTypes = {
  professional: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default EnhancedBookingForm;