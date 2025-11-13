
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { format, parseISO } from "date-fns";
import { useAuth } from "@clerk/clerk-react";
import { sendAppointmentConfirmation } from "../../services/emailService";
import AddAppointment from "./AddAppointment";
import { useNavigate, Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import { CustomAlert, SuccessAlert } from "../../components/CustomAlert";

const AppointmentsList = (props) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  // State for custom alerts
  const [alertState, setAlertState] = useState({
    showConfirm: false,
    showSuccess: false,
    alertTitle: '',
    alertMessage: '',
    onConfirm: null,
    successMessage: ''
  });

  // Show confirmation dialog
  const showConfirm = (title, message, onConfirm) => {
    setAlertState({
      ...alertState,
      showConfirm: true,
      alertTitle: title,
      alertMessage: message,
      onConfirm: onConfirm
    });
  };

  // Show success message
  const showSuccess = (message) => {
    setAlertState({
      ...alertState,
      showSuccess: true,
      successMessage: message
    });
  };

  // Show error message
  const showError = (message) => {
    setAlertState({
      ...alertState,
      showSuccess: true,
      successMessage: message,
      isError: true
    });
  };

  // Close all alerts
  const closeAlerts = () => {
    setAlertState({
      showConfirm: false,
      showSuccess: false,
      alertTitle: '',
      alertMessage: '',
      onConfirm: null,
      successMessage: ''
    });
  };

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [filterField, setFilterField] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const itemsPerPage = 10;

  // Handle edit button click
  const handleEditClick = (appointment) => {
    setEditingAppointment(appointment);
    setShowAddModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingAppointment(null);
  };

  // Handle successful appointment update
  const handleAppointmentUpdated = () => {
    fetchAppointments();
    setShowAddModal(false);
    setEditingAppointment(null);
    showSuccess('Appointment updated successfully!');
  };

  useEffect(() => {
    fetchAppointments();

    // Set up real-time subscription
    const subscription = supabase
      .channel("appointments_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      showError("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      
      // First, get the current appointment data
      const { data: appointmentData, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Update the status in the database
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      
      // If status is being updated to 'confirmed', send confirmation email
      if (newStatus === 'confirmed' && appointmentData.email) {
        try {
          await sendAppointmentConfirmation({
            to_name: appointmentData.full_name || 'Valued Customer',
            to_email: appointmentData.email,
            appointment_date: appointmentData.appointment_date,
            appointment_time: appointmentData.appointment_time,
            car_number: appointmentData.car_number || 'Not provided',
            branch: appointmentData.branch || 'Our Service Center'
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't fail the whole operation if email fails
        }
      }
      
      await fetchAppointments();
      showSuccess(`Appointment marked as ${newStatus} successfully!`);
      return true;
    } catch (err) {
      console.error("Error updating status:", err);
      showError(`Failed to update status: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = (id) => {
    showConfirm(
      'Delete Appointment',
      'Are you sure you want to delete this appointment? This action cannot be undone.',
      async () => {
        try {
          setLoading(true);
          const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

          if (error) throw error;
          
          await fetchAppointments();
          showSuccess('Appointment deleted successfully!');
        } catch (err) {
          console.error('Error deleting appointment:', err);
          showError(`Failed to delete appointment: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Filter appointments based on search and filters
  const filteredAppointments = appointments.filter((appointment) => {
    // Search term filtering
    const searchTermLower = searchTerm.toLowerCase();
    let matchesSearch = true;
    
    if (searchTerm) {
      switch(filterField) {
        case 'all':
          matchesSearch = 
            appointment.full_name?.toLowerCase().includes(searchTermLower) ||
            appointment.phone?.toLowerCase().includes(searchTermLower) ||
            appointment.email?.toLowerCase().includes(searchTermLower) ||
            appointment.vehicle_make?.toLowerCase().includes(searchTermLower) ||
            appointment.vehicle_model?.toLowerCase().includes(searchTermLower) ||
            appointment.car_number?.toLowerCase().includes(searchTermLower) ||
            (Array.isArray(appointment.service_type) && 
             appointment.service_type.some(service => 
               service.toLowerCase().includes(searchTermLower)
             ));
          break;
        case 'name':
          matchesSearch = appointment.full_name?.toLowerCase().includes(searchTermLower);
          break;
        case 'phone':
          matchesSearch = appointment.phone?.toLowerCase().includes(searchTermLower);
          break;
        case 'email':
          matchesSearch = appointment.email?.toLowerCase().includes(searchTermLower);
          break;
        case 'vehicle':
          matchesSearch = 
            appointment.vehicle_make?.toLowerCase().includes(searchTermLower) ||
            appointment.vehicle_model?.toLowerCase().includes(searchTermLower);
          break;
        case 'plate':
          matchesSearch = appointment.car_number?.toLowerCase().includes(searchTermLower);
          break;
        case 'service':
          matchesSearch = Array.isArray(appointment.service_type) && 
            appointment.service_type.some(service => 
              service.toLowerCase().includes(searchTermLower)
            );
          break;
          case 'region':
            matchesSearch = appointment.region?.toLowerCase().includes(searchTermLower);
            break;
          case 'branch':
            matchesSearch = appointment.branch?.toLowerCase().includes(searchTermLower);
            break;
        default:
          matchesSearch = true;
      }
    }

    // Status filter
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      
    // Date filter
    const matchesDate = !dateFilter || appointment.appointment_date === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page if current page is invalid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        label: "Pending",
      },
      confirmed: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        label: "Confirmed",
      },
      completed: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        label: "Completed",
      },
      canceled: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        label: "Canceled",
      },
    };

    const statusInfo = statusClasses[status?.toLowerCase()] || {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      label: status || "Unknown",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} border`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const handleStatusUpdate = async (id, currentStatus, newStatus) => {
    const statusDisplay = newStatus === 'pending' ? 'Accept' : newStatus;
    showConfirm(
      'Confirm Status Change',
      `Are you sure you want to ${statusDisplay.toLowerCase()} this appointment?`,
      async () => {
        const success = await updateStatus(id, newStatus);
        if (success && props.onStatusChange) {
          props.onStatusChange();
        }
      }
    );
  };

  const formatDateTime = (dateStr, timeStr) => {
    try {
      const date = new Date(`${dateStr}T${timeStr}`);
      return (
        <div className="text-left">
          <div className="font-medium text-gray-900">
            {format(date, 'MMM d, yyyy')}
          </div>
          <div className="text-sm text-gray-500">
            {format(date, 'h:mm a')}
          </div>
        </div>
      );
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track all customer appointments
          </p>
        </div>
        {!props.isEmbedded && (
          <div className="mt-4 sm:mt-0">
            <Link
              to="/admin/appointments/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              New Appointment
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="flex space-x-2">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    placeholder={`Search by ${filterField === 'all' ? 'any field' : filterField}...`}
                    className="focus:ring-[#EB0A1E] focus:border-[#EB0A1E] block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-40">
                <label htmlFor="filter-field" className="block text-sm font-medium text-gray-700 mb-1">
                  Search in
                </label>
                <select
                  id="filter-field"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#EB0A1E] focus:border-[#EB0A1E] sm:text-sm rounded-md"
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                >
                  <option value="all">All Fields</option>
                  <option value="name">Name</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="vehicle">Vehicle Make/Model</option>
                  <option value="plate">License Plate</option>
                  <option value="service">Service Type</option>
                  <option value="region">Region</option>
                  <option value="branch">Branch</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <select
                id="status-filter"
                className="appearance-none block w-full pl-10 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#EB0A1E] focus:border-[#EB0A1E] sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Date
            </label>
            <div className="relative">
              <DatePicker
                selected={dateFilter ? parseISO(dateFilter) : null}
                onChange={(date) => setDateFilter(date ? format(date, 'yyyy-MM-dd') : '')}
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#EB0A1E] focus:border-[#EB0A1E]"
                placeholderText="Select a date"
                dateFormat="MMMM d, yyyy"
                isClearable
                clearButtonClassName="text-gray-400 hover:text-gray-600"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCalendar className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentAppointments.length > 0 ? (
                currentAppointments.map((appointment, index) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.phone}
                          </div>
                          {appointment.email && (
                            <div className="text-xs text-gray-400 truncate max-w-xs">
                              {appointment.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.vehicle_make} {appointment.vehicle_model}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.car_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 space-y-1">
                        {Array.isArray(appointment.service_type) 
                          ? (
                              <ul className="list-disc pl-5">
                                {appointment.service_type.map((service, idx) => (
                                  <li key={idx} className="py-0.5">{service}</li>
                                ))}
                              </ul>
                            )
                          : (
                              <div>{appointment.service_type}</div>
                            )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.branch || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {appointment.created_at ? format(new Date(appointment.created_at), 'MMM d, yyyy h:mm a') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-end space-y-2">
                        <button
                          onClick={() => handleEditClick(appointment)}
                          className="w-full text-center px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                          disabled={loading}
                        >
                          Edit
                        </button>
                        {appointment.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(appointment.id, 'pending', 'confirmed')}
                              className="w-full text-center px-3 py-1 border border-green-600 text-green-600 rounded hover:bg-green-50 transition-colors"
                              disabled={loading}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(appointment.id, 'pending', 'canceled')}
                              className="w-full text-center px-3 py-1 border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors"
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          </>
                        ) : appointment.status === 'confirmed' ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(appointment.id, 'confirmed', 'completed')}
                              className="w-full text-center px-3 py-1 border border-green-600 text-green-600 rounded hover:bg-green-50 transition-colors"
                              disabled={loading}
                            >
                              Completed
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(appointment.id, 'confirmed', 'canceled')}
                              className="w-full text-center px-3 py-1 border border-amber-600 text-amber-600 rounded hover:bg-amber-50 transition-colors"
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          </>
                        ) : appointment.status !== 'completed' ? (
                          <button
                            onClick={() => handleStatusUpdate(appointment.id, appointment.status, 'pending')}
                            className="w-full text-center px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                            disabled={loading}
                          >
                            Accept
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          className="w-full text-center px-3 py-1 border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors"
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    {loading ? 'Loading...' : 'No appointments found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

{/* Pagination - Always show if there are appointments */}
      {filteredAppointments.length > 0 && (
        <div className="bg-white px-4 py-4 sm:px-6 shadow-md rounded-lg mt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            {searchTerm && (
  <div className="mb-6 bg-blue-50 p-3 rounded-lg border border-blue-200">
    <p className="text-sm text-blue-800 flex items-center">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      Showing search results for: <span className="font-semibold ml-1">"{searchTerm}"</span>
    </p>
  </div>
)}
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredAppointments.length)}
                </span>{' '}
                of <span className="font-medium">{filteredAppointments.length}</span> results
              </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === number
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 font-semibold'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      

      {/* Alert Modals */}
      <CustomAlert
        isOpen={alertState.showConfirm}
        onClose={closeAlerts}
        onConfirm={() => {
          if (alertState.onConfirm) {
            alertState.onConfirm();
          }
          closeAlerts();
        }}
        title={alertState.alertTitle}
        message={alertState.alertMessage}
      />
      
      <SuccessAlert
        isOpen={alertState.showSuccess}
        onClose={closeAlerts}
        title={alertState.alertTitle}
        message={alertState.successMessage}
      />

      {/* Add/Edit Appointment Modal - Full Screen */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAppointment ? 'Edit Appointment' : 'Add New Appointment'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content - Scrollable area with hidden scrollbar */}
          <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full no-scrollbar">
            <style jsx>{`
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            <AddAppointment 
              appointmentToEdit={editingAppointment}
              onSuccess={handleAppointmentUpdated}
              onCancel={handleCloseModal}
            />
          </div>
          
          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-white">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => document.querySelector('form')?.requestSubmit()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingAppointment ? 'Update Appointment' : 'Create Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
