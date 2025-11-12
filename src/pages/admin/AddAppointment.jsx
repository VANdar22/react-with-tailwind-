import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { FiUser, FiMail, FiPhone, FiTruck, FiCalendar, FiClock, FiFileText } from 'react-icons/fi';

export default function AddAppointment({ appointmentToEdit, onSuccess, onCancel }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(appointmentToEdit || {
    full_name: '',
    email: '',
    phone: '',
    vehicle_make: '',
    vehicle_model: '',
    car_number: '',
    service_type: ['maintenance'], // Initialize as array
    region: 'greater-accra', // Default region
    branch: '', // Will be set based on region
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    appointment_time: '09:00'
  });
  
  // Available regions with their branches
  const regionsData = [
    {
      value: 'greater-accra',
      label: 'Greater Accra',
      branches: [
        { value: 'accra-central', label: 'Accra Central' },
        { value: 'east-legon', label: 'East Legon' },
        { value: 'spintex', label: 'Spintex' },
        { value: 'tema', label: 'Tema' },
        { value: 'madina', label: 'Madina' }
      ]
    },
    {
      value: 'ashanti',
      label: 'Ashanti',
      branches: [
        { value: 'kumasi-central', label: 'Kumasi Central' },
        { value: 'asantemansu', label: 'Asante-Manso' },
        { value: 'suame', label: 'Suame' },
        { value: 'tanoso', label: 'Tanoso' }
      ]
    },
    {
      value: 'eastern',
      label: 'Eastern',
      branches: [
        { value: 'koforidua', label: 'Koforidua' },
        { value: 'nsawam', label: 'Nsawam' },
        { value: 'suhum', label: 'Suhum' }
      ]
    },
    {
      value: 'western',
      label: 'Western',
      branches: [
        { value: 'takoradi', label: 'Takoradi' },
        { value: 'tarkwa', label: 'Tarkwa' },
        { value: 'sekondi', label: 'Sekondi' }
      ]
    },
    {
      value: 'central',
      label: 'Central',
      branches: [
        { value: 'cape-coast', label: 'Cape Coast' },
        { value: 'winneba', label: 'Winneba' },
        { value: 'elmina', label: 'Elmina' }
      ]
    },
    {
      value: 'volta',
      label: 'Volta',
      branches: [
        { value: 'ho', label: 'Ho' },
        { value: 'hohoe', label: 'Hohoe' },
        { value: 'keta', label: 'Keta' }
      ]
    },
    {
      value: 'northern',
      label: 'Northern',
      branches: [
        { value: 'tamale', label: 'Tamale' },
        { value: 'yendi', label: 'Yendi' },
        { value: 'savelugu', label: 'Savelugu' }
      ]
    },
    {
      value: 'upper-east',
      label: 'Upper East',
      branches: [
        { value: 'bolgatanga', label: 'Bolgatanga' },
        { value: 'navrongo', label: 'Navrongo' }
      ]
    },
    {
      value: 'upper-west',
      label: 'Upper West',
      branches: [
        { value: 'wa', label: 'Wa' },
        { value: 'tumu', label: 'Tumu' }
      ]
    },
    {
      value: 'bono',
      label: 'Bono',
      branches: [
        { value: 'sunyani', label: 'Sunyani' },
        { value: 'wenchi', label: 'Wenchi' }
      ]
    },
    {
      value: 'bono-east',
      label: 'Bono East',
      branches: [
        { value: 'techiman', label: 'Techiman' },
        { value: 'kintampo', label: 'Kintampo' }
      ]
    },
    {
      value: 'ahafo',
      label: 'Ahafo',
      branches: [
        { value: 'goaso', label: 'Goaso' },
        { value: 'bechem', label: 'Bechem' }
      ]
    },
    {
      value: 'savannah',
      label: 'Savannah',
      branches: [
        { value: 'damongo', label: 'Damongo' },
        { value: 'buipe', label: 'Buipe' }
      ]
    },
    {
      value: 'north-east',
      label: 'North East',
      branches: [
        { value: 'nalerigu', label: 'Nalerigu' },
        { value: 'gambaga', label: 'Gambaga' }
      ]
    },
    {
      value: 'oti',
      label: 'Oti',
      branches: [
        { value: 'dambai', label: 'Dambai' },
        { value: 'jasikan', label: 'Jasikan' }
      ]
    },
    {
      value: 'western-north',
      label: 'Western North',
      branches: [
        { value: 'sefwi-wiawso', label: 'Sefwi Wiawso' },
        { value: 'enchi', label: 'Enchi' }
      ]
    }
  ];
  
  // Get branches for the selected region
  const selectedRegion = regionsData.find(r => r.value === formData.region) || { branches: [] };
  const branches = selectedRegion.branches || [];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const serviceTypes = [
    { value: 'maintenance', label: 'Periodic Maintenance' },
    { value: 'repair', label: 'Repair Work' },
    { value: 'diagnostics', label: 'Diagnostics' },
    { value: 'tire_service', label: 'Tire Service' },
    { value: 'battery', label: 'Battery Check/Replacement' },
    { value: 'other', label: 'Other Service' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'service_type') {
      setFormData(prev => {
        // If the service type is already in the array, remove it, otherwise add it
        const newServiceTypes = prev.service_type.includes(value)
          ? prev.service_type.filter(type => type !== value)
          : [...prev.service_type, value];
          
        // Ensure at least one service type is selected
        if (newServiceTypes.length === 0) {
          return prev;
        }
        
        return {
          ...prev,
          service_type: newServiceTypes
        };
      });
    } else if (name === 'region') {
      // When region changes, reset the branch
      setFormData(prev => ({
        ...prev,
        region: value,
        branch: '' // Reset branch when region changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // If editing an existing appointment
      if (appointmentToEdit) {
        const { error: updateError } = await supabase
          .from('appointments')
          .update(formData)
          .eq('id', appointmentToEdit.id);

        if (updateError) throw updateError;
        
        if (onSuccess) onSuccess();
        return;
      }

      // If creating a new appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      setSuccess('Appointment created successfully!');
      
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        vehicle_make: '',
        vehicle_model: '',
        car_number: '',
        service_type: ['maintenance'],
        region: 'greater-accra',
        branch: '',
        appointment_date: format(new Date(), 'yyyy-MM-dd'),
        appointment_time: '09:00'
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1500);
      
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
          <p>{success}</p>
        </div>
      )}

      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <div className="relative">
          <h3 className="text-xl font-bold text-[#EB0A1E] mb-4">
            Customer Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {/* Full Name */}
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
                  id="full_name"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                  placeholder="John Doe"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                  placeholder="john@example.com"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Phone Number */}
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
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                  placeholder="+233 XX XXX XXXX"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiPhone className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Information Section */}
        <div className="relative">
          <h3 className="text-xl font-bold text-[#EB0A1E] mb-4">
            Vehicle Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {/* Vehicle Make */}
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
                  id="vehicle_make"
                  name="vehicle_make"
                  required
                  value={formData.vehicle_make}
                  onChange={handleChange}
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                  placeholder="e.g., Toyota"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiTruck className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Vehicle Model */}
            <div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Model
                </label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="vehicle_model"
                  name="vehicle_model"
                  required
                  value={formData.vehicle_model}
                  onChange={handleChange}
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                  placeholder="e.g., Corolla"
                />
              </div>
            </div>

            {/* Region */}
            <div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="relative">
                <select
                  id="region"
                  name="region"
                  required
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 bg-transparent appearance-none"
                >
                  {regionsData.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Branch Selection */}
            <div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="relative">
                <select
                  id="branch"
                  name="branch"
                  required
                  value={formData.branch}
                  onChange={handleChange}
                  disabled={!formData.region}
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 bg-transparent appearance-none disabled:opacity-50"
                >
                  <option value="">Select a branch</option>
                  {branches.map((branch) => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {!formData.region && (
                  <p className="mt-1 text-xs text-gray-500">Please select a region first</p>
                )}
              </div>
            </div>

            {/* License Plate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Plate Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="car_number"
                  name="car_number"
                  value={formData.car_number}
                  onChange={handleChange}
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 placeholder-gray-400"
                  placeholder="e.g., GT 1234-20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Service Information Section */}
        <div className="relative">
          <h3 className="text-xl font-bold text-[#EB0A1E] mb-4">
            Service Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {/* Service Type */}
            <div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="relative">
                <div className="space-y-2">
                  {serviceTypes.map((type) => (
                    <label key={type.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="service_type"
                        value={type.value}
                        checked={formData.service_type.includes(type.value)}
                        onChange={handleChange}
                        className="h-4 w-4 text-[#EB0A1E] focus:ring-[#EB0A1E] border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Appointment Date */}
            <div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date
                </label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="relative">
                <input
                  type="date"
                  id="appointment_date"
                  name="appointment_date"
                  required
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={formData.appointment_date}
                  onChange={handleChange}
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 appearance-none"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Appointment Time */}
            <div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Time
                </label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="relative">
                <select
                  id="appointment_time"
                  name="appointment_time"
                  required
                  value={formData.appointment_time}
                  onChange={handleChange}
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-[#EB0A1E] focus:ring-0 focus:outline-none transition-colors duration-200 bg-transparent appearance-none"
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const hour = 8 + i; // 8 AM to 5 PM
                    const time = `${hour.toString().padStart(2, '0')}:00`;
                    return (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiClock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>


      </form>
      
      {/* Form Actions */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="appointment-form"
          disabled={isSubmitting}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#EB0A1E] hover:bg-[#D0091B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EB0A1E] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Appointment'}
        </button>
      </div>
    </div>
  );
}
