const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const {
  sendEmail,
  sendRoleApprovalEmail,
  sendSignupAcknowledgementEmail,
  sendPasswordResetOtpEmail,
  sendAppointmentReminderEmail,
  sendPrescriptionEmail,
} = require('./emailService');
const AdminSettings = require('../models/AdminSettings');

/**
 * Send email notification for any notification
 * @param {Object} params - Email notification parameters
 * @param {String} params.userId - User ID
 * @param {String} params.userType - User type (patient, doctor, pharmacy, laboratory, admin)
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {Object} params.user - User object with email (optional, will fetch if not provided)
 */
const sendNotificationEmail = async ({ userId, userType, title, message, user = null }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  
  try {
    let userEmail = null;
    let userName = 'User';
    
    // If user object is provided, use it
    if (user && user.email) {
      userEmail = user.email;
      userName = user.firstName 
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : 'User';
    } else {
      // Otherwise, fetch user based on userType
      let UserModel;
      switch (userType) {
        case 'patient':
          UserModel = require('../models/Patient');
          break;
        case 'doctor':
          UserModel = require('../models/Doctor');
          break;
        case 'pharmacy':
          UserModel = require('../models/Pharmacy');
          break;
        case 'laboratory':
          UserModel = require('../models/Laboratory');
          break;
        case 'admin':
          UserModel = require('../models/Admin');
          break;
        default:
          return null;
      }
      
      const userData = await UserModel.findById(userId).select('email firstName lastName');
      if (!userData || !userData.email) return null;
      
      userEmail = userData.email;
      userName = userData.firstName 
        ? `${userData.firstName} ${userData.lastName || ''}`.trim()
        : 'User';
    }
    
    if (!userEmail) return null;
    
    // Send email with notification content
    return sendEmail({
      to: userEmail,
      subject: `${title} | Healiinn`,
      text: `Hello ${userName},\n\n${message}\n\nThank you,\nTeam Healiinn`,
      html: `<p>Hello ${userName},</p><p>${message}</p><p>Thank you,<br/>Team Healiinn</p>`,
    });
  } catch (error) {
    console.error('Error sending notification email:', error);
    return null;
  }
};

/**
 * Create and send notification
 * @param {Object} params - Notification parameters
 * @param {String} params.userId - User ID
 * @param {String} params.userType - User type (patient, doctor, pharmacy, laboratory, admin)
 * @param {String} params.type - Notification type
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {Object} params.data - Additional data
 * @param {String} params.priority - Priority level (low, medium, high, urgent)
 * @param {String} params.actionUrl - URL to navigate on click
 * @param {String} params.icon - Icon name
 * @param {Boolean} params.emitSocket - Whether to emit Socket.IO event (default: true)
 * @param {Boolean} params.sendEmail - Whether to send email notification (default: true)
 * @param {Object} params.user - User object with email (optional, will fetch if not provided)
 */
