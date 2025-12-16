const asyncHandler = require('../../middleware/asyncHandler');
const Session = require('../../models/Session');
const Doctor = require('../../models/Doctor');
const Appointment = require('../../models/Appointment');
const { SESSION_STATUS } = require('../../utils/constants');
const { getOrCreateSession } = require('../../services/sessionService');
const { getISTTime, getISTDate, getISTDateComponents, getISTTimeInMinutes, getISTTimeString, parseDateInIST, parseDateInISTComponents } = require('../../utils/timezoneUtils');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// POST /api/doctors/sessions
exports.createSession = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { date, sessionStartTime, sessionEndTime } = req.body;

  if (!date || !sessionStartTime || !sessionEndTime) {
    return res.status(400).json({
      success: false,
      message: 'Date, start time, and end time are required',
    });
  }

  // Parse date in IST timezone to ensure consistent date handling regardless of server timezone
  const sessionDate = parseDateInIST(date);
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);

  // Check if session already exists for this date
  const existingSession = await Session.findOne({
    doctorId: id,
    date: { $gte: sessionDate, $lt: sessionEndDate },
  });

  if (existingSession) {
    return res.status(400).json({
      success: false,
      message: 'Session already exists for this date',
    });
  }

  // Get doctor to calculate max tokens
  const doctor = await Doctor.findById(id);
  const avgConsultation = doctor.averageConsultationMinutes || 20;

  // Calculate duration in minutes
  const [startHours, startMinutes] = sessionStartTime.split(':').map(Number);
  const [endHours, endMinutes] = sessionEndTime.split(':').map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  const duration = endTotalMinutes - startTotalMinutes;
  const maxTokens = Math.floor(duration / avgConsultation);

  const session = await Session.create({
    doctorId: id,
    date: sessionDate,
    sessionStartTime,
    sessionEndTime,
    maxTokens,
    status: SESSION_STATUS.SCHEDULED,
  });

  return res.status(201).json({
    success: true,
    message: 'Session created successfully',
    data: session,
  });
});

// GET /api/doctors/sessions
exports.getSessions = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { date, status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  // Auto-end expired sessions before fetching
  const { autoEndExpiredSessions } = require('../../services/sessionService');
  await autoEndExpiredSessions();

  const filter = { doctorId: id };
  if (status) filter.status = status;
  if (date) {
    // Parse date in IST timezone to ensure consistent date handling regardless of server timezone
    const dateObj = parseDateInIST(date);
    dateObj.setHours(0, 0, 0, 0);
    const dateObjEnd = new Date(dateObj);
    dateObjEnd.setHours(23, 59, 59, 999);
    filter.date = {
      $gte: dateObj,
      $lt: dateObjEnd,
    };
  }

  const [sessions, total] = await Promise.all([
    Session.find(filter)
      .populate('appointments', 'patientId appointmentDate time tokenNumber status')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Session.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// Helper function to convert time string to minutes (for comparison)
const timeStringToMinutes = (timeStr) => {
  if (!timeStr) {
    console.log('⚠️ [Backend] timeStringToMinutes: Empty time string');
    return null;
  }
  
  // Trim whitespace and convert to string
  timeStr = String(timeStr).trim();
  
  // Handle 12-hour format (e.g., "2:30 PM", "12:00 AM", "5:00 PM", "10:00 AM", "10:00:00 AM")
  // Match with optional space between time and AM/PM, optional seconds, case insensitive
  const amPmMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)\s*$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = parseInt(amPmMatch[2], 10);
    const period = amPmMatch[3].toUpperCase();
    
    // Validate hours and minutes
    if (isNaN(hours) || isNaN(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      console.log('⚠️ [Backend] Invalid time values in 12-hour format:', timeStr, { hours, minutes });
      return null;
    }
    
    // Convert to 24-hour format
    if (period === 'AM' && hours === 12) {
      hours = 0; // 12:00 AM = 0:00 (midnight)
    } else if (period === 'PM' && hours !== 12) {
      hours += 12; // 1:00 PM = 13:00, etc.
    }
    // 12:00 PM stays as 12 (noon)
    
    return hours * 60 + minutes;
  }
  
  // Handle 24-hour format (e.g., "14:30", "00:00", "10:00", "17:00")
  const time24Match = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*$/);
  if (time24Match) {
    const hours = parseInt(time24Match[1], 10);
    const minutes = parseInt(time24Match[2], 10);
    
    // Validate hours and minutes
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.log('⚠️ [Backend] Invalid time values in 24-hour format:', timeStr, { hours, minutes });
      return null;
    }
    
    return hours * 60 + minutes;
  }
  
  // If no match, log error and return null
  console.log('⚠️ [Backend] Failed to parse time string:', timeStr, '(type:', typeof timeStr, 'length:', timeStr.length, ')');
  return null;
};

