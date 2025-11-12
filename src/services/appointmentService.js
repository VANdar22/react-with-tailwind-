import { supabase } from '../lib/supabase';
import { sendAppointmentConfirmation } from './emailService';

// Test function to verify database connection and table access
export async function testDatabaseConnection() {
  console.log('Testing database connection...');
  try {
    // Test connection by fetching the first record
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
    
    console.log('Database connection successful!', data);
    return { success: true, data };
  } catch (error) {
    console.error('Database test error:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    return { success: false, error };
  }
}

export async function submitAppointment(data) {
  console.group('=== submitAppointment Debug ===');
  console.log('1. Input data received:', data);
  
  try {
    // 1. Validate input data
    if (!data) {
      throw new Error('No data provided for appointment');
    }
    
    // Note: Email sending has been moved to the admin confirmation step
    console.log('Appointment data received, ready for admin confirmation');

    // 2. Check Supabase client initialization
    if (!supabase) {
      console.error('Supabase client is not initialized');
      throw new Error('System error: Unable to connect to the database');
    }

    console.log('2. Supabase client initialized successfully');

    // 3. Get current session if available
    console.log('3. Checking user session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      console.warn('Will continue without user session');
    } else {
      console.log('3.1 Session status:', session ? 'Authenticated' : 'No active session');
    }

    // 4. Prepare data according to the appointments table schema
    console.log('4. Preparing appointment data...');
    const appointmentData = {
      full_name: data.fullName?.trim() || '',
      phone: data.phone?.trim() || '',
      email: (data.email || session?.user?.email || '').trim().toLowerCase(),
      vehicle_make: data.vehicleMake?.trim() || '',
      vehicle_model: data.vehicleModel?.trim() || null,
      vin: (data.vin || data.carNumber || '').trim().toUpperCase(),
      car_number: data.carNumber?.trim().toUpperCase() || '',
      region: data.region?.trim() || 'Default',
      branch: data.branch?.trim() || 'Default',
      // Ensure service_type is sent as an array
      service_type: (() => {
        if (Array.isArray(data.services) && data.services.length > 0) {
          return data.services;
        } else if (data.serviceType) {
          return [data.serviceType.trim()];
        } else if (data.services) {
          // If services is a string, split it into an array
          return typeof data.services === 'string' ? [data.services] : [];
        }
        return [];
      })(),
      appointment_date: data.appointmentDate || new Date().toISOString().split('T')[0],
      appointment_time: data.appointmentTime || '',
      status: 'Pending',
      created_at: new Date().toISOString(),
      ...(session?.user?.id && { user_id: session.user.id })
    };

    // Validate required fields
    const requiredFields = ['full_name', 'phone', 'email', 'vehicle_make', 'car_number'];
    const missingFields = requiredFields.filter(field => !appointmentData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('5. Validated appointment data:', appointmentData);

    // 5. Test connection first
    console.log('6. Testing database connection...');
    const { error: testError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('6.1 Database connection test failed:', testError);
      throw new Error(`Database connection failed: ${testError.message}`);
    }
    console.log('6.1 Database connection test successful');

    // 6. Insert the appointment
    console.log('7. Attempting to insert into appointments table...');
    const { data: result, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select('*')
      .single();

    if (error) {
      console.error('7.1 Supabase insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      
      // Check for common error types
      if (error.code === '23505') {
        throw new Error('This appointment already exists');
      } else if (error.code === '42501') {
        throw new Error('Permission denied. Please check your database permissions.');
      } else if (error.code === '42P01') {
        throw new Error('Database table not found. Please check if the appointments table exists.');
      }
      
      throw new Error(`Failed to book appointment: ${error.message}`);
    }

    console.log('7.1 Insert successful. Result:', result);
    
    if (!result) {
      console.warn('7.2 No data returned from insert, but no error was thrown');
      // Try to fetch the record as a fallback
      const { data: lastRecord } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (lastRecord?.[0]) {
        console.log('7.3 Retrieved last inserted record:', lastRecord[0]);
        return { 
          success: true, 
          data: lastRecord[0],
          message: 'Appointment booked successfully! (Fallback)' 
        };
      }
    }
    
    return { 
      success: true, 
      data: result,
      message: 'Appointment booked successfully!' 
    };
    
  } catch (error) {
    console.error('Error in submitAppointment:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to book appointment. Please try again.';
    
    if (error.message.includes('network')) {
      errorMessage = 'Network error: Could not connect to the server. Please check your internet connection.';
    } else if (error.message.includes('permission')) {
      errorMessage = 'Permission denied. Please make sure you are logged in and have the necessary permissions.';
    } else if (error.message.includes('duplicate')) {
      errorMessage = 'An appointment with these details already exists.';
    }
    
    throw new Error(errorMessage);
  } finally {
    console.groupEnd();
  }
}

// Function to fetch all appointments (for admin use)
export async function getAppointments() {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true });
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return { data: null, error };
  }
}

// Function to update appointment status
export async function updateAppointmentStatus(id, status) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return { data: null, error };
  }
}