const createNotification = async ({
  userId,
  userType,
  type,
  title,
  message,
  data = {},
  priority = 'medium',
  actionUrl = null,
  icon = null,
  emitSocket = true,
  sendEmail = true,
  user = null,
}) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      userType,
      type,
      title,
      message,
      data,
      priority,
      actionUrl,
      icon,
    });

    // Send email notification if enabled
    if (sendEmail) {
      sendNotificationEmail({ userId, userType, title, message, user })
        .catch((error) => console.error('Error sending notification email:', error));
    }

    // Emit Socket.IO event if enabled
    if (emitSocket) {
      try {
        const io = getIO();
        io.to(`${userType}-${userId}`).emit('notification:new', {
          notification: notification.toObject(),
        });
      } catch (error) {
        console.error('Socket.IO error in createNotification:', error);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notification for appointment events
 */
const createAppointmentNotification = async ({ userId, userType, appointment, eventType, doctor, patient, sendEmail = true }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'created':
      if (userType === 'doctor') {
        title = 'New Appointment Booking';
        message = patient
          ? `New appointment booked by ${patient.firstName} ${patient.lastName || ''}${appointment.tokenNumber ? ` (Token: ${appointment.tokenNumber})` : ''}`
          : 'New appointment has been booked';
        actionUrl = '/doctor/patients';
      } else {
        title = 'New Appointment';
        message = patient
          ? `Appointment booked with ${patient.firstName} ${patient.lastName || ''}`
          : 'New appointment has been booked';
        actionUrl = '/patient/appointments';
      }
      break;
    case 'cancelled':
      title = 'Appointment Cancelled';
      message = doctor
        ? `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName || ''} has been cancelled`
        : 'Appointment has been cancelled';
      actionUrl = '/patient/appointments';
      break;
    case 'rescheduled':
      title = 'Appointment Rescheduled';
      message = doctor
        ? `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName || ''} has been rescheduled`
        : 'Appointment has been rescheduled';
      actionUrl = '/patient/appointments';
      break;
    case 'payment_confirmed':
      title = 'Payment Confirmed';
      message = `Payment of ₹${appointment.fee || 0} confirmed for your appointment`;
      actionUrl = '/patient/appointments';
      break;
    case 'token_called':
      title = 'Your Turn';
      message = `Token ${appointment.tokenNumber} has been called. Please proceed to consultation room.`;
      actionUrl = '/patient/appointments';
      break;
    case 'token_recalled':
      title = 'Token Recalled';
      message = `Your token ${appointment.tokenNumber} has been recalled. Please wait for your turn.`;
      actionUrl = '/patient/appointments';
      break;
    case 'completed':
      title = 'Consultation Completed';
      message = doctor
        ? `Your consultation with Dr. ${doctor.firstName} ${doctor.lastName || ''} has been completed`
        : 'Consultation has been completed';
      actionUrl = '/patient/appointments';
      break;
    default:
      title = 'Appointment Update';
      message = 'Your appointment has been updated';
      actionUrl = '/patient/appointments';
  }

  // Get user data for email
  let user = null;
  if (sendEmail) {
    if (userType === 'patient') {
      if (patient) {
        user = patient;
      } else {
        try {
          const Patient = require('../models/Patient');
          user = await Patient.findById(userId).select('email firstName lastName');
        } catch (error) {
          console.error('Error fetching patient for email:', error);
        }
      }
    } else if (userType === 'doctor') {
      if (doctor) {
        user = doctor;
      } else {
        try {
          const Doctor = require('../models/Doctor');
          user = await Doctor.findById(userId).select('email firstName lastName');
        } catch (error) {
          console.error('Error fetching doctor for email:', error);
        }
      }
    }
  }

  return createNotification({
    userId,
    userType,
    type: 'appointment',
    title,
    message,
    data: {
      appointmentId: appointment._id || appointment.id,
      eventType,
      tokenNumber: appointment.tokenNumber,
    },
    priority: eventType === 'token_called' ? 'urgent' : 'medium',
    actionUrl,
    icon: 'appointment',
    sendEmail,
    user,
  });
};

/**
 * Create notification for prescription events
 */
const createPrescriptionNotification = async ({ userId, userType, prescription, doctor, patient }) => {
  const title = 'New Prescription';
  const message = doctor
    ? `Prescription received from Dr. ${doctor.firstName} ${doctor.lastName || ''}`
    : `Prescription created for ${patient.firstName} ${patient.lastName || ''}`;
  
  return createNotification({
    userId,
    userType,
    type: 'prescription',
    title,
    message,
    data: {
      prescriptionId: prescription._id || prescription.id,
      consultationId: prescription.consultationId,
    },
    priority: 'high',
    actionUrl: userType === 'patient' ? '/patient/prescriptions' : '/doctor/consultations',
    icon: 'prescription',
  });
};

/**
 * Create notification for wallet events
 */
const createWalletNotification = async ({ userId, userType, amount, eventType, withdrawal = null, sendEmail = false }) => {
  let title, message, priority, actionUrl;

  switch (eventType) {
    case 'credited':
      title = 'Wallet Credited';
      message = `₹${amount} has been credited to your wallet`;
      priority = 'high';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    case 'withdrawal_requested':
      title = 'Withdrawal Requested';
      message = `Withdrawal request of ₹${amount} has been submitted`;
      priority = 'medium';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    case 'withdrawal_approved':
      title = 'Withdrawal Approved';
      message = `Your withdrawal request of ₹${amount} has been approved by admin`;
      priority = 'high';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    case 'withdrawal_paid':
      title = 'Payment Processed';
      message = `Your withdrawal request of ₹${amount} has been processed and payment has been sent${withdrawal?.payoutReference ? ` (Ref: ${withdrawal.payoutReference})` : ''}`;
      priority = 'high';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    case 'withdrawal_rejected':
      title = 'Withdrawal Rejected';
      message = `Your withdrawal request of ₹${amount} has been rejected${withdrawal?.rejectionReason ? `. Reason: ${withdrawal.rejectionReason}` : ''}`;
      priority = 'high';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    default:
      title = 'Wallet Update';
      message = 'Your wallet has been updated';
      priority = 'medium';
      actionUrl = '/doctor/wallet';
  }

  return createNotification({
    userId,
    userType,
    type: 'wallet',
    title,
    message,
    data: {
      amount,
      eventType,
      withdrawalId: withdrawal?._id || withdrawal?.id,
      payoutReference: withdrawal?.payoutReference,
      rejectionReason: withdrawal?.rejectionReason,
    },
    priority,
    actionUrl,
    icon: 'wallet',
    sendEmail, // Only send email if explicitly requested (for withdrawal approved/paid)
  });
};

/**
 * Create notification for order events
 */
const createOrderNotification = async ({ userId, userType, order, eventType, pharmacy, laboratory, patient, status }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'created':
      title = 'New Order';
      message = patient
        ? `New order from ${patient.firstName} ${patient.lastName || ''}`
        : 'Your order has been placed';
      actionUrl = userType === 'patient' ? '/patient/orders' : userType === 'pharmacy' ? '/pharmacy/orders' : '/laboratory/orders';
      break;
    case 'confirmed':
      title = 'Order Confirmed';
      message = pharmacy
        ? 'Your order has been confirmed'
        : laboratory
        ? `Your order has been confirmed by ${laboratory.labName || 'Laboratory'}`
        : 'Order has been confirmed';
      actionUrl = '/patient/orders';
      break;
    case 'status_updated':
      // Handle new lab visit flow statuses and pharmacy order statuses
      const statusMessages = {
        // Lab visit flow statuses
        visit_time: laboratory
          ? `You can now visit ${laboratory.labName || 'the lab'}`
          : 'You can now visit the lab',
        sample_collected: laboratory
          ? `Sample collected by ${laboratory.labName || 'Laboratory'}`
          : 'Your sample has been collected',
        being_tested: laboratory
          ? `Your test is being processed by ${laboratory.labName || 'Laboratory'}`
          : 'Your test is being processed',
        reports_being_generated: laboratory
          ? `Reports are being generated by ${laboratory.labName || 'Laboratory'}`
          : 'Your reports are being generated',
        test_successful: laboratory
          ? `Test completed successfully by ${laboratory.labName || 'Laboratory'}`
          : 'Your test has been completed successfully',
        reports_updated: laboratory
          ? `Your test reports are ready from ${laboratory.labName || 'Laboratory'}`
          : 'Your test reports are ready',
        // Pharmacy order flow statuses (no pharmacy name shown)
        prescription_received: 'Your prescription has been received',
        medicine_collected: 'Medicines are being collected',
        packed: 'Your order has been packed',
        ready_to_be_picked: 'Your order is ready to be picked',
        picked_up: 'Your order has been picked up',
        delivered: 'Your order has been delivered',
      };
      title = status === 'reports_updated' ? 'Reports Ready' : 'Order Status Updated';
      message = statusMessages[status] || (pharmacy
        ? 'Your order status has been updated'
        : laboratory
        ? `Order status updated by ${laboratory.labName || 'Laboratory'}`
        : 'Your order status has been updated');
      actionUrl = '/patient/orders';
      break;
    case 'completed':
      title = 'Order Completed';
      message = pharmacy
        ? 'Your order has been completed'
        : laboratory
        ? `Your test report is ready from ${laboratory.labName || 'Laboratory'}`
        : 'Order has been completed';
      actionUrl = '/patient/orders';
      break;
    case 'cancelled':
      title = 'Order Cancelled';
      message = 'Your order has been cancelled';
      actionUrl = '/patient/orders';
      break;
    default:
      title = 'Order Update';
      message = 'Your order has been updated';
      actionUrl = '/patient/orders';
  }

  return createNotification({
    userId,
    userType,
    type: 'order',
    title,
    message,
    data: {
      orderId: order._id || order.id,
      eventType,
    },
    priority: eventType === 'completed' ? 'high' : 'medium',
    actionUrl,
    icon: 'order',
  });
};

