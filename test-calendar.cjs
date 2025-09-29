// Simple test to verify calendar component
console.log('Testing calendar component...');

// Test if the calendar ID is correct
const STARS_VACATION_CALENDAR_ID = 'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';
console.log('Calendar ID:', STARS_VACATION_CALENDAR_ID);

// Test calendar URL generation
const getCalendarUrl = () => {
  return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(STARS_VACATION_CALENDAR_ID)}&ctz=Europe%2FMonaco`;
};

console.log('Calendar URL:', getCalendarUrl());

// Test if we can access the calendar
fetch('https://calendar.google.com/calendar/embed?src=' + encodeURIComponent(STARS_VACATION_CALENDAR_ID))
  .then(response => {
    console.log('Calendar access test:', response.status);
  })
  .catch(error => {
    console.log('Calendar access error:', error.message);
  }); 