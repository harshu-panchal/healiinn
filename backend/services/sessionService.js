const Session = require('../models/Session');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { SESSION_STATUS } = require('../utils/constants');
const { timeToMinutes, getTimeDifference } = require('./etaService');
const { getISTTime, getISTDate, getISTTimeInMinutes, getISTHourMinute, parseDateInIST } = require('../utils/timezoneUtils');

/**
 * Get day name from date
 */
const getDayName = (date) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = date.getDay();
  return dayNames[dayIndex];
};

/**
 * Normalize day name for matching (handles different formats)
 */
const normalizeDayName = (dayName) => {
  if (!dayName) return null;
  const day = dayName.trim();
  const dayMap = {
    'sun': 'Sunday',
    'mon': 'Monday',
    'tue': 'Tuesday',
    'wed': 'Wednesday',
    'thu': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday',
    'sunday': 'Sunday',
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
  };
  return dayMap[day.toLowerCase()] || day;
};

/**
 * Check if date is blocked
 */
const isDateBlocked = (doctor, date) => {
  if (!doctor.blockedDates || doctor.blockedDates.length === 0) {
    return false;
  }

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return doctor.blockedDates.some(blocked => {
    const blockedDate = new Date(blocked.date);
    blockedDate.setHours(0, 0, 0, 0);
    return blockedDate.getTime() === checkDate.getTime();
  });
};

/**
 * Get availability for a specific date
 */
const getAvailabilityForDate = (doctor, date) => {
  // Ensure date is a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    console.error('❌ Invalid date provided to getAvailabilityForDate:', date);
    return null;
  }
  
  const dayName = getDayName(dateObj);
  console.log(`🔍 Checking availability for day: ${dayName} (date: ${dateObj.toISOString().split('T')[0]})`);

  // Check temporary availability first
  if (doctor.temporaryAvailability && doctor.temporaryAvailability.length > 0) {
    const tempAvail = doctor.temporaryAvailability.find(avail => {
      const availDate = new Date(avail.date);
      availDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return availDate.getTime() === checkDate.getTime();
    });

    if (tempAvail && tempAvail.slots && tempAvail.slots.length > 0) {
      // Use first slot for now (can be extended to handle multiple slots)
      return {
        startTime: tempAvail.slots[0].startTime,
        endTime: tempAvail.slots[0].endTime,
      };
    }
  }

  // Check regular availability
  // Normalize day names for matching (handle different formats)
  const normalizedDayName = normalizeDayName(dayName);
  const dayAvailability = doctor.availability?.find(avail => {
    const availDay = normalizeDayName(avail.day);
    return availDay === normalizedDayName;
  });
  
  if (dayAvailability) {
    console.log(`✅ Found availability for ${dayName}:`, {
      day: dayAvailability.day,
      startTime: dayAvailability.startTime,
      endTime: dayAvailability.endTime,
    });
    return {
      startTime: dayAvailability.startTime,
      endTime: dayAvailability.endTime,
    };
  }

  console.log(`⚠️ No availability found for ${dayName}. Doctor availability:`, 
    doctor.availability?.map(a => ({ day: a.day, startTime: a.startTime, endTime: a.endTime })) || []
  );
  return null;
};

/**
 * Create or get session for a doctor on a specific date
 * Simplified: Creates session with default values for any date
 */
