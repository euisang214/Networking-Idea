import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { 
  ClockIcon, 
  CalendarIcon, 
  ChatAlt2Icon,
  CurrencyDollarIcon 
} from '@heroicons/react/outline';
import { Card, Button, Input, Spinner } from '../common';
import { addDays, format, setHours, setMinutes } from 'date-fns';

const BookingForm = ({ professional, onSubmit, isLoading }) => {
  const navigate = useNavigate();
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  // Calculate session cost based on duration and hourly rate
  const calculateCost = (durationMinutes) => {
    if (!professional || !professional.hourly_rate) return 0;
    return (professional.hourly_rate * (durationMinutes / 60)).toFixed(2);
  };
  
  // Validation schema
  const validationSchema = Yup.object({
    date: Yup.date().required('Date is required'),
    time: Yup.string().required('Time is required'),
    duration: Yup.number()
      .required('Duration is required')
      .oneOf([30, 60, 90], 'Invalid duration'),
    topic: Yup.string()
      .required('Topic is required')
      .max(300, 'Topic must be less than 300 characters'),
  });
  
  // Initialize form
  const formik = useFormik({
    initialValues: {
      date: selectedDate,
      time: '',
      duration: 30,
      topic: '',
    },
    validationSchema,
    onSubmit: (values) => {
      const dateTime = new Date(values.date);
      const [hours, minutes] = values.time.split(':');
      dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      // Calculate total cost
      const cost = calculateCost(values.duration);
      
      onSubmit({
        professional_id: professional.id,
        scheduled_at: dateTime.toISOString(),
        duration_minutes: values.duration,
        topic: values.topic,
        cost
      });
    },
  });
  
  // Fetch available slots when date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!professional || !selectedDate) return;
      
      setIsLoadingSlots(true);
      
      try {
        // In a real application, this would call your API
        // For demo purposes, we'll generate some fake available slots
        // Replace this with actual API call
        const tomorrow = addDays(new Date(), 1);
        const dayOfWeek = selectedDate.getDay();
        
        // Simulate API response delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate fake slots based on day of week
        let slots = [];
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
          slots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
            '16:00', '16:30', '17:00'
          ];
        } else { // Weekend
          slots = [
            '10:00', '10:30', '11:00', '11:30',
            '13:00', '13:30', '14:00'
          ];
        }
        
        // Randomly remove some slots to simulate unavailability
        slots = slots.filter(() => Math.random() > 0.3);
        
        setAvailableSlots(slots);
        
        // If there are available slots, set the first one as default
        if (slots.length > 0 && !formik.values.time) {
          formik.setFieldValue('time', slots[0]);
        }
      } catch (error) {
        console.error('Error fetching available slots:', error);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    
    fetchAvailableSlots();
  }, [selectedDate, professional, formik.values.time]);
  
  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
    formik.setFieldValue('date', date);
    formik.setFieldValue('time', '');
  };
  
  return (
    <Card>
      <h3 className="text-lg font-medium text-gray-900">Book a Session</h3>
      <p className="mt-1 text-sm text-gray-500">
        Schedule a virtual session with {professional?.first_name} {professional?.last_name}.
      </p>
      
      {professional && (
        <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={professional.profile_picture || '/images/default-avatar.png'}
              alt={`${professional.first_name} ${professional.last_name}`}
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {professional.first_name} {professional.last_name}
              </p>
              <p className="text-xs text-gray-500">{professional.job_title}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              ${professional.hourly_rate}/hour
            </p>
          </div>
        </div>
      )}
      
      <form onSubmit={formik.handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <DatePicker
                selected={formik.values.date}
                onChange={handleDateChange}
                minDate={addDays(new Date(), 1)}
                maxDate={addDays(new Date(), 30)}
                dateFormat="MMMM d, yyyy"
                className={`block w-full pl-10 pr-3 py-2 border ${
                  formik.touched.date && formik.errors.date
                    ? 'border-danger-300 text-danger-900 focus:ring-danger-500 focus:border-danger-500'
                    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                } rounded-md shadow-sm focus:outline-none sm:text-sm`}
              />
            </div>
            {formik.touched.date && formik.errors.date && (
              <p className="mt-2 text-sm text-danger-600">{formik.errors.date}</p>
            )}
          </div>
          
          {/* Time slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Time
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ClockIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="time"
                value={formik.values.time}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  formik.touched.time && formik.errors.time
                    ? 'border-danger-300 text-danger-900 focus:ring-danger-500 focus:border-danger-500'
                    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                disabled={isLoadingSlots || availableSlots.length === 0}
              >
                {isLoadingSlots ? (
                  <option value="">Loading slots...</option>
                ) : availableSlots.length === 0 ? (
                  <option value="">No slots available</option>
                ) : (
                  <>
                    <option value="">Select a time</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            {formik.touched.time && formik.errors.time && (
              <p className="mt-2 text-sm text-danger-600">{formik.errors.time}</p>
            )}
          </div>
        </div>
        
        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Duration
          </label>
          <div className="mt-1 grid grid-cols-3 gap-3">
            {[30, 60, 90].map((duration) => (
              <div key={duration}>
                <input
                  type="radio"
                  id={`duration-${duration}`}
                  name="duration"
                  value={duration}
                  checked={formik.values.duration === duration}
                  onChange={() => formik.setFieldValue('duration', duration)}
                  className="sr-only"
                />
                <label
                  htmlFor={`duration-${duration}`}
                  className={`flex items-center justify-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium cursor-pointer ${
                    formik.values.duration === duration
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {duration} minutes ${calculateCost(duration)}
                </label>
              </div>
            ))}
          </div>
          {formik.touched.duration && formik.errors.duration && (
            <p className="mt-2 text-sm text-danger-600">{formik.errors.duration}</p>
          )}
        </div>
        
        {/* Topic */}
        <div>
          <Input
            id="topic"
            name="topic"
            type="text"
            label="What would you like to discuss?"
            placeholder="Enter the topics you want to discuss in this session"
            value={formik.values.topic}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.topic && formik.errors.topic}
            required
            icon={<ChatAlt2Icon className="h-5 w-5 text-gray-400" />}
          />
        </div>
        
        {/* Summary */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-base font-medium text-gray-900">Session Summary</h4>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Duration:</span>
              <span className="text-gray-900 font-medium">
                {formik.values.duration} minutes
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rate:</span>
              <span className="text-gray-900 font-medium">
                ${professional?.hourly_rate}/hour
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-900">Total:</span>
              <span className="text-primary-600">
                ${calculateCost(formik.values.duration)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Submit button */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || isLoadingSlots || !formik.values.time || !formik.isValid}
            isLoading={isLoading}
          >
            Book Session
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default BookingForm;
