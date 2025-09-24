import React from 'react';
import ChatBookingForm from './ChatBookingForm';

const BookingForm = ({ onSubmit, loading, editingAppointment = null }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <ChatBookingForm 
        onSubmit={onSubmit} 
        loading={loading} 
        editingAppointment={editingAppointment} 
      />
    </div>
  );
};

export default BookingForm;