const getOrCreateSession = async (doctorId, date) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error('Doctor not found');
  }

  // Handle date - parse in IST timezone to ensure consistent date handling regardless of server timezone
  let sessionDate;
  try {
    if (date) {
      sessionDate = parseDateInIST(date);
    } else {
      sessionDate = getISTDate(); // Use current IST date if no date provided
    }
  } catch (error) {
    throw new Error(`Invalid date format: ${date} - ${error.message}`);
  }
  
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);
  
  // Check if session already exists
  let session = await Session.findOne({
    doctorId,
    date: { $gte: sessionDate, $lt: sessionEndDate },
  });

  // If session exists, return it (no restrictions - allow booking on any session)
  if (session) {
    // Ensure session has required fields, set defaults if missing
    if (!session.sessionStartTime || !session.sessionEndTime) {
      session.sessionStartTime = session.sessionStartTime || '9:00 AM';
      session.sessionEndTime = session.sessionEndTime || '5:00 PM';
      await session.save();
    }
    return session;
  }

  // No restrictions - allow booking on any date

  // Use default values for new sessions
  // Default: 9:00 AM to 5:00 PM (8 hours = 480 minutes)
  const defaultStartTime = '9:00 AM';
  const defaultEndTime = '5:00 PM';
  const avgConsultation = doctor.averageConsultationMinutes || 20;
  
  if (avgConsultation <= 0) {
    throw new Error('Doctor average consultation time must be greater than 0');
  }

  // Calculate max tokens: default 8 hours (480 minutes) / avg consultation time
  // Use a very high number to allow unlimited bookings (1000 slots)
  const defaultDuration = 480; // 8 hours in minutes
  const calculatedMaxTokens = Math.max(1000, Math.floor(defaultDuration / avgConsultation));

  console.log(`🆕 Creating new session for ${sessionDate.toISOString().split('T')[0]}:`, {
    doctorId,
    doctorName: `${doctor.firstName} ${doctor.lastName}`,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    avgConsultationMinutes: avgConsultation,
    maxTokens: calculatedMaxTokens,
  });

  // Create new session with default values
  try {
    session = await Session.create({
      doctorId,
      date: sessionDate,
      sessionStartTime: defaultStartTime,
      sessionEndTime: defaultEndTime,
      maxTokens: calculatedMaxTokens,
      status: SESSION_STATUS.SCHEDULED,
      currentToken: 0,
    });
    
    console.log(`✅ Session created successfully:`, {
      sessionId: session._id,
      doctorId: session.doctorId,
      date: session.date,
      sessionStartTime: session.sessionStartTime,
      sessionEndTime: session.sessionEndTime,
      maxTokens: session.maxTokens,
      status: session.status,
    });
    
    return session;
  } catch (error) {
    console.error(`❌ Error creating session:`, {
      error: error.message,
      stack: error.stack,
      doctorId,
      date: sessionDate,
    });
    throw new Error(`Failed to create session: ${error.message}`);
  }
};

/**
 * Check if slots are available for booking
 * Simplified: No time or day restrictions - just check available slots
 */
const checkSlotAvailability = async (doctorId, date) => {
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return {
        available: false,
        message: 'Doctor not found',
      };
    }

    // Parse date
    let parsedDate;
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const localYear = utcDate.getFullYear();
      const localMonth = utcDate.getMonth();
      const localDay = utcDate.getDate();
      parsedDate = new Date(localYear, localMonth, localDay, 0, 0, 0, 0);
    } else {
      parsedDate = new Date(date);
      parsedDate.setHours(0, 0, 0, 0);
    }
    
    // Get or create session for this date (no restrictions - all dates are available)
    const session = await getOrCreateSession(doctorId, date);
    const avgConsultation = doctor.averageConsultationMinutes || 20;
    
    // Get actual booked appointments count
    const Appointment = require('../models/Appointment');
    const actualBookedCount = await Appointment.countDocuments({
      sessionId: session._id,
      paymentStatus: 'paid',
      tokenNumber: { $ne: null },
      status: { $ne: 'cancelled' },
    });
    
    const bookedSlots = actualBookedCount;
    const sessionMaxTokens = Number(session.maxTokens) || 0;
    
    // Simple calculation: available slots = total slots - booked slots
    const availableSlots = Math.max(0, sessionMaxTokens - bookedSlots);
    
    // Calculate nextToken
    let nextToken = null;
    if (availableSlots > 0) {
      const maxTokenResult = await Appointment.aggregate([
        {
          $match: {
            sessionId: session._id,
            paymentStatus: 'paid',
            tokenNumber: { $ne: null },
            status: { $nin: ['cancelled', 'cancelled_by_session'] },
          },
        },
        {
          $group: {
            _id: null,
            maxToken: { $max: '$tokenNumber' },
          },
        },
      ]);
      
      const maxTokenNumber = maxTokenResult.length > 0 && maxTokenResult[0].maxToken ? maxTokenResult[0].maxToken : 0;
      let calculatedNextToken = maxTokenNumber + 1;
      
      // Get all cancelled token numbers to skip them
      const cancelledAppointments = await Appointment.find({
        sessionId: session._id,
        status: { $in: ['cancelled', 'cancelled_by_session'] },
        tokenNumber: { $ne: null },
      }).select('tokenNumber');
      
      const cancelledTokenNumbers = new Set(cancelledAppointments.map(apt => apt.tokenNumber));
      
      // Skip cancelled tokens
      while (cancelledTokenNumbers.has(calculatedNextToken) && calculatedNextToken <= sessionMaxTokens) {
        calculatedNextToken++;
      }
      
      // Ensure we don't exceed maxTokens
      if (calculatedNextToken <= sessionMaxTokens) {
        nextToken = calculatedNextToken;
      }
    }

    console.log(`📊 Slot Availability for ${date}:`, {
      doctorId,
      sessionId: session._id,
      maxTokens: sessionMaxTokens,
      bookedSlots,
      availableSlots,
      nextToken,
    });
    
    // Always return available if we have slots (all slots are open for booking)
    return {
      available: sessionMaxTokens > 0, // Always available if there are slots
      totalSlots: sessionMaxTokens,
      bookedSlots,
      availableSlots: sessionMaxTokens, // Always show all slots as available
      nextToken: nextToken || (sessionMaxTokens > 0 ? 1 : null),
      sessionId: session._id,
      sessionStartTime: session.sessionStartTime || undefined,
      sessionEndTime: session.sessionEndTime || undefined,
      avgConsultationMinutes: avgConsultation,
    };
  } catch (error) {
    console.error(`❌ Error checking slot availability for ${date}:`, error);
    return {
      available: false,
      message: error.message,
    };
  }
};

