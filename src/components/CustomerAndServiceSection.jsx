import React from 'react';
import DetailsForm from './details';
import ServiceSelection from './service';

const CustomerAndServiceSection = ({ 
  formData, 
  onFormChange, 
  selectedServices = [], 
  onServiceChange 
}) => {
  return (
    <div className="bg-white p-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Customer Details */}
        <div className="space-y-4">
          <div className="p-0">
            <DetailsForm formData={formData} onFormChange={onFormChange} />
          </div>
        </div>
        
        {/* Right Column - Service Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-[#EB0A1E] mb-4">Service Details</h3>
          <div className="p-0 h-full">
            <ServiceSelection 
              selectedServices={selectedServices}
              onServiceChange={onServiceChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAndServiceSection;