// Helper function to check if current time is within session time
const isWithinSessionTime = (sessionStartTime, sessionEndTime, sessionDate) => {
  if (!sessionStartTime || !sessionEndTime || !sessionDate) {
    console.log('⚠️ [Backend] Missing session time data:', { sessionStartTime, sessionEndTime, sessionDate });
    return false;
  }
  
  // Use IST time for doctor session operations
  const now = getISTTime();
  
  // Get IST date components for comparison (avoid timezone issues with Date objects)
  let todayComponents;
  let sessionComponents;
  try {
    todayComponents = getISTDateComponents();
    sessionComponents = parseDateInISTComponents(sessionDate);
  } catch (error) {
    console.log('⚠️ [Backend] Error parsing session date:', error, sessionDate, typeof sessionDate);
    return false;
  }
  
  // Check if it's the same day by comparing date components directly
  // This avoids timezone issues with Date object comparisons
  const todayStr = `${todayComponents.year}-${String(todayComponents.month + 1).padStart(2, '0')}-${String(todayComponents.day).padStart(2, '0')}`;
  const sessionStr = `${sessionComponents.year}-${String(sessionComponents.month + 1).padStart(2, '0')}-${String(sessionComponents.day).padStart(2, '0')}`;
  
  if (todayComponents.year !== sessionComponents.year || 
      todayComponents.month !== sessionComponents.month || 
      todayComponents.day !== sessionComponents.day) {
    console.log('⚠️ [Backend] Session date mismatch:', {
      today: todayStr,
      sessionDay: sessionStr,
      todayComponents,
      sessionComponents,
      sessionDateType: typeof sessionDate,
      sessionDateValue: sessionDate instanceof Date ? sessionDate.toISOString() : sessionDate,
    });
    return false;
  }
  
  // Use IST time for comparison
  const currentMinutes = getISTTimeInMinutes();
  const startMinutes = timeStringToMinutes(sessionStartTime);
  const endMinutes = timeStringToMinutes(sessionEndTime);
  
  // Validate all time values
  if (currentMinutes === null || currentMinutes === undefined || isNaN(currentMinutes)) {
    console.log('⚠️ [Backend] Invalid current time:', { currentMinutes, type: typeof currentMinutes });
    return false;
  }
  
  if (startMinutes === null || endMinutes === null) {
    console.log('⚠️ [Backend] Failed to parse session times:', { 
      sessionStartTime, 
      sessionStartTimeType: typeof sessionStartTime,
      sessionEndTime, 
      sessionEndTimeType: typeof sessionEndTime,
      startMinutes, 
      endMinutes,
      currentMinutes 
    });
    return false;
  }
  
  // Ensure all values are valid numbers
  if (isNaN(startMinutes) || isNaN(endMinutes)) {
    console.log('⚠️ [Backend] Session times are not valid numbers:', { 
      sessionStartTime, 
      sessionEndTime, 
      startMinutes, 
      endMinutes,
      startMinutesType: typeof startMinutes,
      endMinutesType: typeof endMinutes,
    });
    return false;
  }
  
  const isWithin = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  
  // Get IST time string for logging
  const istTimeString = getISTTimeString();
  
  console.log('🕐 [Backend] Session time check:', {
    currentTime: istTimeString,
    currentMinutes,
    sessionStartTime,
    sessionStartTimeType: typeof sessionStartTime,
    sessionEndTime,
    sessionEndTimeType: typeof sessionEndTime,
    startMinutes,
    endMinutes,
    isWithin,
    comparison: `${currentMinutes} >= ${startMinutes} && ${currentMinutes} <= ${endMinutes}`,
    dateMatch: true,
    todayDate: todayStr,
    sessionDate: sessionStr,
  });
  
  if (!isWithin) {
    console.log('❌ [Backend] Time validation failed:', {
      reason: currentMinutes < startMinutes 
        ? `Current time (${currentMinutes} min = ${istTimeString}) is before session start (${startMinutes} min = ${sessionStartTime})`
        : `Current time (${currentMinutes} min = ${istTimeString}) is after session end (${endMinutes} min = ${sessionEndTime})`,
      currentMinutes,
      startMinutes,
      endMinutes,
      difference: currentMinutes < startMinutes 
        ? `${startMinutes - currentMinutes} minutes before start`
        : `${currentMinutes - endMinutes} minutes after end`,
    });
  }
  
  return isWithin;
};

