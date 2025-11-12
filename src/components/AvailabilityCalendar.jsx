import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  format, 
  addDays, 
  isSameDay, 
  isBefore, 
  isAfter, 
  startOfWeek, 
  endOfWeek, 
  eachHourOfInterval, 
  setHours, 
  setMinutes, 
  isToday, 
  isPast, 
  parseISO, 
  addWeeks,
  subWeeks,
  isSameHour,
  isSameMinute,
  isWithinInterval,
  setSeconds,
  setMilliseconds,
  addMinutes
} from 'date-fns';
import { supabase } from '../lib/supabase';

const workingHours = [
  '8:00 AM - 8:30 AM',
  '9:00 AM - 9:30 AM',
  '10:00 AM - 10:30 AM',
  '11:00 AM - 11:30 AM',
  '12:00 PM - 12:30 PM',
  '1:00 PM - 1:30 PM',
  '2:00 PM - 2:30 PM'
];

// Time slots that should be shown as breaks (lunch time)
const breakSlots = [
  '11:00 AM - 11:30 AM',
  '12:00 PM - 12:30 PM'
];

// Helper function to check if a time string matches a time range
const isTimeInRange = (time, range) => {
  const [start, end] = range.split(' - ');
  return time >= start && time <= end;
};

// Helper function to parse time string to Date
const parseTimeString = (date, timeStr) => {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return setMinutes(setHours(new Date(date), hours), minutes || 0);
};

// Count appointments for a specific time slot
const countAppointmentsInSlot = (date, time, appointments) => {
  const slotDate = format(date, 'yyyy-MM-dd');
  // Extract just the start time (e.g., '8:00 AM' from '8:00 AM - 8:30 AM')
  const [startTime] = time.split(' - ');
  
  return appointments.filter(apt => {
    // Check if the appointment is on the same date
    if (apt.date !== slotDate) return false;
    
    // Extract the start time from the appointment's time slot
    const [aptStartTime] = apt.time.split(' - ');
    
    // Compare just the start times
    return aptStartTime === startTime;
  }).length;
};

// Count total appointments for a specific day
const countAppointmentsForDay = (date, appointments) => {
  const slotDate = format(date, 'yyyy-MM-dd');
  return appointments.filter(apt => apt.date === slotDate).length;
};

// Check if a time slot is fully booked (3 or more cars)
const isSlotBooked = (date, time, appointments) => {
  const count = countAppointmentsInSlot(date, time, appointments);
  console.log(`Slot ${date} ${time} has ${count} appointments`);
  return count >= 8;
};

// Check if a day is fully booked (5 or more cars)
const isDayFullyBooked = (date, appointments) => {
  return countAppointmentsForDay(date, appointments) >= 35;
};

// Current time indicator component
const CurrentTimeIndicator = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  // Calculate position based on the exact time slots
  const timeSlotHeights = {
    '8:00 AM - 8:30 AM': 0,
    '9:00 AM - 9:30 AM': 60,  // 60 minutes after first slot
    '10:00 AM - 10:30 AM': 120,  // 2 hours after first slot
    '1:00 PM - 1:30 PM': 300,    // 5 hours after first slot (accounting for lunch break)
    '2:00 PM - 2:30 PM': 390     // 6.5 hours after first slot
  };
  const currentTimeStr = format(currentTime, 'h:mm a');
  let currentSlot = workingHours.find(slot => {
    const [start] = slot.split(' - ');
    return currentTimeStr >= start;
  }) || workingHours[0];
  const topPosition = timeSlotHeights[currentSlot] || 0;
  
  return (
    <div 
      className="absolute left-0 right-0 h-px bg-red-500 z-10"
      style={{ top: `${topPosition}px` }}
    >
      <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
      <div className="absolute -right-2 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
    </div>
  );
};