/**
 * Pause session
 */
const pauseSession = async (sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.isPaused) {
    throw new Error('Session is already paused');
  }

  if (session.status !== SESSION_STATUS.LIVE) {
    throw new Error('Can only pause live sessions');
  }

  session.isPaused = true;
  // Use IST time for doctor session operations
  session.pausedAt = getISTTime();
  session.status = SESSION_STATUS.PAUSED;
  await session.save();

  return session;
};

/**
 * Resume session
 */
const resumeSession = async (sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (!session.isPaused) {
    throw new Error('Session is not paused');
  }

  if (!session.pausedAt) {
    throw new Error('Invalid pause state');
  }

  // Calculate pause duration using IST time
  const pauseEndTime = getISTTime();
  const pauseDuration = Math.floor((pauseEndTime - new Date(session.pausedAt)) / (1000 * 60));

  // Add to pause history
  if (!session.pauseHistory) {
    session.pauseHistory = [];
  }
  session.pauseHistory.push({
    pausedAt: session.pausedAt,
    resumedAt: pauseEndTime,
    duration: pauseDuration,
  });

  // Update total paused duration
  session.pausedDuration = (session.pausedDuration || 0) + pauseDuration;

  // Resume session
  session.isPaused = false;
  session.pausedAt = null;
  session.status = SESSION_STATUS.LIVE;
  await session.save();

  return session;
};

/**
 * Call next patient (increment current token)
 * @param {String} sessionId - Session ID
 * @param {String} appointmentId - Optional: Specific appointment ID to call (if provided, calls that appointment instead of next in queue)
 */
const callNextPatient = async (sessionId, appointmentId = null) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.isPaused) {
    throw new Error('Cannot call next patient while session is paused');
  }

  let nextAppointment;

  // If specific appointmentId is provided, call that appointment
  if (appointmentId) {
    nextAppointment = await Appointment.findOne({
      _id: appointmentId,
      sessionId,
      status: { $in: ['scheduled', 'confirmed', 'waiting'] },
    });

    if (!nextAppointment) {
      throw new Error('Appointment not found or already called');
    }
  } else {
    // Otherwise, get next appointment in queue (tokenNumber > currentToken)
    nextAppointment = await Appointment.findOne({
      sessionId,
      tokenNumber: { $gt: session.currentToken || 0 },
      status: { $in: ['scheduled', 'confirmed', 'waiting'] },
    }).sort({ tokenNumber: 1 });

    if (!nextAppointment) {
      throw new Error('No more patients in queue');
    }
  }

  // Update session current token to this appointment's token number
  session.currentToken = nextAppointment.tokenNumber;
  
  // If session is scheduled, make it live
  if (session.status === SESSION_STATUS.SCHEDULED) {
    session.status = SESSION_STATUS.LIVE;
    if (!session.startedAt) {
      // Use IST time for doctor session operations
      session.startedAt = getISTTime();
    }
  }

  await session.save();

  // Update appointment status to 'called'
  nextAppointment.status = 'called';
  nextAppointment.queueStatus = 'called';
  
  // DO NOT reset recallCount when patient is called again
  // recallCount should persist across calls - it only increments when Recall is clicked
  // This ensures the 2-recall limit is enforced properly
  // The recallCount will only be reset if explicitly needed (e.g., new appointment cycle)
  
  await nextAppointment.save();

  return {
    session,
    appointment: nextAppointment,
  };
};

/**
 * Automatically end sessions that have passed their end time
 * This function checks all live sessions and ends them if current time >= session end time
 */