// PATCH /api/doctors/sessions/:id
exports.updateSession = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const sessionId = req.params.id || req.params.sessionId; // Support both :id and :sessionId
  const { status, sessionStartTime, sessionEndTime, notes } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required',
    });
  }

  // Auto-end expired sessions before processing update
  const { autoEndExpiredSessions } = require('../../services/sessionService');
  await autoEndExpiredSessions();

  const session = await Session.findOne({
    _id: sessionId,
    doctorId: id,
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found',
    });
  }

  // If session was auto-ended, return appropriate response
  if (session.status === SESSION_STATUS.COMPLETED) {
    return res.status(200).json({
      success: true,
      message: 'Session has already ended automatically at the scheduled end time.',
      data: session,
    });
  }

  // Validate session can be started - check if current time is within session time range
  if (status === SESSION_STATUS.LIVE) {
    const sessionStart = sessionStartTime || session.sessionStartTime;
    const sessionEnd = sessionEndTime || session.sessionEndTime;
    
    // Get current time in IST
    const currentTime = getISTTimeString();
    const currentMinutes = getISTTimeInMinutes();
    const startMinutes = timeStringToMinutes(sessionStart);
    const endMinutes = timeStringToMinutes(sessionEnd);
    
    // Validate time values
    if (currentMinutes === null || startMinutes === null || endMinutes === null) {
      return res.status(400).json({
        success: false,
        message: `Unable to validate session time. Please check session timing: ${sessionStart} - ${sessionEnd}`,
        data: {
          sessionStartTime: sessionStart,
          sessionEndTime: sessionEnd,
          currentTime: currentTime,
        },
      });
    }
    
    // Check if current time is within session time range
    const isWithinTime = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    
    if (!isWithinTime) {
      let errorMessage;
      if (currentMinutes < startMinutes) {
        errorMessage = `Session can only be started at or after ${sessionStart}. Current time: ${currentTime}`;
      } else {
        errorMessage = `Session can only be started before ${sessionEnd}. Current time: ${currentTime}`;
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        data: {
          sessionStartTime: sessionStart,
          sessionEndTime: sessionEnd,
          currentTime: currentTime,
          currentMinutes: currentMinutes,
          startMinutes: startMinutes,
          endMinutes: endMinutes,
        },
      });
    }
    
    if (!session.startedAt) {
      // Use IST time for doctor session operations
      session.startedAt = getISTTime();
    }
  }

  if (status === SESSION_STATUS.COMPLETED && !session.endedAt) {
    // Use IST time for doctor session operations
    session.endedAt = getISTTime();
  }

  // Store old status before updating
  const oldStatus = session.status;

  if (sessionStartTime) session.sessionStartTime = sessionStartTime;
  if (sessionEndTime) session.sessionEndTime = sessionEndTime;
  if (status) session.status = status;
  if (notes) session.notes = notes;

  await session.save();

  // Recalculate ETAs when session status changes to LIVE or COMPLETED
  if (status === SESSION_STATUS.LIVE || status === SESSION_STATUS.COMPLETED) {
    try {
      const { recalculateSessionETAs } = require('../../services/etaService');
      const { getIO } = require('../../config/socket');
      const io = getIO();
      
      const etas = await recalculateSessionETAs(session._id);
      
      // Send ETA updates to all waiting patients via Socket.IO
      for (const eta of etas) {
        if (eta.patientId) {
          io.to(`patient-${eta.patientId}`).emit('token:eta:update', {
            appointmentId: eta.appointmentId,
            estimatedWaitMinutes: eta.estimatedWaitMinutes,
            estimatedCallTime: eta.estimatedCallTime,
            patientsAhead: eta.patientsAhead,
            tokenNumber: eta.tokenNumber,
            sessionStatus: status,
          });
        }
      }
      
      const statusMessage = status === SESSION_STATUS.LIVE 
        ? 'Session started' 
        : 'Session ended';
      console.log(`✅ ${statusMessage}: Recalculated and sent ETAs for ${etas.length} appointments`);
    } catch (error) {
      console.error(`Error recalculating ETAs on session ${status}:`, error);
    }
  }

  // Emit real-time event
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to(`doctor-${id}`).emit('session:updated', {
      session: await Session.findById(session._id),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Create notification for doctor and all patients based on status
  if (status) {
    try {
      const { createSessionNotification, createNotification } = require('../../services/notificationService');
      const { getIO } = require('../../config/socket');
      const io = getIO();
      
      let eventType = null;
      let patientMessage = '';
      
      if (status === SESSION_STATUS.LIVE) {
        eventType = 'started';
        patientMessage = 'Doctor has started the session. Your appointment will begin soon.';
      } else if (status === SESSION_STATUS.COMPLETED) {
        eventType = 'completed';
        patientMessage = 'Doctor has ended the session. Please contact the clinic for any queries.';
      }

      // Notify doctor - REMOVED: Doctors don't need session started/completed notifications
      // Only patients receive these notifications
      // if (eventType) {
      //   await createSessionNotification({
      //     userId: id,
      //     userType: 'doctor',
      //     session,
      //     eventType,
      //   }).catch((error) => console.error('Error creating doctor session notification:', error));
      // }

      // Notify all patients in the session
      if (eventType && (status === SESSION_STATUS.LIVE || status === SESSION_STATUS.COMPLETED)) {
        const Appointment = require('../../models/Appointment');
        const appointments = await Appointment.find({
          sessionId: session._id,
          status: { $in: ['scheduled', 'confirmed', 'waiting', 'in_progress', 'called', 'in-consultation'] },
        }).populate('patientId', '_id firstName lastName');

        for (const appointment of appointments) {
          if (appointment.patientId && appointment.patientId._id) {
            // Create in-app notification for patient
            await createNotification({
              userId: appointment.patientId._id,
              userType: 'patient',
              type: 'session',
              title: eventType === 'started' ? 'Session Started' : 'Session Ended',
              message: patientMessage,
              data: {
                sessionId: session._id.toString(),
                appointmentId: appointment._id.toString(),
                eventType,
                status,
              },
              priority: 'high',
              actionUrl: '/patient/appointments',
              icon: 'session',
            }).catch((error) => console.error(`Error creating notification for patient ${appointment.patientId._id}:`, error));

            // Emit real-time event to patient
            io.to(`patient-${appointment.patientId._id}`).emit('session:status:changed', {
              sessionId: session._id.toString(),
              appointmentId: appointment._id.toString(),
              status,
              eventType,
              message: patientMessage,
            });
          }
        }

        console.log(`✅ Sent ${eventType} notifications to ${appointments.length} patients`);
      }
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Session updated successfully',
    data: session,
  });
});

