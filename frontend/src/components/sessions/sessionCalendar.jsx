import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Calendar } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const SessionCalendar = ({ professional, selectedDate, onDateSelect }) => {
  // Get array of day indices that the professional is available
  const availableDays = professional.availability
    ? professional.availability.map(a => {
        // Convert day string to day index (0 = Sunday, 6 = Saturday)
        const dayMap = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6
        };
        return dayMap[a.day.toLowerCase()];
      })
    : [];
  
  // Disable dates in the past and days the professional is not available
  const disabledDay = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable dates in the past
    if (date < today) {
      return true;
    }
    
    // Disable days the professional is not available
    const dayOfWeek = date.getDay();
    return !availableDays.includes(dayOfWeek);
  };
  
  return (
    <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <Calendar
        date={selectedDate}
        onChange={onDateSelect}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)} // 90 days from now
        disabledDay={disabledDay}
        color="#2563EB" // Blue color for selection
        className="w-full"
      />
    </div>
  );
};

SessionCalendar.propTypes = {
  professional: PropTypes.object.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  onDateSelect: PropTypes.func.isRequired
};

export default SessionCalendar;