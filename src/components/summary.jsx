import React from 'react'

const summary = ({ formData, selectedServices = [], selectedDate, selectedTime, onBooking }) => {
  // Booking Summary Component
    return (
      <div className="border border-gray-200 p-6 rounded-lg">
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Vehicle:</span>
            <span className="font-medium text-gray-900">{formData.vehicleMake} {formData.vehicleModel} ({formData.year})</span>
          </div>
          
          <div className="py-2 border-b border-gray-100">
            <div className="text-gray-700 mb-2">Services:</div>
            <ul className="space-y-1">
              {selectedServices.length > 0 ? (
                selectedServices.map((service, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EB0A1E] mr-2"></span>
                    <span className="text-gray-900">{service}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No services selected</li>
              )}
            </ul>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Date:</span>
            <span className="font-medium text-gray-900">{selectedDate || 'Not selected'}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Time:</span>
            <span className="font-medium text-gray-900">{selectedTime || 'Not selected'}</span>
          </div>
        </div>
  
        <button
          onClick={onBooking}
          className="w-full bg-[#EB0A1E] hover:bg-[#D0091A] active:bg-[#B80716] text-white font-semibold py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#EB0A1E] focus:ring-offset-2"
        >
          Book Appointment
        </button>
      </div>
    );
  };
  
export default summary