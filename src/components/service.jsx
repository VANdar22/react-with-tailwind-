import React from 'react';

const Service = ({ selectedServices = [], onServiceChange }) => {
  const services = [
    { id: 'parts-replacement', name: 'Parts Replacement' },
    { id: 'brake-service', name: 'Reppair works' },
    { id: 'maintenance', name: 'Periodic Maintenance' },
    { id: 'battery-check', name: 'Battery Check' },
    { id: 'diagnostics', name: 'Diagnosis' }
  ];

  const handleServiceToggle = (serviceName) => {
    const newSelectedServices = [...selectedServices];
    const serviceIndex = newSelectedServices.indexOf(serviceName);
    
    if (serviceIndex === -1) {
      // Add service if not already selected
      newSelectedServices.push(serviceName);
    } else {
      // Remove service if already selected
      newSelectedServices.splice(serviceIndex, 1);
    }
    
    onServiceChange(newSelectedServices);
  };

  return (
    <div className="w-full">
      <div className="space-y-3">
        <fieldset>
          <legend className="sr-only">Select services</legend>
          <div className="space-y-2">
            {services.map((service) => {
              const isSelected = selectedServices.includes(service.name);
              return (
                <div key={service.id} className="relative flex items-start">
                  <label 
                    htmlFor={service.id} 
                    className="flex items-center space-x-2 cursor-pointer group w-full"
                  >
                    <input
                      id={service.id}
                      name="services"
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleServiceToggle(service.name)}
                      className="sr-only"
                    />
                    <div className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                      isSelected 
                        ? 'border-[#EB0A1E] bg-[#EB0A1E]' 
                        : 'border-gray-300 group-hover:border-[#EB0A1E]'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{service.name}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
        {selectedServices.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Selected Services:</p>
            <ul className="mt-1 text-sm text-gray-600">
              {selectedServices.map((service, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EB0A1E] mr-2"></span>
                  {service}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Service;