/**
 * Create notification for request events
 */
const createRequestNotification = async ({ userId, userType, request, eventType, admin, pharmacy, laboratory, patient }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'created':
      title = 'New Request';
      message = 'New request has been submitted';
      actionUrl = userType === 'patient' ? '/patient/requests' : '/admin/requests';
      break;
    case 'responded':
      title = 'Request Response';
      message = admin
        ? 'Admin has responded to your request'
        : 'Request has been responded';
      actionUrl = '/patient/requests';
      break;
    case 'assigned':
      if (userType === 'pharmacy') {
        // Pharmacy notification when patient makes payment
        const patientName = patient?.firstName && patient?.lastName
          ? `${patient.firstName} ${patient.lastName}`
          : patient?.firstName || request?.patientId?.firstName || 'Patient';
        const requestAmount = request?.adminResponse?.totalAmount || request?.totalAmount || 0;
        title = 'New Order Request';
        message = `Payment received! New order request from ${patientName}${requestAmount > 0 ? ` (₹${requestAmount})` : ''}. Please check your request orders.`;
        actionUrl = '/pharmacy/request-orders';
      } else if (userType === 'laboratory') {
        title = 'Request Assigned';
        message = laboratory
          ? `Request assigned to ${laboratory.labName || 'Laboratory'}`
          : 'Request has been assigned';
        actionUrl = '/laboratory/orders';
      } else {
        title = 'Request Assigned';
        message = 'Request has been assigned';
        actionUrl = '/pharmacy/orders';
      }
      break;
    case 'confirmed':
      title = 'Request Confirmed';
      message = 'Your request has been confirmed';
      actionUrl = '/patient/requests';
      break;
    default:
      title = 'Request Update';
      message = 'Your request has been updated';
      actionUrl = '/patient/requests';
  }

  return createNotification({
    userId,
    userType,
    type: 'request',
    title,
    message,
    data: {
      requestId: request._id || request.id,
      eventType,
      patientId: patient?._id || request?.patientId?._id || request?.patientId,
      amount: request?.adminResponse?.totalAmount || request?.totalAmount || 0,
    },
    priority: 'high',
    actionUrl,
    icon: 'request',
  });
};

/**
 * Create notification for report events
 */
const createReportNotification = async ({ userId, userType, report, laboratory, patient }) => {
  const title = 'Test Report Ready';
  const message = laboratory
    ? `Test report is ready from ${laboratory.labName || 'Laboratory'}`
    : `Test report created for ${patient.firstName} ${patient.lastName || ''}`;
  
  return createNotification({
    userId,
    userType,
    type: 'report',
    title,
    message,
    data: {
      reportId: report._id || report.id,
      orderId: report.orderId,
    },
    priority: 'high',
    actionUrl: userType === 'patient' ? '/patient/reports' : '/laboratory/patients',
    icon: 'report',
  });
};

/**
 * Create notification for admin events
 */
