import React, { useState } from 'react';

// Custom chevron down SVG component
const ChevronDown = ({ className }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor"
    aria-hidden="true"
  >
    <path 
      fillRule="evenodd" 
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" 
      clipRule="evenodd" 
    />
  </svg>
);

const Details = ({ formData, onFormChange }) => {
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  
  // Regions and branches for Ghana
  const regions = [
    { id: 'greater-accra', name: 'Greater Accra' },
    { id: 'ashanti', name: 'Ashanti' },
    { id: 'western', name: 'Western' },
    { id: 'volta', name: 'Volta' },
  ];

  const branches = {
    'greater-accra': [
      { id: 'accra', name: 'Accra Branch' },
      { id: 'east-legon', name: 'Legon Branch' },
      { id: 'spintex', name: 'Motoway Branch' },
    ],
    'ashanti': [
      { id: 'kumasi-central', name: 'Kumasi Branch' },
      { id: 'kumasi-central', name: 'KumasBranch' },
    ],
    'western': [
      { id: 'takoradi', name: 'Takoradi Branch' },
    ],
    'volta': [
      { id: 'ho', name: 'Ho Workshop' },
    ],
  };

  const selectedBranches = formData.region ? branches[formData.region] || [] : [];
  
  // Ensure branch is cleared when region changes
  React.useEffect(() => {
    if (formData.region && !branches[formData.region]?.some(b => b.id === formData.branch)) {
      onFormChange('branch', '');
    }
  }, [formData.region, formData.branch, onFormChange]);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsRegionOpen(false);
        setIsBranchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Personal Information Section */}
      <div className="relative">
        <h3 className="text-xl font-bold text-[#EB0A1E] mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => onFormChange('fullName', e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                placeholder="John Doe"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="relative">
              <input
                type="tel"
                value={formData.phoneNo}
                onChange={(e) => onFormChange('phoneNo', e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                placeholder="0500009000"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="relative">
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => onFormChange('email', e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                placeholder="your.email@example.com"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Information Section */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white/90 relative pl-1 pr-1">
        <div className="absolute inset-0 border-l-4 border-[#EB0A1E] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <h3 className="text-xl font-bold text-[#EB0A1E] mb-4">
          Vehicle Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Make
              </label>
              <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.vehicleMake}
                onChange={(e) => onFormChange('vehicleMake', e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                placeholder="Toyota"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Model
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.vehicleModel}
                onChange={(e) => onFormChange('vehicleModel', e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                placeholder="Camry"
              />
              
            </div>
          </div>
          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VIN/Chassis Number
              </label>
              <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => onFormChange('vin', e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                placeholder="2020"
                required
              />
              
            </div>
          </div>
          <div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Car Number
              </label>
              <span className="text-red-500 ml-1">*</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.carNo}
                onChange={(e) => onFormChange('carNo', e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                placeholder="ABC 1234"
                required
              />
              
            </div>
          </div>
        </div>
      </div>

      {/* Region and Branch Section */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white/90 relative" style={{ zIndex: 10 }}>
        <div className="absolute inset-0 border-l-4 border-[#EB0A1E] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <h3 className="text-xl font-bold text-[#EB0A1E]  pl-1 pr-1 mb-4">
          Service Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="dropdown-container relative">
            <label className="block text-sm font-medium text-gray-700 mb-2" id="region-label">
              Select Region
            </label>
            <div className="relative">
              <div className="mt-1 relative">
                <button
                  type="button"
                  onClick={() => setIsRegionOpen(!isRegionOpen)}
                  className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-[#EB0A1E] focus:border-[#EB0A1E] sm:text-sm"
                  aria-haspopup="listbox"
                  aria-expanded={isRegionOpen}
                  aria-labelledby="region-label"
                >
                  <span className="block truncate">
                    {formData.region ? regions.find(r => r.id === formData.region)?.name : 'Select a region'}
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </span>
                </button>

                {isRegionOpen && (
                  <ul
                    className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                    tabIndex="-1"
                    role="listbox"
                    aria-labelledby="region-label"
                  >
                    {regions.map((region) => (
                      <li
                        key={region.id}
                        className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-red-50"
                        id={`region-option-${region.id}`}
                        role="option"
                        onClick={() => {
                          onFormChange('region', region.id);
                          setIsRegionOpen(false);
                        }}
                      >
                        <div className="flex items-center">
                          <span className={`block truncate ${formData.region === region.id ? 'font-semibold' : 'font-normal'}`}>
                            {region.name}
                          </span>
                        </div>
                        {formData.region === region.id && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#EB0A1E]">
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="dropdown-container relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Branch
            </label>
            <div className="relative">
              <div className="mt-1 relative">
                <button
                  type="button"
                  onClick={() => formData.region && setIsBranchOpen(!isBranchOpen)}
                  disabled={!formData.region}
                  className={`relative w-full bg-white border ${
                    formData.region ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                  } rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-[#EB0A1E] focus:border-[#EB0A1E] sm:text-sm`}
                  aria-haspopup="listbox"
                  aria-expanded={isBranchOpen}
                  aria-labelledby="branch-label"
                >
                  <span className="block truncate">
                    {formData.branch && selectedBranches.length > 0 
                      ? selectedBranches.find(b => b.id === formData.branch)?.name 
                      : 'Select a branch'}
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className={`h-5 w-5 ${formData.region ? 'text-gray-400' : 'text-gray-300'}`} />
                  </span>
                </button>

                {isBranchOpen && selectedBranches.length > 0 && (
                  <ul
                    className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                    tabIndex="-1"
                    role="listbox"
                    aria-labelledby="branch-label"
                  >
                    {selectedBranches.map((branch) => (
                      <li
                        key={branch.id}
                        className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-red-50"
                        id={`branch-option-${branch.id}`}
                        role="option"
                        onClick={() => {
                          onFormChange('branch', branch.id);
                          setIsBranchOpen(false);
                        }}
                      >
                        <div className="flex items-center">
                          <span className={`block truncate ${formData.branch === branch.id ? 'font-semibold' : 'font-normal'}`}>
                            {branch.name}
                          </span>
                        </div>
                        {formData.branch === branch.id && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#EB0A1E]">
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;