const AvailabilityCalendar = ({ selectedDate, selectedTime, onDateSelect, onTimeSelect }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const calendarRef = useRef(null);
  
  // Fetch appointments from Supabase
  const fetchAppointments = useCallback(async () => {
    try {
      console.log('Fetching appointments from Supabase...');
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      
      // Log raw data from Supabase
      console.log('Raw data from Supabase:', data);
      
      // Transform the data to match the expected format
      const formattedAppointments = data.map(appt => {
        // Format time to match the workingHours format (e.g., '8:00 AM - 8:30 AM')
        const startTime = format(parseISO(`${appt.appointment_date}T${appt.appointment_time}`), 'h:mm a');
        const endTime = format(addMinutes(parseISO(`${appt.appointment_date}T${appt.appointment_time}`), 30), 'h:mm a');
        const timeSlot = `${startTime} - ${endTime}`;
        
        const formattedAppt = {
          id: appt.id,
          date: format(parseISO(appt.appointment_date), 'yyyy-MM-dd'),
          time: timeSlot,
          status: appt.status || 'pending',
          service: appt.service_type || 'Service',
          full_name: appt.full_name,
          phone: appt.phone,
          email: appt.email,
          vehicle_make: appt.vehicle_make,
          vehicle_model: appt.vehicle_model,
          car_number: appt.car_number
        };
        console.log('Formatted appointment:', formattedAppt);
        return formattedAppt;
      });

      console.log('Fetched appointments:', formattedAppointments);
      setAppointments(formattedAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
      console.error('Error details:', err.message, err.stack);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription...');
    // Initial fetch
    fetchAppointments();

    // Debug: Log current state
    console.log('Initial appointments state:', appointments);
    console.log('Current week start:', currentWeekStart);

    // Set up real-time subscription
    const subscription = supabase
      .channel('appointments_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments' 
        }, 
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAppointments]);

  // Generate days of the current week
  const daysOfWeek = [];
  for (let i = 0; i < 7; i++) {
    daysOfWeek.push(addDays(currentWeekStart, i));
  }
  
  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };
  
  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };
  
  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date()));
  };
  
  // Handle slot click
  const handleSlotClick = (date, time) => {
    const slotDate = format(date, 'yyyy-MM-dd');
    const slotDateTime = parseTimeString(slotDate, time);
    
    // Don't allow booking in the past or during breaks
    if (isPast(slotDateTime) || isBreakTime(time) || isSunday(date)) return;
    
    // Don't allow booking if already booked
    if (isSlotBooked(slotDate, time, appointments)) return;
    
    setSelectedSlot({ date: slotDate, time });
    onDateSelect(slotDate);
    
    // Extract just the start time (e.g., '8:00 AM' from '8:00 AM - 8:30 AM')
    const timePart = time.split(' - ')[0];
    onTimeSelect(timePart);
  };
  
  // Check if current time is within the visible week
  const isCurrentWeekVisible = isWithinInterval(new Date(), {
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6)
  });
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading appointments...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log current state before rendering
  console.log('Rendering calendar with appointments:', appointments);
  console.log('Current week start:', currentWeekStart);
  console.log('Loading state:', loading);
  console.log('Error state:', error);

  // Debug: Log current state before rendering
  console.log('Current appointments state:', appointments);
  console.log('Current week days:', daysOfWeek.map(d => format(d, 'yyyy-MM-dd')));

  // Render day headers (Mon, Tue, etc.)
  const renderDayHeaders = () => {
    return (
      <div className="grid grid-cols-8 border-b border-gray-200 text-xs sm:text-sm">
        <div className="p-1 sm:p-2 text-xs sm:text-sm font-medium text-gray-500">Time</div>
        {daysOfWeek.map((day, index) => {
          const dayNumber = format(day, 'd');
          const isDayToday = isToday(day);
          const isDaySelected = selectedDate && isSameDay(parseISO(selectedDate), day);
          
          return (
            <div 
              key={index} 
              className={`p-1 sm:p-2 text-center ${isDayToday ? 'text-[#EB0A1E] font-semibold' : 'text-gray-700'}`}
            >
              <div className="text-xs sm:text-sm font-medium">{format(day, 'EEE')}</div>
              <div 
                className={`mx-auto w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs sm:text-base ${
                  isDaySelected ? 'bg-[#EB0A1E] text-white' : ''
                } ${isDayToday && !isDaySelected ? 'border border-[#EB0A1E]' : ''}`}
              >
                {dayNumber}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Check if a day is Sunday
  const isSunday = (date) => {
    return date.getDay() === 0; // 0 is Sunday in JavaScript Date
  };

  // Check if a time slot is during break/lunch
  const isBreakTime = (time) => {
    return breakSlots.includes(time);
  };

  // Render time slots
  const renderTimeSlots = () => {
    // Format time for display (shorter on mobile)
    const formatTimeForDisplay = (timeStr) => {
      if (window.innerWidth < 640) { // sm breakpoint
        const [start, end] = timeStr.split(' - ');
        return `${start.replace(' ', '')}`; // e.g., "8:00AM"
      }
      return timeStr;
    };

    return (
      <div className="relative text-xs sm:text-sm">
        {isCurrentWeekVisible && <CurrentTimeIndicator />}
        
        {workingHours.map((time, timeIndex) => (
          <div key={timeIndex} className="grid grid-cols-8 border-b border-gray-100">
            <div className="p-1 sm:p-2 text-gray-500 border-r border-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
              {formatTimeForDisplay(time)}
            </div>
            
            {daysOfWeek.map((day, dayIndex) => {
              const slotDate = format(day, 'yyyy-MM-dd');
              const slotDateTime = parseTimeString(slotDate, time);
              const appointmentsInSlot = countAppointmentsInSlot(slotDate, time, appointments);
              const isBooked = isSlotBooked(slotDate, time, appointments);
              const isDayFull = isDayFullyBooked(day, appointments);
              const isSunday = day.getDay() === 0;
              const isBreak = isBreakTime(time);
              const isInPast = isPast(slotDateTime) || isSunday || isBreak;
              const isSelected = selectedDate && selectedTime && 
                               selectedDate === slotDate && 
                               selectedTime === time;
              
              let slotClass = 'p-4 border-r border-gray-100';
              
              if (isDayFull) {
                slotClass += ' bg-red-100 text-red-800 cursor-not-allowed';
              } else if (isSunday || isBreak) {
                slotClass += ' bg-gray-50 text-gray-400';
              } else if (isBooked || isInPast) {
                slotClass += ' bg-red-50 text-red-800 cursor-not-allowed';
              } else if (isSelected) {
                slotClass += ' bg-green-100 border-2 border-green-500 cursor-pointer';
              } else {
                slotClass += ' bg-green-50 hover:bg-green-100 cursor-pointer';
              }
              
              return (
                <div 
                  key={`${dayIndex}-${timeIndex}`}
                  className={slotClass}
                  onClick={() => handleSlotClick(day, time)}
                >
                  {isDayFull ? (
                    <div className="text-xs text-center text-red-800 font-medium">Fully Booked</div>
                  ) : isSunday ? (
                    <div className="h-4"></div>
                  ) : isBooked ? (
                    <div className="text-xs text-center">
                      Booked
                    </div>
                  ) : isInPast ? (
                    <div className="h-4"></div>
                  ) : (
                    <div className="h-4"></div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };
  
  // Render navigation controls
  const renderNavigation = () => {
    const weekRange = `${format(currentWeekStart, 'MMM d')} - ${format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}`;
    const isMobile = window.innerWidth < 640; // sm breakpoint
    
    return (
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-4 mb-4">
        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2">
          <button 
            onClick={goToPreviousWeek}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-full"
            aria-label="Previous week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={goToToday}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-[#EB0A1E] hover:bg-gray-100 rounded-md whitespace-nowrap"
          >
            Today
          </button>
          <button 
            onClick={goToNextWeek}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-full"
            aria-label="Next week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="text-sm sm:text-base md:text-lg font-medium text-center sm:text-left whitespace-nowrap">
          {isMobile ? (
            <span>{format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'd')}</span>
          ) : (
            <span>{weekRange}</span>
          )}
        </div>
        
        <button 
          onClick={() => {}}
          className="hidden sm:inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-[#EB0A1E] text-white text-xs sm:text-sm font-medium rounded-md hover:bg-red-700 whitespace-nowrap"
        >
          {isMobile ? 'Book' : 'Book Appointment'}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white p-2 sm:p-4 md:p-6 rounded-lg w-full" ref={calendarRef}>
      {renderNavigation()}
      <div className="overflow-x-auto w-full">
        <div className="min-w-[600px] md:min-w-0">
          {renderDayHeaders()}
          {renderTimeSlots()}
        </div>
      </div>
      
      {/* Legend - Always horizontal */}
      <div className="mt-4 md:mt-6 flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-50 border border-green-200 mr-1 sm:mr-2"></div>
          <span className="whitespace-nowrap text-xs sm:text-sm">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-50 border border-red-200 mr-1 sm:mr-2"></div>
          <span className="whitespace-nowrap text-xs sm:text-sm">Booked</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white border border-gray-200 text-gray-300 flex items-center justify-center mr-1 sm:mr-2">
            <span className="text-xs">—</span>
          </div>
          <span className="whitespace-nowrap text-xs sm:text-sm">Past</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border-2 border-green-500 mr-1 sm:mr-2"></div>
          <span className="whitespace-nowrap text-xs sm:text-sm">Selected</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