const createAdminNotification = async ({ userId, userType, eventType, data }) => {
  let title, message, actionUrl, priority = 'medium';

  switch (eventType) {
    case 'payment_received':
      title = 'Payment Received';
      message = `Payment of ₹${data.amount || 0} received from patient`;
      actionUrl = '/admin/wallet';
      priority = 'high';
      break;
    case 'withdrawal_requested':
      title = 'Withdrawal Request';
      message = `New withdrawal request of ₹${data.amount || 0} from ${data.userType || 'provider'}`;
      actionUrl = '/admin/wallet';
      priority = 'high';
      break;
    case 'request_created':
      title = 'New Request';
      message = 'New patient request has been submitted';
      actionUrl = '/admin/requests';
      break;
    case 'request_confirmed':
      title = 'Request Confirmed';
      message = 'Patient request has been confirmed';
      actionUrl = '/admin/requests';
      break;
    default:
      title = 'System Update';
      message = 'System update received';
      actionUrl = '/admin/dashboard';
  }

  return createNotification({
    userId,
    userType,
    type: eventType === 'payment_received' || eventType === 'withdrawal_requested' ? 'wallet' : 'request',
    title,
    message,
    data,
    priority,
    actionUrl,
    icon: 'system',
  });
};

/**
 * Create notification for session/queue events
 */
const createSessionNotification = async ({ userId, userType, session, eventType }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'started':
      title = 'Session Started';
      message = 'Your session has started';
      actionUrl = '/doctor/patients';
      break;
    case 'paused':
      title = 'Session Paused';
      message = 'Your session has been paused';
      actionUrl = '/doctor/patients';
      break;
    case 'resumed':
      title = 'Session Resumed';
      message = 'Your session has been resumed';
      actionUrl = '/doctor/patients';
      break;
    case 'cancelled':
      title = 'Session Cancelled';
      message = 'Your session has been cancelled';
      actionUrl = '/doctor/patients';
      break;
    case 'queue_updated':
      title = 'Queue Updated';
      message = 'Patient queue has been updated';
      actionUrl = '/doctor/patients';
      break;
    default:
      title = 'Session Update';
      message = 'Your session has been updated';
      actionUrl = '/doctor/patients';
  }

  return createNotification({
    userId,
    userType,
    type: 'session',
    title,
    message,
    data: {
      sessionId: session._id || session.id,
      eventType,
    },
    priority: 'medium',
    actionUrl,
    icon: 'session',
  });
};

/**
 * Check if email notifications are enabled globally
 */
const isEmailNotificationsEnabled = async () => {
  try {
    const settings = await AdminSettings.findOne();
    return settings?.emailNotifications !== false; // Default to true if not set
  } catch (error) {
    console.error('Error checking email notification settings:', error);
    return true; // Default to enabled on error
  }
};

/**
 * Send appointment confirmation email to patient
 */
