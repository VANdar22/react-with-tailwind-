import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AppointmentsList from './AppointmentsList';
import { startOfDay, endOfDay, parseISO, isToday } from 'date-fns';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import ProfileDropdown from '../../components/admin/ProfileDropdown';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    vehicle_make: '',
    vehicle_model: '',
    car_number: '',
    service_type: '',
    appointment_date: '',
    appointment_time: '',
    status: 'pending',
    notes: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    today: 0,
    completed: 0,
    canceled: 0
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open edit modal with appointment data
  const handleEditClick = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      full_name: appointment.full_name || '',
      phone: appointment.phone || '',
      email: appointment.email || '',
      vehicle_make: appointment.vehicle_make || '',
      vehicle_model: appointment.vehicle_model || '',
      car_number: appointment.car_number || '',
      service_type: appointment.service_type || '',
      appointment_date: appointment.appointment_date || '',
      appointment_time: appointment.appointment_time || '',
      status: appointment.status || 'pending',
      notes: appointment.notes || ''
    });
    setShowEditModal(true);
  };

  // Save edited appointment
  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const updates = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', editingAppointment.id);

      if (error) throw error;

      setShowEditModal(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment? This cannot be undone.')) {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', id);

        if (error) throw error;

        fetchAppointments();
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Failed to delete appointment');
      } finally {
        setLoading(false);
      }
    }
  };



  // Calculate statistics from appointments data
  const calculateStats = (appointments) => {
    console.log('Calculating stats for appointments:', appointments);
    if (!appointments || !Array.isArray(appointments)) {
      console.log('No valid appointments data, returning zero stats');
      return { total: 0, pending: 0, today: 0, completed: 0, canceled: 0 };
    }
    
    const now = new Date();
    const todayString = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    console.log('Today string for comparison:', todayString);
    
    const stats = appointments.reduce((acc, appt) => {
      if (!appt) return acc;
      
      console.log('Processing appointment:', {
        id: appt.id,
        status: appt.status,
        date: appt.appointment_date,
        isToday: appt.appointment_date === todayString
      });
      
      const isAppointmentToday = appt.appointment_date === todayString;
      
      return {
        total: acc.total + 1,
        pending: appt.status === 'pending' ? acc.pending + 1 : acc.pending,
        today: isAppointmentToday ? acc.today + 1 : acc.today,
        completed: appt.status === 'completed' ? acc.completed + 1 : acc.completed,
        canceled: appt.status === 'canceled' ? acc.canceled + 1 : acc.canceled,
      };
    }, { total: 0, pending: 0, today: 0, completed: 0, canceled: 0 });
    
    console.log('Final calculated stats:', stats);
    return stats;
  };

  // Fetch appointments from Supabase
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      console.log('Fetching appointments...');
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      
      if (error) throw error;
      
      console.log('Fetched appointments:', data);
      setAppointments(data || []);
      const newStats = calculateStats(data || []);
      console.log('Calculated stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription with error handling
  useEffect(() => {
    console.log('Setting up real-time subscription...');
    let subscription;
    
    const setupSubscription = async () => {
      try {
        console.log('Performing initial fetch...');
        await fetchAppointments();
        
        console.log('Setting up real-time channel...');
        subscription = supabase.channel('dashboard_changes')
          .on('postgres_changes', 
            { 
              event: '*',
              schema: 'public',
              table: 'appointments'
            },
            (payload) => {
              console.log('Change received in real-time:', {
                event: payload.eventType,
                table: payload.table,
                new: payload.new,
                old: payload.old
              });
              fetchAppointments();
            }
          )
          .subscribe((status, err) => {
            console.log('Subscription status:', status);
            if (err) console.error('Subscription error:', err);
            if (status === 'CHANNEL_ERROR') {
              console.error('Channel error - attempting to resubscribe...');
              setTimeout(setupSubscription, 1000);
            } else if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to real-time updates');
            }
          });
          
      } catch (error) {
        console.error('Error in setupSubscription:', error);
        // Retry after a delay if there's an error
        console.log('Retrying subscription setup in 2 seconds...');
        setTimeout(setupSubscription, 2000);
      }
    };
    
    setupSubscription();
    
    return () => {
      if (subscription) {
        console.log('Cleaning up real-time subscription');
        supabase.removeChannel(subscription).then(() => {
          console.log('Successfully unsubscribed');
        }).catch(err => {
          console.error('Error unsubscribing:', err);
        });
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
            <h1 className="text-2xl font-bold text-[#EB0A1E]">Admin Dashboard</h1>
          </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/appointments/new"
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                New Appointment
              </Link>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-[#EB0A1E]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <svg className="h-6 w-6 text-[#EB0A1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Today</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.today}</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Completed</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden transition-shadow duration-200 hover:shadow-lg">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div></div>
            </div>
          </div>
          <AppointmentsList isEmbedded={true} onStatusChange={fetchAppointments} />
        </div>
      </div>

      {/* Edit Appointment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Edit Appointment</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSaveAppointment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Make</label>
                    <input
                      type="text"
                      name="vehicle_make"
                      value={formData.vehicle_make}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Model</label>
                    <input
                      type="text"
                      name="vehicle_model"
                      value={formData.vehicle_model}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Plate</label>
                    <input
                      type="text"
                      name="car_number"
                      value={formData.car_number}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service Type</label>
                    <select
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a service</option>
                      <option value="Oil Change">Oil Change</option>
                      <option value="Tire Rotation">Tire Rotation</option>
                      <option value="Brake Service">Brake Service</option>
                      <option value="Battery Check">Battery Check</option>
                      <option value="General Inspection">General Inspection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
                    <input
                      type="date"
                      name="appointment_date"
                      value={formData.appointment_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Appointment Time</label>
                    <input
                      type="time"
                      name="appointment_time"
                      value={formData.appointment_time}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