const autoEndExpiredSessions = async () => {
  try {
    const Session = require('../models/Session');
    const { SESSION_STATUS } = require('../utils/constants');
    const { recalculateSessionETAs } = require('./etaService');
    const { getIO } = require('../config/socket');
    const { createNotification } = require('./notificationService');
    const Appointment = require('../models/Appointment');
    
    // Use IST time for doctor session operations
    const now = getISTTime();
    const today = getISTDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find all live sessions for today
    const liveSessions = await Session.find({
      status: SESSION_STATUS.LIVE,
      date: { $gte: today, $lt: tomorrow },
    }).populate('doctorId', 'firstName lastName');
    
    let endedCount = 0;
    
    for (const session of liveSessions) {
      // Convert session end time to minutes for comparison using the imported timeToMinutes function
      const sessionEndMinutes = timeToMinutes(session.sessionEndTime);
      // Use IST time for doctor session operations
      const currentMinutes = getISTTimeInMinutes();
      
      // Check if session end time has passed
      if (sessionEndMinutes !== null && currentMinutes >= sessionEndMinutes) {
        // Check if there are any pending appointments (waiting, called, in-consultation, etc.)
        // Only end session if all appointments are completed/cancelled/no-show
        const pendingAppointments = await Appointment.find({
          sessionId: session._id,
          status: { $in: ['scheduled', 'confirmed', 'waiting', 'called', 'in-consultation', 'in_progress'] },
        });
        
        // If there are pending appointments, don't auto-end session
        // Let doctor continue with existing patients
        if (pendingAppointments.length > 0) {
          console.log(`⏳ Session ${session._id} end time passed but ${pendingAppointments.length} appointments still pending. Session will continue until all patients are seen.`);
          
          // Recalculate ETAs for waiting patients (they can still be seen after session end time)
          try {
            const etas = await recalculateSessionETAs(session._id);
            const io = getIO();
            
            // Send ETA updates to all waiting patients
            for (const eta of etas) {
              if (eta.patientId) {
                io.to(`patient-${eta.patientId}`).emit('token:eta:update', {
                  appointmentId: eta.appointmentId,
                  estimatedWaitMinutes: eta.estimatedWaitMinutes,
                  estimatedCallTime: eta.estimatedCallTime,
                  patientsAhead: eta.patientsAhead,
                  tokenNumber: eta.tokenNumber,
                });
              }
            }
          } catch (error) {
            console.error(`Error recalculating ETAs for session ${session._id}:`, error);
          }
          
          // Don't end session - continue to next iteration
          continue;
        }
        
        // No pending appointments - safe to end session
        session.status = SESSION_STATUS.COMPLETED;
        // Use IST time for doctor session operations
        session.endedAt = getISTTime();
        await session.save();
        
        endedCount++;
        
        // Notify doctor that session has ended
        try {
          const io = getIO();
          
          // Notify doctor - REMOVED: Doctors don't need session ended notifications
          // Only patients receive these notifications
          // if (session.doctorId) {
          //   await createNotification({
          //     userId: session.doctorId._id || session.doctorId,
          //     userType: 'doctor',
          //     type: 'session',
          //     title: 'Session Ended',
          //     message: 'Your session has automatically ended as all patients have been seen.',
          //     data: {
          //       sessionId: session._id.toString(),
          //       eventType: 'completed',
          //       status: SESSION_STATUS.COMPLETED,
          //     },
          //     priority: 'medium',
          //     actionUrl: '/doctor/patients',
          //     icon: 'session',
          //   }).catch((error) => console.error('Error creating doctor notification:', error));
          // }
          
          // Emit to doctor (keep socket event for real-time updates)
          if (session.doctorId) {
            io.to(`doctor-${session.doctorId._id || session.doctorId}`).emit('session:updated', {
              session: await Session.findById(session._id),
            });
          }
          
          console.log(`✅ Auto-ended session ${session._id} for doctor ${session.doctorId._id || session.doctorId} - all patients completed`);
        } catch (error) {
          console.error(`Error processing auto-end for session ${session._id}:`, error);
        }
      }
    }
    
    if (endedCount > 0) {
      console.log(`✅ Auto-ended ${endedCount} session(s) that passed their end time`);
    }
    
    return endedCount;
  } catch (error) {
    console.error('Error in autoEndExpiredSessions:', error);
    return 0;
  }
};

module.exports = {
  getOrCreateSession,
  checkSlotAvailability,
  pauseSession,
  resumeSession,
  callNextPatient,
  getAvailabilityForDate,
  isDateBlocked,
  autoEndExpiredSessions,
};