const sendAppointmentConfirmationEmail = async ({ patient, doctor, appointment }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const appointmentDate = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const appointmentTime = appointment.time || '';

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const doctorName = doctor.firstName
    ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim()
    : 'Doctor';

  return sendEmail({
    to: patient.email,
    subject: `Appointment Confirmed - ${doctorName} | Healiinn`,
    text: `Hello ${patientName},\n\nYour appointment has been confirmed:\n\nDoctor: ${doctorName}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nToken Number: ${appointment.tokenNumber || 'N/A'}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your appointment has been confirmed:</p><ul><li><strong>Doctor:</strong> ${doctorName}</li><li><strong>Date:</strong> ${appointmentDate}</li><li><strong>Time:</strong> ${appointmentTime}</li><li><strong>Token Number:</strong> ${appointment.tokenNumber || 'N/A'}</li></ul><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send appointment notification to doctor
 */
const sendDoctorAppointmentNotification = async ({ doctor, patient, appointment }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!doctor?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const appointmentDate = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return sendEmail({
    to: doctor.email,
    subject: `New Appointment - ${patientName} | Healiinn`,
    text: `Hello Dr. ${doctor.firstName || 'Doctor'},\n\nYou have a new appointment:\n\nPatient: ${patientName}\nDate: ${appointmentDate}\nToken Number: ${appointment.tokenNumber || 'N/A'}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello Dr. ${doctor.firstName || 'Doctor'},</p><p>You have a new appointment:</p><ul><li><strong>Patient:</strong> ${patientName}</li><li><strong>Date:</strong> ${appointmentDate}</li><li><strong>Token Number:</strong> ${appointment.tokenNumber || 'N/A'}</li></ul><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send appointment cancellation email
 */
const sendAppointmentCancellationEmail = async ({ patient, doctor, appointment }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const doctorName = doctor.firstName
    ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim()
    : 'Doctor';

  const reason = appointment.cancellationReason || 'Session cancelled by doctor';
  const rescheduleMessage = reason.includes('Session cancelled') 
    ? 'The session for this date has been cancelled. You can reschedule your appointment for a different date from the app.'
    : 'You can reschedule your appointment from the app.';

  return sendEmail({
    to: patient.email,
    subject: `Appointment Cancelled - ${doctorName} | Healiinn`,
    text: `Hello ${patientName},\n\nYour appointment with ${doctorName} has been cancelled.\n\nReason: ${reason}\n\n${rescheduleMessage}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your appointment with <strong>${doctorName}</strong> has been cancelled.</p><p><strong>Reason:</strong> ${reason}</p><p>${rescheduleMessage}</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send lab report ready email
 */
const sendLabReportReadyEmail = async ({ patient, laboratory, report, order }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const labName = laboratory?.labName || 'Laboratory';

  return sendEmail({
    to: patient.email,
    subject: `Test Report Ready - ${labName} | Healiinn`,
    text: `Hello ${patientName},\n\nYour test report is ready from ${labName}. You can view and download it from the app.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your test report is ready from <strong>${labName}</strong>. You can view and download it from the app.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send order status update email
 */
const sendOrderStatusUpdateEmail = async ({ patient, pharmacy, laboratory, order, status }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  
  // Don't show pharmacy name to patients, use generic text
  const providerName = pharmacy 
    ? 'Prescription Medicines' 
    : laboratory?.labName || 'Provider';

  const statusMessages = {
    confirmed: 'has been confirmed',
    processing: 'is being processed',
    ready: 'is ready for pickup/delivery',
    completed: 'has been completed',
    cancelled: 'has been cancelled',
    // Lab visit flow statuses
    visit_time: 'you can now visit the lab',
    sample_collected: 'sample has been collected',
    being_tested: 'is being tested',
    reports_being_generated: 'reports are being generated',
    test_successful: 'test has been completed successfully',
    reports_updated: 'reports are ready',
    // Pharmacy order flow statuses
    prescription_received: 'prescription has been received',
    medicine_collected: 'medicines are being collected',
    packed: 'order has been packed',
    ready_to_be_picked: 'order is ready to be picked',
    picked_up: 'order has been picked up',
    delivered: 'order has been delivered',
  };

  const message = statusMessages[status] || 'has been updated';

  // For pharmacy orders, don't include "by Provider" in the message
  const emailText = pharmacy
    ? `Hello ${patientName},\n\nYour order ${message}.\n\nOrder ID: ${order._id || order.id}\nStatus: ${status}\n\nThank you,\nTeam Healiinn`
    : `Hello ${patientName},\n\nYour order ${message} by ${providerName}.\n\nOrder ID: ${order._id || order.id}\nStatus: ${status}\n\nThank you,\nTeam Healiinn`;
  
  const emailHtml = pharmacy
    ? `<p>Hello ${patientName},</p><p>Your order ${message}.</p><ul><li><strong>Order ID:</strong> ${order._id || order.id}</li><li><strong>Status:</strong> ${status}</li></ul><p>Thank you,<br/>Team Healiinn</p>`
    : `<p>Hello ${patientName},</p><p>Your order ${message} by <strong>${providerName}</strong>.</p><ul><li><strong>Order ID:</strong> ${order._id || order.id}</li><li><strong>Status:</strong> ${status}</li></ul><p>Thank you,<br/>Team Healiinn</p>`;

  return sendEmail({
    to: patient.email,
    subject: pharmacy ? `Order Update | Healiinn` : `Order Update - ${providerName} | Healiinn`,
    text: emailText,
    html: emailHtml,
  });
};

/**
 * Send payment confirmation email
 * Accepts either:
 * - { patient, amount, orderId, appointmentId } (direct values)
 * - { patient, transaction, order } (objects to extract from)
 */
const sendPaymentConfirmationEmail = async ({ patient, amount, orderId, appointmentId, transaction, order }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  // Extract values from transaction/order objects if provided
  let paymentAmount = amount;
  let referenceId = orderId || appointmentId || 'N/A';
  
  if (transaction) {
    // Extract amount from transaction
    if (!paymentAmount && transaction.amount) {
      paymentAmount = transaction.amount;
    }
    // Extract reference ID from transaction
    if (transaction.referenceId) {
      referenceId = transaction.referenceId;
    } else if (transaction._id) {
      referenceId = transaction._id.toString();
    } else if (transaction.id) {
      referenceId = transaction.id.toString();
    }
    // Extract appointmentId from transaction if available
    if (!appointmentId && transaction.appointmentId) {
      appointmentId = transaction.appointmentId;
      if (typeof appointmentId === 'object' && appointmentId._id) {
        referenceId = appointmentId._id.toString();
      } else if (typeof appointmentId === 'string') {
        referenceId = appointmentId;
      }
    }
  }
  
  if (order) {
    // Extract order ID from order object
    if (order._id) {
      referenceId = order._id.toString();
    } else if (order.id) {
      referenceId = order.id.toString();
    }
  }
  
  // Fallback: if still no amount, try to get from transaction metadata
  if (!paymentAmount && transaction?.metadata?.totalAmount) {
    paymentAmount = transaction.metadata.totalAmount;
  }
  
  // Ensure amount is a number and format it
  if (paymentAmount === undefined || paymentAmount === null) {
    console.error('Payment amount is undefined in sendPaymentConfirmationEmail:', {
      amount,
      transaction: transaction ? {
        amount: transaction.amount,
        metadata: transaction.metadata,
      } : null,
    });
    paymentAmount = 0; // Fallback to 0 if still undefined
  }
  
  // Format reference ID
  if (referenceId === 'N/A' && appointmentId) {
    if (typeof appointmentId === 'object' && appointmentId._id) {
      referenceId = appointmentId._id.toString();
    } else if (typeof appointmentId === 'string') {
      referenceId = appointmentId;
    }
  }

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';

  return sendEmail({
    to: patient.email,
    subject: `Payment Confirmed - ₹${paymentAmount} | Healiinn`,
    text: `Hello ${patientName},\n\nYour payment of ₹${paymentAmount} has been confirmed.\n\nReference ID: ${referenceId}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your payment of <strong>₹${paymentAmount}</strong> has been confirmed.</p><p><strong>Reference ID:</strong> ${referenceId}</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send support ticket notification email to user
 */
const sendSupportTicketNotification = async ({ user, ticket, userType, isResponse = false }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  
  let userEmail = '';
  let userName = '';
  
  // Extract email and name based on user type
  if (userType === 'patient') {
    userEmail = user?.email || '';
    userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.email || 'Patient';
  } else if (userType === 'doctor') {
    userEmail = user?.email || '';
    userName = user?.firstName && user?.lastName
      ? `Dr. ${user.firstName} ${user.lastName}`.trim()
      : user?.email || 'Doctor';
  } else if (userType === 'pharmacy') {
    userEmail = user?.email || '';
    userName = user?.pharmacyName || user?.ownerName || user?.email || 'Pharmacy';
  } else if (userType === 'laboratory') {
    userEmail = user?.email || '';
    userName = user?.labName || user?.ownerName || user?.email || 'Laboratory';
  }
  
  if (!userEmail) return null;
  
  const ticketSubject = ticket.subject || 'Support Request';
  const ticketMessage = ticket.message || '';
  const adminNote = ticket.adminNote || '';
  const latestResponse = ticket.responses && ticket.responses.length > 0 
    ? ticket.responses[ticket.responses.length - 1] 
    : null;
  
  if (isResponse && latestResponse) {
    // Admin responded to ticket
    const responseText = adminNote 
      ? `Admin Response:\n${latestResponse.message}\n\nAdmin Note:\n${adminNote}`
      : `Admin Response:\n${latestResponse.message}`;
    const responseHtml = adminNote
      ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;"><p><strong>Admin Response:</strong></p><p>${latestResponse.message}</p></div><div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;"><p><strong>Admin Note:</strong></p><p>${adminNote}</p></div>`
      : `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;"><p><strong>Admin Response:</strong></p><p>${latestResponse.message}</p></div>`;
    
    return sendEmail({
      to: userEmail,
      subject: `Response to Your Support Ticket - ${ticketSubject} | Healiinn`,
      text: `Hello ${userName},\n\nAdmin has responded to your support ticket:\n\nSubject: ${ticketSubject}\n\n${responseText}\n\nYou can view the full conversation in the app.\n\nThank you,\nTeam Healiinn`,
      html: `<p>Hello ${userName},</p><p>Admin has responded to your support ticket:</p><p><strong>Subject:</strong> ${ticketSubject}</p>${responseHtml}<p>You can view the full conversation in the app.</p><p>Thank you,<br/>Team Healiinn</p>`,
    });
  } else {
    // Status update or ticket created confirmation
    const statusLabel = ticket.status === 'resolved' ? 'Resolved' 
      : ticket.status === 'closed' ? 'Closed'
      : ticket.status === 'in_progress' ? 'In Progress'
      : 'Open';
    
    const noteText = adminNote ? `\n\nAdmin Note:\n${adminNote}` : '';
    const noteHtml = adminNote 
      ? `<div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;"><p><strong>Admin Note:</strong></p><p>${adminNote}</p></div>`
      : '';
    
    if (adminNote) {
      // Status update with admin note
      return sendEmail({
        to: userEmail,
        subject: `Support Ticket ${statusLabel} - ${ticketSubject} | Healiinn`,
        text: `Hello ${userName},\n\nYour support ticket status has been updated:\n\nSubject: ${ticketSubject}\nStatus: ${statusLabel}${noteText}\n\nTicket ID: ${ticket._id || ticket.id}\n\nThank you,\nTeam Healiinn`,
        html: `<p>Hello ${userName},</p><p>Your support ticket status has been updated:</p><ul><li><strong>Subject:</strong> ${ticketSubject}</li><li><strong>Status:</strong> ${statusLabel}</li><li><strong>Ticket ID:</strong> ${ticket._id || ticket.id}</li></ul>${noteHtml}<p>Thank you,<br/>Team Healiinn</p>`,
      });
    } else {
      // Ticket created confirmation
      return sendEmail({
        to: userEmail,
        subject: `Support Ticket Created - ${ticketSubject} | Healiinn`,
        text: `Hello ${userName},\n\nYour support ticket has been created successfully:\n\nSubject: ${ticketSubject}\nMessage: ${ticketMessage}\n\nTicket ID: ${ticket._id || ticket.id}\nStatus: ${ticket.status || 'Open'}\n\nWe'll get back to you soon.\n\nThank you,\nTeam Healiinn`,
        html: `<p>Hello ${userName},</p><p>Your support ticket has been created successfully:</p><ul><li><strong>Subject:</strong> ${ticketSubject}</li><li><strong>Message:</strong> ${ticketMessage}</li><li><strong>Ticket ID:</strong> ${ticket._id || ticket.id}</li><li><strong>Status:</strong> ${ticket.status || 'Open'}</li></ul><p>We'll get back to you soon.</p><p>Thank you,<br/>Team Healiinn</p>`,
      });
    }
  }
};

/**
 * Send withdrawal request confirmation email to provider (pharmacy/lab/doctor)
 */
const sendWithdrawalRequestNotification = async ({ provider, withdrawal, providerType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!provider?.email) return null;

  let providerName = '';
  if (providerType === 'pharmacy') {
    providerName = provider.pharmacyName || provider.ownerName || provider.email || 'Pharmacy';
  } else if (providerType === 'laboratory') {
    providerName = provider.labName || provider.ownerName || provider.email || 'Laboratory';
  } else if (providerType === 'doctor') {
    providerName = provider.firstName && provider.lastName
      ? `Dr. ${provider.firstName} ${provider.lastName}`.trim()
      : provider.email || 'Doctor';
  } else {
    providerName = provider.email || 'Provider';
  }

  const withdrawalAmount = withdrawal.amount || 0;
  const withdrawalId = withdrawal._id || withdrawal.id;
  const payoutMethodType = withdrawal.payoutMethod?.type || 'N/A';

  return sendEmail({
    to: provider.email,
    subject: `Withdrawal Request Submitted - ₹${withdrawalAmount} | Healiinn`,
    text: `Hello ${providerName},\n\nYour withdrawal request has been submitted successfully.\n\nWithdrawal Details:\n- Amount: ₹${withdrawalAmount}\n- Withdrawal ID: ${withdrawalId}\n- Payment Method: ${payoutMethodType}\n- Status: Pending\n\nYour request is under review. You will be notified once it's processed.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${providerName},</p><p>Your withdrawal request has been submitted successfully.</p><ul><li><strong>Amount:</strong> ₹${withdrawalAmount}</li><li><strong>Withdrawal ID:</strong> ${withdrawalId}</li><li><strong>Payment Method:</strong> ${payoutMethodType}</li><li><strong>Status:</strong> Pending</li></ul><p>Your request is under review. You will be notified once it's processed.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send withdrawal status update email to provider (pharmacy/lab/doctor)
 */
const sendWithdrawalStatusUpdateEmail = async ({ provider, withdrawal, providerType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!provider?.email) return null;

  let providerName = '';
  if (providerType === 'pharmacy') {
    providerName = provider.pharmacyName || provider.ownerName || provider.email || 'Pharmacy';
  } else if (providerType === 'laboratory') {
    providerName = provider.labName || provider.ownerName || provider.email || 'Laboratory';
  } else if (providerType === 'doctor') {
    providerName = provider.firstName && provider.lastName
      ? `Dr. ${provider.firstName} ${provider.lastName}`.trim()
      : provider.email || 'Doctor';
  } else {
    providerName = provider.email || 'Provider';
  }

  const withdrawalAmount = withdrawal.amount || 0;
  const withdrawalStatus = withdrawal.status || 'pending';
  const payoutReference = withdrawal.payoutReference || '';
  const rejectionReason = withdrawal.rejectionReason || '';

  let subject = '';
  let message = '';
  let htmlMessage = '';

  switch (withdrawalStatus) {
    case 'approved':
      subject = `Withdrawal Request Approved - ₹${withdrawalAmount} | Healiinn`;
      message = `Hello ${providerName},\n\nYour withdrawal request of ₹${withdrawalAmount} has been approved by admin.\n\nWithdrawal ID: ${withdrawal._id || withdrawal.id}\nStatus: Approved\n\nPayment will be processed shortly.\n\nThank you,\nTeam Healiinn`;
      htmlMessage = `<p>Hello ${providerName},</p><p>Your withdrawal request of <strong>₹${withdrawalAmount}</strong> has been approved by admin.</p><ul><li><strong>Withdrawal ID:</strong> ${withdrawal._id || withdrawal.id}</li><li><strong>Status:</strong> Approved</li></ul><p>Payment will be processed shortly.</p><p>Thank you,<br/>Team Healiinn</p>`;
      break;
    case 'paid':
      subject = `Withdrawal Payment Processed - ₹${withdrawalAmount} | Healiinn`;
      message = `Hello ${providerName},\n\nYour withdrawal request of ₹${withdrawalAmount} has been processed and payment has been sent.${payoutReference ? `\n\nPayout Reference: ${payoutReference}` : ''}\n\nWithdrawal ID: ${withdrawal._id || withdrawal.id}\nStatus: Paid\n\nThank you,\nTeam Healiinn`;
      htmlMessage = `<p>Hello ${providerName},</p><p>Your withdrawal request of <strong>₹${withdrawalAmount}</strong> has been processed and payment has been sent.${payoutReference ? `<p><strong>Payout Reference:</strong> ${payoutReference}</p>` : ''}</p><ul><li><strong>Withdrawal ID:</strong> ${withdrawal._id || withdrawal.id}</li><li><strong>Status:</strong> Paid</li></ul><p>Thank you,<br/>Team Healiinn</p>`;
      break;
    case 'rejected':
      subject = `Withdrawal Request Rejected - ₹${withdrawalAmount} | Healiinn`;
      message = `Hello ${providerName},\n\nYour withdrawal request of ₹${withdrawalAmount} has been rejected.${rejectionReason ? `\n\nReason: ${rejectionReason}` : ''}\n\nWithdrawal ID: ${withdrawal._id || withdrawal.id}\nStatus: Rejected\n\nThank you,\nTeam Healiinn`;
      htmlMessage = `<p>Hello ${providerName},</p><p>Your withdrawal request of <strong>₹${withdrawalAmount}</strong> has been rejected.${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}</p><ul><li><strong>Withdrawal ID:</strong> ${withdrawal._id || withdrawal.id}</li><li><strong>Status:</strong> Rejected</li></ul><p>Thank you,<br/>Team Healiinn</p>`;
      break;
    default:
      subject = `Withdrawal Status Update - ₹${withdrawalAmount} | Healiinn`;
      message = `Hello ${providerName},\n\nYour withdrawal request status has been updated.\n\nWithdrawal ID: ${withdrawal._id || withdrawal.id}\nStatus: ${withdrawalStatus}\nAmount: ₹${withdrawalAmount}\n\nThank you,\nTeam Healiinn`;
      htmlMessage = `<p>Hello ${providerName},</p><p>Your withdrawal request status has been updated.</p><ul><li><strong>Withdrawal ID:</strong> ${withdrawal._id || withdrawal.id}</li><li><strong>Status:</strong> ${withdrawalStatus}</li><li><strong>Amount:</strong> ₹${withdrawalAmount}</li></ul><p>Thank you,<br/>Team Healiinn</p>`;
  }

  return sendEmail({
    to: provider.email,
    subject,
    text: message,
    html: htmlMessage,
  });
};

/**
 * Send support ticket notification email to admin
 */
const sendAdminSupportTicketNotification = async ({ admin, ticket, user, userType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!admin?.email) return null;
  
  let userName = '';
  if (userType === 'patient') {
    userName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.email || 'Patient';
  } else if (userType === 'doctor') {
    userName = user?.firstName && user?.lastName
      ? `Dr. ${user.firstName} ${user.lastName}`.trim()
      : user?.email || 'Doctor';
  } else if (userType === 'pharmacy') {
    userName = user?.pharmacyName || user?.ownerName || user?.email || 'Pharmacy';
  } else if (userType === 'laboratory') {
    userName = user?.labName || user?.ownerName || user?.email || 'Laboratory';
  }
  
  const ticketSubject = ticket.subject || 'Support Request';
  const ticketMessage = ticket.message || '';
  
  return sendEmail({
    to: admin.email,
    subject: `New Support Ticket from ${userName} | Healiinn`,
    text: `Hello ${admin.name || 'Admin'},\n\nA new support ticket has been created:\n\nUser: ${userName} (${userType})\nSubject: ${ticketSubject}\nMessage: ${ticketMessage}\n\nTicket ID: ${ticket._id || ticket.id}\nPriority: ${ticket.priority || 'Medium'}\n\nPlease review and respond in the admin panel.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${admin.name || 'Admin'},</p><p>A new support ticket has been created:</p><ul><li><strong>User:</strong> ${userName} (${userType})</li><li><strong>Subject:</strong> ${ticketSubject}</li><li><strong>Message:</strong> ${ticketMessage}</li><li><strong>Ticket ID:</strong> ${ticket._id || ticket.id}</li><li><strong>Priority:</strong> ${ticket.priority || 'Medium'}</li></ul><p>Please review and respond in the admin panel.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Create support ticket notification (in-app)
 */
const createSupportTicketNotification = async ({ userId, userType, ticket, eventType }) => {
  let title, message, actionUrl;
  
  const ticketSubject = ticket.subject || 'Support Request';
  const modulePath = userType === 'patient' ? 'patient' 
    : userType === 'doctor' ? 'doctor'
    : userType === 'pharmacy' ? 'pharmacy'
    : userType === 'laboratory' ? 'laboratory' : '';
  
  const adminNote = ticket.adminNote || '';
  
  switch (eventType) {
    case 'created':
      title = 'Support Ticket Created';
      message = `Your support ticket "${ticketSubject}" has been created successfully.`;
      actionUrl = `/${modulePath}/support`;
      break;
    case 'responded':
      title = 'Response Received';
      message = adminNote 
        ? `Admin has responded to your support ticket "${ticketSubject}". Note: ${adminNote}`
        : `Admin has responded to your support ticket "${ticketSubject}".`;
      actionUrl = `/${modulePath}/support`;
      break;
    case 'status_updated':
      const statusLabel = ticket.status === 'resolved' ? 'Resolved' 
        : ticket.status === 'closed' ? 'Closed'
        : ticket.status === 'in_progress' ? 'In Progress'
        : 'Updated';
      title = `Ticket ${statusLabel}`;
      message = adminNote
        ? `Your support ticket "${ticketSubject}" has been ${statusLabel.toLowerCase()}. Admin Note: ${adminNote}`
        : `Your support ticket "${ticketSubject}" has been ${statusLabel.toLowerCase()}.`;
      actionUrl = `/${modulePath}/support`;
      break;
    default:
      title = 'Support Ticket Update';
      message = adminNote
        ? `Your support ticket "${ticketSubject}" has been updated. Admin Note: ${adminNote}`
        : `Your support ticket "${ticketSubject}" has been updated.`;
      actionUrl = `/${modulePath}/support`;
  }
  
  return createNotification({
    userId,
    userType,
    type: 'support', // Use 'support' as per Notification model enum
    title,
    message,
    data: {
      ticketId: ticket._id || ticket.id,
      ticketSubject,
      eventType,
    },
    priority: ticket.priority === 'urgent' ? 'urgent' : ticket.priority === 'high' ? 'high' : 'medium',
    actionUrl,
    icon: 'support',
  });
};

module.exports = {
  createNotification,
  createAppointmentNotification,
  createPrescriptionNotification,
  createWalletNotification,
  createOrderNotification,
  createRequestNotification,
  createReportNotification,
  createAdminNotification,
  createSessionNotification,
  // Email notification functions
  sendNotificationEmail,
  sendAppointmentConfirmationEmail,
  sendDoctorAppointmentNotification,
  sendAppointmentCancellationEmail,
  sendLabReportReadyEmail,
  sendOrderStatusUpdateEmail,
  sendPaymentConfirmationEmail,
  sendWithdrawalRequestNotification,
  sendWithdrawalStatusUpdateEmail,
  // Re-export email service functions
  sendEmail,
  sendRoleApprovalEmail,
  sendSignupAcknowledgementEmail,
  sendPasswordResetOtpEmail,
  sendAppointmentReminderEmail,
  sendPrescriptionEmail,
  // Support ticket notifications
  sendSupportTicketNotification,
  sendAdminSupportTicketNotification,
  createSupportTicketNotification,
};