// DELETE /api/doctors/sessions/:id - Cancel session and all appointments
exports.deleteSession = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const sessionId = req.params.id || req.params.sessionId; // Support both :id and :sessionId
  const { reason } = req.body; // Get cancellation reason from request body
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required',
    });
  }

  const session = await Session.findOne({
    _id: sessionId,
    doctorId: id,
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found',
    });
  }

  // Allow cancelling live sessions - user requirement
  // if (session.status === SESSION_STATUS.LIVE) {
  //   return res.status(400).json({
  //     success: false,
  //     message: 'Cannot cancel active session. Please end the session first.',
  //   });
  // }

  if (session.status === SESSION_STATUS.CANCELLED) {
    return res.status(400).json({
      success: false,
      message: 'Session is already cancelled',
    });
  }

  const cancellationReason = reason || 'Session cancelled by doctor';

  // Find all appointments in this session that should be cancelled
  // EXCLUDE completed appointments - they should remain completed
  // Only cancel: scheduled, confirmed, waiting, called, in-consultation, in_progress, skipped, cancelled (no-show)
  // Also include appointments with skipped queueStatus
  const cancelledAppointments = await Appointment.find({
    sessionId: session._id,
    status: { $ne: 'completed' }, // Exclude completed appointments
    $or: [
      { status: { $in: ['scheduled', 'confirmed', 'waiting', 'called', 'in-consultation', 'in_progress', 'cancelled'] } },
      { queueStatus: 'skipped' }
    ]
  }).populate('patientId', 'firstName lastName email').populate('doctorId', 'firstName lastName specialization profileImage');

  // Update all pending appointments with cancellation details
  // Keep completed appointments as completed
  // Use cancelled_by_session status to distinguish from other cancellations
  await Appointment.updateMany(
    { 
      sessionId: session._id,
      status: { $ne: 'completed' }, // Exclude completed appointments
      $or: [
        { status: { $in: ['scheduled', 'confirmed', 'waiting', 'called', 'in-consultation', 'in_progress', 'cancelled'] } },
        { queueStatus: 'skipped' }
      ]
    },
    { 
      status: 'cancelled_by_session',
      queueStatus: 'cancelled',
      cancelledAt: getISTTime(),
      cancelledBy: 'doctor',
      cancellationReason: cancellationReason,
      // Clear reschedule info if it was rescheduled and now cancelled
      rescheduledAt: null,
      rescheduledBy: null,
      rescheduleReason: null,
    }
  );

  // Update session status to cancelled instead of deleting
  session.status = SESSION_STATUS.CANCELLED;
  // Use IST time for doctor session operations
  session.endedAt = getISTTime();
  await session.save();

  // Send notifications to all affected patients
  try {
    const { sendAppointmentCancellationEmail, createAppointmentNotification } = require('../../services/notificationService');
    const { getIO } = require('../../config/socket');
    const io = getIO();

    for (const appointment of cancelledAppointments) {
      // Get populated appointment for notifications
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('doctorId', 'firstName lastName specialization profileImage')
        .populate('sessionId', 'date sessionStartTime sessionEndTime');

      // Send email notification
      if (appointment.patientId && appointment.doctorId) {
        await sendAppointmentCancellationEmail({
          patient: appointment.patientId,
          doctor: appointment.doctorId,
          appointment: populatedAppointment,
          cancelledBy: 'doctor',
          reason: cancellationReason,
        }).catch((error) => console.error('Error sending cancellation email:', error));
      }

      // Get patient data for email notification
      const Patient = require('../../models/Patient');
      const patient = await Patient.findById(appointment.patientId._id).select('email firstName lastName');

      // Create in-app notification for patient (with email)
      if (appointment.patientId) {
        await createAppointmentNotification({
          userId: appointment.patientId._id,
          userType: 'patient',
          appointment: populatedAppointment,
          eventType: 'cancelled',
          doctor: appointment.doctorId,
          patient,
          sendEmail: true,
        }).catch((error) => console.error('Error creating cancellation notification:', error));
      }

      // Emit real-time event to patient
      if (appointment.patientId) {
        io.to(`patient-${appointment.patientId._id}`).emit('appointment:cancelled', {
          appointmentId: appointment._id,
          reason: cancellationReason,
          cancelledBy: 'doctor',
          canReschedule: true,
        });
      }
    }

    console.log(`✅ Session ${sessionId} cancelled: ${cancelledAppointments.length} appointments cancelled, notifications sent`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Session cancelled successfully. All appointments have been cancelled and patients have been notified.',
    data: {
      sessionId: session._id,
      cancelledAppointments: cancelledAppointments.length,
      sessionStatus: session.status,
    },
  });
});

