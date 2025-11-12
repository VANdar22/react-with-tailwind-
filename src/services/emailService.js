import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
const EMAILJS_SERVICE_ID = 'service_3pj57tq';
const EMAILJS_TEMPLATE_ID = 'template_q9uzkjj';
const EMAILJS_PUBLIC_KEY = 'QwFhahPewrAFsA9hh';

export async function sendAppointmentConfirmation(emailData) {
  try {
    if (!emailData || !emailData.to_email) {
      throw new Error('Recipient email is required');
    }

    const templateParams = {
      to_name: emailData.to_name || 'Valued Customer',
      to_email: emailData.to_email,
      appointment_date: emailData.appointment_date,
      appointment_time: emailData.appointment_time,
      car_number: emailData.car_number || 'Not provided',
      branch: emailData.branch || 'Our Service Center'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Email sent successfully:', response);
    return { success: true, message: 'Confirmation email sent successfully' };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      message: 'Failed to send confirmation email',
      error: error.message 
    };
  }
}
