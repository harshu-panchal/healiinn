import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import { 
  getPatientQueue, 
  getPatientById, 
  getPatientHistory,
  getDoctorQueue,
  callNextPatient,
  skipPatient,
  recallPatient,
  updateQueueStatus,
  updateSession,
  cancelSession,
  markNoShow
} from '../doctor-services/doctorService'
import { useToast } from '../../../contexts/ToastContext'
import { getSocket } from '../../../utils/socketClient'
import { useCall } from '../../../contexts/CallContext'
import {
  IoPeopleOutline,
  IoSearchOutline,
  IoPlayOutline,
  IoArrowForwardOutline,
  IoArrowBackOutline,
  IoCloseOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoCallOutline,
  IoDocumentTextOutline,
  IoMedicalOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoRefreshOutline,
  IoAddOutline,
  IoCloseCircleOutline,
  IoVideocamOutline,
} from 'react-icons/io5'

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Mock data removed - now using getPatientHistory API

// Helper function to convert 12-hour time to 24-hour format
const convertTo24Hour = (time12) => {
  if (!time12) return '00:00'
  // If already in 24-hour format (no AM/PM), return as is
  if (!time12.toString().includes('AM') && !time12.toString().includes('PM')) {
    return time12
  }
  // Handle 12-hour format
  const timeStr = time12.toString().trim()
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return '00:00'
  
  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const period = match[3].toUpperCase()
  
  if (period === 'PM' && hours !== 12) {
    hours += 12
  } else if (period === 'AM' && hours === 12) {
    hours = 0
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`
}

// Helper function to format appointment time from date and time
const formatAppointmentTime = (appointmentDate, time) => {
  if (!appointmentDate || !time) return null
  
  // Convert time to 24-hour format if needed
  const time24 = convertTo24Hour(time)
  
  // Format date string
  let dateStr
  if (appointmentDate instanceof Date) {
    dateStr = appointmentDate.toISOString().split('T')[0]
  } else if (typeof appointmentDate === 'string') {
    dateStr = appointmentDate.split('T')[0]
  } else {
    return null
  }
  
  return `${dateStr}T${time24}:00`
}

const formatTime = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    // If it's already a formatted time string (contains AM/PM), return as is
    if (typeof dateString === 'string' && (dateString.includes('AM') || dateString.includes('PM'))) {
      // Check if it's a malformed string like "2025-12-08T18:30:00.000ZT12:30 PM"
      if (dateString.includes('T') && (dateString.includes('AM') || dateString.includes('PM'))) {
        // Extract just the time part
        const timeMatch = dateString.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
        if (timeMatch) {
          return timeMatch[1]
        }
      }
      return dateString
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch (error) {
    console.error('Error formatting time:', error, dateString)
    return 'N/A'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Get average consultation minutes from doctor profile
const getAverageConsultationMinutes = () => {
  try {
    const profile = JSON.parse(localStorage.getItem('doctorProfile') || '{}')
    return profile.averageConsultationMinutes || 20
  } catch {
    return 20
  }
}

// Calculate max tokens based on session time and average consultation minutes
const calculateMaxTokens = (startTime, endTime, averageMinutes) => {
  if (!startTime || !endTime || !averageMinutes) return 0
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  const diffMs = end - start
  const diffMinutes = diffMs / (1000 * 60)
  return Math.floor(diffMinutes / averageMinutes)
}

// Helper function to convert time string to minutes (for comparison)
const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return null
  
  // Handle 12-hour format (e.g., "2:30 PM")
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const [timePart, period] = timeStr.split(/\s*(AM|PM)/i)
    const [hours, minutes] = timePart.split(':').map(Number)
    let totalMinutes = hours * 60 + (minutes || 0)
    
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60 // Add 12 hours for PM
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60 // Subtract 12 hours for 12 AM
    }
    
    return totalMinutes
  }
  
  // Handle 24-hour format (e.g., "14:30")
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

// Helper function to check if current time is within session time
const isWithinSessionTime = (sessionStartTime, sessionEndTime, sessionDate) => {
  if (!sessionStartTime || !sessionEndTime || !sessionDate) {
    console.log('⚠️ Missing session time data:', { sessionStartTime, sessionEndTime, sessionDate })
    return false
  }
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Parse session date - handle various formats
  let sessionDay
  try {
    if (sessionDate instanceof Date) {
      sessionDay = new Date(sessionDate)
    } else if (typeof sessionDate === 'string') {
      // Handle YYYY-MM-DD format
      if (sessionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = sessionDate.split('-').map(Number)
        sessionDay = new Date(year, month - 1, day)
      } else {
        sessionDay = new Date(sessionDate)
      }
    } else {
      console.log('⚠️ Invalid session date format:', sessionDate, typeof sessionDate)
      return false
    }
    
    if (isNaN(sessionDay.getTime())) {
      console.log('⚠️ Invalid session date - NaN:', sessionDate)
      return false
    }
    
    sessionDay.setHours(0, 0, 0, 0)
  } catch (error) {
    console.log('⚠️ Error parsing session date:', error, sessionDate)
    return false
  }
  
  // Check if it's the same day
  if (today.getTime() !== sessionDay.getTime()) {
    console.log('⚠️ Session date mismatch:', {
      today: today.toISOString().split('T')[0],
      sessionDay: sessionDay.toISOString().split('T')[0],
      todayTime: today.getTime(),
      sessionDayTime: sessionDay.getTime(),
    })
    return false
  }
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = timeStringToMinutes(sessionStartTime)
  const endMinutes = timeStringToMinutes(sessionEndTime)
  
  if (startMinutes === null || endMinutes === null) {
    console.log('⚠️ Failed to parse session times:', { 
      sessionStartTime, 
      sessionEndTime, 
      startMinutes, 
      endMinutes,
      startType: typeof sessionStartTime,
      endType: typeof sessionEndTime,
    })
    return false
  }
  
  // Check if current time is within session time range (inclusive)
  const isWithin = currentMinutes >= startMinutes && currentMinutes <= endMinutes
  
  console.log('🕐 Session time check:', {
    currentTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    currentMinutes,
    sessionStartTime,
    sessionEndTime,
    startMinutes,
    endMinutes,
    isWithin,
    isBefore: currentMinutes < startMinutes,
    isAfter: currentMinutes > endMinutes,
  })
  
  return isWithin
}

const DoctorPatients = () => {
  const { startCall, updateCallStatus, setCallInfoFull, callInfo: callInfoFull } = useCall()
  console.log('🔵 DoctorPatients component rendering...') // Debug log
  
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  
  console.log('📍 Current pathname:', location.pathname, 'isDashboardPage:', isDashboardPage) // Debug log
  
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  
  // Appointments state - loaded from API
  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState(null)
  
  // Session state
  const [currentSession, setCurrentSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  
  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true)
        setLoadingSession(true)
        setAppointmentsError(null)
        
        // Get today's date in YYYY-MM-DD format
        const todayStr = getTodayDateString()
        
        console.log('🔍 Fetching patient queue for date:', todayStr) // Debug log
        
        const response = await getPatientQueue(todayStr)
        
        console.log('📊 Patient queue API response:', response) // Debug log
        
        if (response && response.success && response.data) {
          // Backend returns: { session: {...}, appointments: [...], currentToken: 0 }
          const sessionData = response.data.session || null
          const queueData = response.data.appointments || response.data.queue || []
          
          console.log('✅ Queue data received:', {
            session: sessionData,
            appointmentsCount: queueData.length,
            firstAppointment: queueData[0],
          }) // Debug log
          
          // Set session data
          if (sessionData) {
            const sessionToSet = {
              id: sessionData._id || sessionData.id,
              _id: sessionData._id || sessionData.id,
              date: sessionData.date,
              startTime: sessionData.sessionStartTime || sessionData.startTime,
              endTime: sessionData.sessionEndTime || sessionData.endTime,
              status: sessionData.status || 'scheduled',
              currentToken: sessionData.currentToken || response.data.currentToken || 0,
              maxTokens: sessionData.maxTokens || 0,
              averageConsultationMinutes: sessionData.averageConsultationMinutes || getAverageConsultationMinutes(),
              startedAt: sessionData.startedAt,
              endedAt: sessionData.endedAt,
            }
            console.log('✅ Setting session data:', sessionToSet) // Debug log
            setCurrentSession(sessionToSet)
          } else {
            console.log('⚠️ No session data in response') // Debug log
            setCurrentSession(null)
            // Clear any cached session data
            localStorage.removeItem('doctorCurrentSession')
          }
          
          // Transform API data to match component structure
          const transformedAppointments = Array.isArray(queueData) ? queueData.map((appt) => ({
            id: appt._id || appt.id,
            _id: appt._id || appt.id,
            patientId: appt.patientId?._id || appt.patientId || appt.patientId?.id,
            patientName: appt.patientId?.firstName && appt.patientId?.lastName
              ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
              : appt.patientId?.name || appt.patientName || 'Patient',
            age: appt.patientId?.age || appt.age || 0,
            gender: appt.patientId?.gender || appt.gender || 'unknown',
            appointmentTime: (() => {
              // Properly format appointment time
              if (appt.appointmentTime) {
                return appt.appointmentTime
              }
              if (appt.appointmentDate && appt.time) {
                // Convert 12-hour time to 24-hour for ISO format
                const convertTo24Hour = (time12) => {
                  if (!time12) return '00:00'
                  if (time12.includes('AM') || time12.includes('PM')) {
                    const [time, period] = time12.split(' ')
                    const [hours, minutes] = time.split(':').map(Number)
                    let hour24 = hours
                    if (period === 'PM' && hours !== 12) hour24 = hours + 12
                    if (period === 'AM' && hours === 12) hour24 = 0
                    return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                  }
                  return time12
                }
                const time24 = convertTo24Hour(appt.time)
                const dateStr = appt.appointmentDate instanceof Date 
                  ? appt.appointmentDate.toISOString().split('T')[0]
                  : appt.appointmentDate.split('T')[0]
                return `${dateStr}T${time24}:00`
              }
              return new Date().toISOString()
            })(),
            appointmentDate: appt.appointmentDate || appt.date,
            appointmentType: appt.appointmentType || appt.type || 'New',
            consultationMode: appt.consultationMode || 'in_person', // Add consultation mode
            status: appt.status || 'waiting',
            queueStatus: appt.queueStatus || appt.status || 'waiting',
            queueNumber: appt.tokenNumber || appt.queueNumber || 0,
            recallCount: appt.recallCount || 0,
            reason: appt.reason || appt.chiefComplaint || 'Consultation',
            time: appt.time, // Store the time field directly
            patientImage: appt.patientId?.profileImage || appt.patientId?.image || appt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            originalData: appt,
          })) : []
          
          console.log('💰 Setting appointments:', {
            count: transformedAppointments.length,
            statuses: transformedAppointments.map(a => a.status),
            tokenNumbers: transformedAppointments.map(a => ({ id: a.id, tokenNumber: a.queueNumber, time: a.time })),
            firstAppointment: transformedAppointments[0] ? {
              id: transformedAppointments[0].id,
              tokenNumber: transformedAppointments[0].queueNumber,
              time: transformedAppointments[0].time,
              originalTokenNumber: transformedAppointments[0].originalData?.tokenNumber,
              originalTime: transformedAppointments[0].originalData?.time,
            } : null,
          }) // Debug log
          
          setAppointments(transformedAppointments)
        } else {
          console.error('❌ Invalid API response:', response) // Debug log
          setAppointments([])
          setCurrentSession(null)
        }
      } catch (error) {
        console.error('❌ Error fetching appointments:', error)
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load appointments'
        setAppointmentsError(errorMessage)
        try {
          if (toast && typeof toast.error === 'function') {
            toast.error(errorMessage)
          }
        } catch (toastError) {
          console.error('Error showing toast:', toastError)
        }
        setAppointments([])
        setCurrentSession(null)
      } finally {
        setLoadingAppointments(false)
        setLoadingSession(false)
      }
    }
    
    // Always fetch when on patients page
    if (location.pathname === '/doctor/patients' || isDashboardPage) {
      fetchAppointments()
      // Refresh every 30 seconds
      const interval = setInterval(fetchAppointments, 30000)
      return () => {
        clearInterval(interval)
      }
    } else {
      // If not on patients page, still set loading to false
      setLoadingAppointments(false)
      setLoadingSession(false)
    }
  }, [location.pathname, isDashboardPage]) // Removed toast from dependencies to avoid re-renders
  
  // Reload appointments when navigating back to this page
  // Appointments are already fetched in the main useEffect above
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Socket listener for real-time queue updates (especially for recall count updates)
  useEffect(() => {
    let socket = getSocket()
    let cleanupFunctions = []

    const setupQueueListener = (socketInstance) => {
      if (!socketInstance) return

      const handleQueueUpdated = (data) => {
      if (data?.appointmentId) {
        // Update appointment state when queue is updated (e.g., after recall, skip)
        setAppointments((prev) =>
          prev.map((appt) => {
            if (appt.id === data.appointmentId || appt._id === data.appointmentId) {
              // If status and queueStatus are provided (e.g., from skip), update them
              // This ensures skipped patients are removed from consultation room immediately
              if (data.status !== undefined || data.queueStatus !== undefined) {
                const preservedRecallCount = appt.recallCount !== undefined && appt.recallCount !== null
                  ? appt.recallCount
                  : (appt.originalData?.recallCount !== undefined && appt.originalData?.recallCount !== null
                      ? appt.originalData.recallCount
                      : 0)
                return {
                  ...appt,
                  status: data.status !== undefined ? data.status : appt.status,
                  queueStatus: data.queueStatus !== undefined ? data.queueStatus : (data.status || appt.queueStatus),
                  recallCount: preservedRecallCount,
                  originalData: {
                    ...(appt.originalData || {}),
                    status: data.status !== undefined ? data.status : appt.originalData?.status,
                    queueStatus: data.queueStatus !== undefined ? data.queueStatus : (data.status || appt.originalData?.queueStatus),
                    recallCount: preservedRecallCount
                  }
                }
              }
              // Update recallCount if provided - this ensures button visibility updates immediately
              if (data.recallCount !== undefined && data.recallCount !== null) {
                const updatedRecallCount = data.recallCount
                return {
                  ...appt,
                  recallCount: updatedRecallCount,
                  status: data.status || appt.status,
                  queueStatus: data.queueStatus || data.status || appt.queueStatus,
                  originalData: {
                    ...(appt.originalData || {}),
                    recallCount: updatedRecallCount
                  }
                }
              }
            }
            return appt
          })
        )
      }
    }

    socketInstance.on('queue:updated', handleQueueUpdated)
    cleanupFunctions.push(() => {
      socketInstance.off('queue:updated', handleQueueUpdated)
    })
    }

    // Try to set up listener if socket is available
    if (socket && socket.connected) {
      setupQueueListener(socket)
    } else if (socket) {
      // Socket exists but not connected yet
      const connectHandler = () => {
        console.log('✅ Socket connected in DoctorPatients (queue listener), setting up listener')
        setupQueueListener(socket)
        socket.off('connect', connectHandler)
      }
      socket.on('connect', connectHandler)
      cleanupFunctions.push(() => socket.off('connect', connectHandler))
    } else {
      // Socket not available, retry after delay
      console.warn('📞 [DoctorPatients] Socket not available for queue listener, will retry...')
      const retryTimer = setTimeout(() => {
        const retrySocket = getSocket()
        if (retrySocket) {
          console.log('✅ Socket available on retry in DoctorPatients (queue listener)')
          if (retrySocket.connected) {
            setupQueueListener(retrySocket)
          } else {
            retrySocket.on('connect', () => {
              console.log('✅ Socket connected on retry in DoctorPatients (queue listener)')
              setupQueueListener(retrySocket)
            })
          }
        } else {
          console.error('❌ Socket still not available after retry in DoctorPatients (queue listener)')
        }
      }, 1000)
      cleanupFunctions.push(() => clearTimeout(retryTimer))
    }

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [])

  // Socket listener for call events (separate useEffect)
  useEffect(() => {
    let socket = getSocket()
    let cleanupFunctions = []

    const setupListeners = (socketInstance) => {
      if (!socketInstance) return

      // Listen for call events
      const handleCallAccepted = (data) => {
      console.log('📞 [DoctorPatients] ====== call:accepted EVENT RECEIVED ======')
      console.log('📞 [DoctorPatients] Event data:', data)
      
      if (data.callId) {
        try {
          // Find the appointment to get patient name
          const appointment = appointments.find(appt => appt.id === data.appointmentId)
          const patientName = appointment?.patientName || 'Patient'
          
          // Log patient connection
          console.log('**************patient connected ***************')
          
          // Update call status to 'connecting' (patient accepted, starting WebRTC connection)
          updateCallStatus('connecting')
          setCallInfoFull((prev) => ({
            ...prev,
            callId: data.callId,
            appointmentId: data.appointmentId,
            patientName,
          }))
          
          // Start call popup for doctor to join WebRTC
          startCall(data.callId, patientName)
          console.log('📞 [DoctorPatients] Patient accepted call, callId:', data.callId)
          toast.info('Patient accepted the call, connecting...')
        } catch (error) {
          console.error('Error handling call accepted:', error)
          toast.error(error.message || 'Failed to handle call acceptance')
        }
      }
    }

    // Listen for when patient actually joins the call (mediasoup connected)
    const handlePatientJoined = (data) => {
      console.log('📞 [DoctorPatients] ====== call:patientJoined EVENT RECEIVED ======')
      console.log('📞 [DoctorPatients] Event data:', data)
      console.log('📞 [DoctorPatients] Socket connected:', socket?.connected)
      console.log('📞 [DoctorPatients] Socket ID:', socket?.id)
      console.log('📞 [DoctorPatients] Current callInfoFull:', callInfoFull)
      console.log('📞 [DoctorPatients] Current appointments count:', appointments.length)
      
      if (!data || !data.callId) {
        console.warn('📞 [DoctorPatients] call:patientJoined event missing callId:', data)
        return
      }
      
      try {
        console.log('📞 [DoctorPatients] Processing patient joined event for callId:', data.callId)
        
        // Check if this event is for us (if doctorId is provided in fallback broadcast)
        // If doctorId is provided and doesn't match, we can skip (but we'll still process if callId matches)
        // This allows the event to work even if doctorId filtering isn't perfect
        
        // Check if we're already expecting this call
        // Be more lenient - if we have a callId match OR appointmentId match, process it
        const callIdMatches = callInfoFull?.callId === data.callId
        const appointmentMatches = appointments.some(appt => 
          (appt.id === data.appointmentId || appt._id === data.appointmentId) &&
          appt.consultationMode === 'call'
        )
        const isExpectedCall = callIdMatches || appointmentMatches
        
        if (!isExpectedCall && !callInfoFull?.callId) {
          console.warn('📞 [DoctorPatients] Received call:patientJoined for unexpected call, but processing anyway to avoid missed updates')
          // Don't return - continue processing to ensure status update happens
        }
        
        // Find the appointment to get patient name
        const appointment = appointments.find(appt => 
          appt.id === data.appointmentId || 
          appt._id === data.appointmentId ||
          appt._id?.toString() === data.appointmentId?.toString()
        )
        const patientName = appointment?.patientName || callInfoFull?.patientName || 'Patient'
        
        console.log('📞 [DoctorPatients] Found appointment:', appointment ? 'Yes' : 'No')
        console.log('📞 [DoctorPatients] Patient name:', patientName)
        console.log('📞 [DoctorPatients] Matching appointment ID:', appointment?._id || appointment?.id)
        
        // Update call status to 'started' (patient has fully joined and WebRTC is connected)
        // This is the critical update - ensure it always happens
        console.log('📞 [DoctorPatients] Updating call status to "started"')
        updateCallStatus('started')
        
        setCallInfoFull((prev) => ({
          ...(prev || {}),
          callId: data.callId,
          appointmentId: data.appointmentId,
          patientName,
          startTime: new Date().toISOString(),
        }))
        
        // CallPopup should already be open from call:accepted event
        // Just update status and show success message
        toast.success('Patient joined the call')
        
        console.log('📞 [DoctorPatients] ✅ Successfully processed patient joined event - status should now be "started"')
      } catch (error) {
        console.error('📞 [DoctorPatients] Error processing patient joined:', error)
        console.error('📞 [DoctorPatients] Error stack:', error.stack)
        toast.error(error.message || 'Failed to start call')
      }
    }

    const handleCallError = (data) => {
      toast.error(data.message || 'Call error occurred')
    }

    // Set up listeners with detailed logging
    console.log('📞 [DoctorPatients] Setting up socket listeners for call events')
    console.log('📞 [DoctorPatients] Socket state:', {
      connected: socketInstance?.connected,
      id: socketInstance?.id,
      hasListeners: {
        'call:accepted': socketInstance?.hasListeners?.('call:accepted') || 'unknown',
        'call:patientJoined': socketInstance?.hasListeners?.('call:patientJoined') || 'unknown',
        'call:error': socketInstance?.hasListeners?.('call:error') || 'unknown'
      }
    })
    
    socketInstance.on('call:accepted', handleCallAccepted)
    socketInstance.on('call:patientJoined', handlePatientJoined)
    socketInstance.on('call:error', handleCallError)
    
    // Also listen on socket.io any event to debug
    const debugAllEvents = (eventName, ...args) => {
      if (eventName.startsWith('call:')) {
        console.log(`📞 [DoctorPatients] ====== SOCKET EVENT: ${eventName} ======`)
        console.log(`📞 [DoctorPatients] Event args:`, args)
      }
    }
    socketInstance.onAny(debugAllEvents)

    cleanupFunctions.push(() => {
      console.log('📞 [DoctorPatients] Cleaning up call event socket listeners')
      socketInstance.off('call:accepted', handleCallAccepted)
      socketInstance.off('call:patientJoined', handlePatientJoined)
      socketInstance.off('call:error', handleCallError)
      socketInstance.offAny(debugAllEvents)
    })
    }

    // Try to set up listeners if socket is available
    if (socket && socket.connected) {
      setupListeners(socket)
    } else if (socket) {
      // Socket exists but not connected yet
      const connectHandler = () => {
        console.log('✅ Socket connected in DoctorPatients (call events), setting up listeners')
        setupListeners(socket)
        socket.off('connect', connectHandler)
      }
      socket.on('connect', connectHandler)
      cleanupFunctions.push(() => socket.off('connect', connectHandler))
    } else {
      // Socket not available, retry after delay
      console.warn('📞 [DoctorPatients] Socket not available for call events, will retry...')
      const retryTimer = setTimeout(() => {
        const retrySocket = getSocket()
        if (retrySocket) {
          console.log('✅ Socket available on retry in DoctorPatients (call events)')
          if (retrySocket.connected) {
            setupListeners(retrySocket)
          } else {
            retrySocket.on('connect', () => {
              console.log('✅ Socket connected on retry in DoctorPatients (call events), setting up listeners')
              setupListeners(retrySocket)
            })
          }
        } else {
          console.error('❌ Socket still not available after retry in DoctorPatients (call events)')
        }
      }, 1000)
      cleanupFunctions.push(() => clearTimeout(retryTimer))
    }

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [toast, appointments, callInfoFull, updateCallStatus, setCallInfoFull, startCall])

  // Check session date on mount and clear if not today
  useEffect(() => {
    if (currentSession) {
      // Get today's date in IST by using the date string format (YYYY-MM-DD)
      // This avoids timezone issues - we'll compare date strings directly
      // The backend returns dates in IST, so we should compare using the same format
      const now = new Date()
      // Get date string in local timezone (will be converted properly by backend)
      // For comparison, we'll use the session date format directly
      const todayStr = now.toISOString().split('T')[0]
      
      const sessionDate = currentSession.date
      
      // Format session date for comparison
      let sessionDateStr = null
      if (sessionDate) {
        if (sessionDate instanceof Date) {
          sessionDateStr = sessionDate.toISOString().split('T')[0]
        } else if (typeof sessionDate === 'string') {
          // Handle both YYYY-MM-DD and ISO format
          sessionDateStr = sessionDate.split('T')[0]
        }
      }
      
      // Note: Date comparison here is just for logging/debugging
      // The actual date validation is done by the backend using IST timezone
      // Frontend date might differ due to browser timezone, but backend handles it correctly
      console.log('🔍 Checking session date:', {
        today: todayStr,
        sessionDate: sessionDateStr,
        sessionStatus: currentSession.status,
        match: sessionDateStr === todayStr,
        note: 'Date comparison is for logging only - backend uses IST for validation'
      }) // Debug log
      
      // Only clear if session is cancelled or completed
      // Don't clear based on date mismatch - let backend handle that
      // The backend uses IST timezone and will return the correct session for the requested date
      if (
        currentSession.status === 'cancelled' ||
        currentSession.status === 'completed'
      ) {
        console.log('🗑️ Clearing session due to status:', currentSession.status) // Debug log
        setCurrentSession(null)
        localStorage.removeItem('doctorCurrentSession')
      }
      // Note: We're not clearing based on date mismatch anymore
      // The backend will return the correct session for the requested date using IST
    }
  }, [currentSession])

  // Calculate max tokens for current session
  const maxTokens = currentSession ? currentSession.maxTokens : 0

  const filteredAppointments = appointments.filter((appt) => {
    try {
      // Filter by session date if session exists
      if (currentSession && currentSession.date) {
        const sessionDate = new Date(currentSession.date)
        if (isNaN(sessionDate.getTime())) {
          console.warn('Invalid session date:', currentSession.date)
        } else {
          const appointmentDate = appt.appointmentTime ? new Date(appt.appointmentTime) : null
          if (appointmentDate && !isNaN(appointmentDate.getTime())) {
            // Compare dates (year, month, day only, ignore time)
            const sessionDateStr = sessionDate.toISOString().split('T')[0]
            const appointmentDateStr = appointmentDate.toISOString().split('T')[0]
            
            if (sessionDateStr !== appointmentDateStr) {
              return false
            }
          }
        }
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const patientName = appt.patientName || ''
        const reason = appt.reason || ''
        return (
          patientName.toLowerCase().includes(searchLower) ||
          reason.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    } catch (error) {
      console.error('Error filtering appointment:', error, appt)
      return false
    }
  })

  // Helper function to determine which buttons to show for an appointment
  const getAppointmentButtons = (appointment, sessionStatus) => {
    // If session is not active/live, show no buttons
    if (sessionStatus !== 'active' && sessionStatus !== 'live') {
      return { showButtons: false, buttons: [] }
    }

    const status = appointment.status || appointment.originalData?.status
    const queueStatus = appointment.queueStatus || appointment.originalData?.queueStatus
    // IMPORTANT: Read recallCount from multiple possible locations to ensure we get the correct value
    const recallCount = appointment.recallCount !== undefined 
      ? appointment.recallCount 
      : (appointment.originalData?.recallCount !== undefined 
          ? appointment.originalData.recallCount 
          : 0)
    const consultationMode = appointment.consultationMode || appointment.originalData?.consultationMode
    
    // Debug log for recall button visibility
    if (status === 'called' || status === 'in-consultation' || status === 'in_progress') {
      console.log('🔵 Recall Button Check:', {
        appointmentId: appointment.id || appointment._id,
        status,
        recallCount,
        recallCountFromAppointment: appointment.recallCount,
        recallCountFromOriginal: appointment.originalData?.recallCount,
        willShowRecall: recallCount < 2
      })
    }

    // If appointment is completed, show no buttons (only "Completed" label)
    if (status === 'completed') {
      return { showButtons: false, buttons: [], showCompletedLabel: true }
    }

    // If appointment is cancelled (no-show or cancelled-by-session), show no buttons (only "Cancelled" label)
    if (status === 'cancelled' || status === 'cancelled_by_session' || queueStatus === 'no-show') {
      return { showButtons: false, buttons: [], showCancelledLabel: true }
    }

    // If appointment is skipped, show: Call, Skip, No Show
    if (queueStatus === 'skipped') {
      return {
        showButtons: true,
        buttons: ['call', 'skip', 'noShow'],
        consultationMode
      }
    }

    // If appointment is called/in-consultation/in_progress, show: Video Call (for video_call mode only), Audio Call (for call mode only), Recall (if recallCount < 2), Skip, No Show, Complete
    if (status === 'called' || status === 'in-consultation' || status === 'in_progress') {
      const buttons = ['skip', 'noShow', 'complete']
      // For video_call mode, show video call button (not regular call button) after patient is called
      if (consultationMode === 'video_call') {
        buttons.unshift('videoCall') // Add video call button at the beginning
      }
      // For call mode, show audio call button after patient is called
      if (consultationMode === 'call') {
        buttons.unshift('audioCall') // Add audio call button at the beginning
      }
      if (recallCount < 2) {
        buttons.unshift('recall') // Add recall at the beginning
      }
      return {
        showButtons: true,
        buttons,
        consultationMode
      }
    }

    // If appointment is waiting/scheduled/confirmed (before call), show: Call, Skip, No Show
    // Note: Recall button only shows when patient is called/in-consultation (not when waiting)
    // Note: Audio Call button only shows after patient is called (not before)
    if (status === 'waiting' || status === 'scheduled' || status === 'confirmed') {
      const buttons = ['call', 'skip', 'noShow']
      return {
        showButtons: true,
        buttons,
        consultationMode
      }
    }

    // Default: no buttons
    return { showButtons: false, buttons: [] }
  }

  // Session management functions
  const handleStartSession = async () => {
    if (!currentSession) {
      toast.error('No session available')
      return
    }
    
    // Remove frontend time check - let backend validate time
    // Button is always clickable, backend will return error if time is outside session time
    try {
      const sessionId = currentSession._id || currentSession.id
      if (!sessionId) {
        toast.error('Session ID not found')
        return
      }

      // Call backend API to update session status to 'live'
      const response = await updateSession(sessionId, { status: 'live' })
      
      if (!response.success) {
        toast.error(response.message || 'Failed to start session')
        return
      }
      
      if (response.success && response.data) {
        // Update local state with backend response
        const updatedSession = {
          ...currentSession,
          _id: response.data._id || sessionId,
          id: response.data._id || sessionId,
          status: response.data.status || 'live',
          startedAt: response.data.startedAt || new Date().toISOString(),
        }
        
        setCurrentSession(updatedSession)
        localStorage.setItem('doctorCurrentSession', JSON.stringify(updatedSession))
        
        toast.success('Session started! ETA is now active for all patients.')
        
        // Refresh appointments to get updated data and ETAs
        const queueResponse = await getPatientQueue(getTodayDateString())
        if (queueResponse.success && queueResponse.data) {
          const sessionData = queueResponse.data.session
          const queueData = queueResponse.data.appointments || []
          
          if (sessionData) {
            setCurrentSession({
              id: sessionData._id || sessionData.id,
              _id: sessionData._id || sessionData.id,
              date: sessionData.date,
              startTime: sessionData.sessionStartTime || sessionData.startTime,
              endTime: sessionData.sessionEndTime || sessionData.endTime,
              status: sessionData.status || 'live',
              currentToken: sessionData.currentToken || response.data.currentToken || 0,
              maxTokens: sessionData.maxTokens || 0,
              averageConsultationMinutes: sessionData.averageConsultationMinutes || getAverageConsultationMinutes(),
            })
          }
          
          // Update appointments list
          const transformedAppointments = Array.isArray(queueData) ? queueData.map((appt) => ({
            id: appt._id || appt.id,
            _id: appt._id || appt.id,
            patientId: appt.patientId?._id || appt.patientId || appt.patientId?.id,
            patientName: appt.patientId?.firstName && appt.patientId?.lastName
              ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
              : appt.patientId?.name || appt.patientName || 'Patient',
            age: appt.patientId?.age || appt.age || 0,
            gender: appt.patientId?.gender || appt.gender || 'unknown',
            appointmentTime: (() => {
              // Properly format appointment time
              if (appt.appointmentTime) {
                return appt.appointmentTime
              }
              if (appt.appointmentDate && appt.time) {
                // Convert 12-hour time to 24-hour for ISO format
                const convertTo24Hour = (time12) => {
                  if (!time12) return '00:00'
                  if (time12.includes('AM') || time12.includes('PM')) {
                    const [time, period] = time12.split(' ')
                    const [hours, minutes] = time.split(':').map(Number)
                    let hour24 = hours
                    if (period === 'PM' && hours !== 12) hour24 = hours + 12
                    if (period === 'AM' && hours === 12) hour24 = 0
                    return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                  }
                  return time12
                }
                const time24 = convertTo24Hour(appt.time)
                const dateStr = appt.appointmentDate instanceof Date 
                  ? appt.appointmentDate.toISOString().split('T')[0]
                  : appt.appointmentDate.split('T')[0]
                return `${dateStr}T${time24}:00`
              }
              return new Date().toISOString()
            })(),
            appointmentDate: appt.appointmentDate || appt.date,
            appointmentType: appt.appointmentType || appt.type || 'New',
            consultationMode: appt.consultationMode || 'in_person',
            status: appt.status || 'waiting',
            queueStatus: appt.queueStatus || appt.status || 'waiting',
            queueNumber: appt.tokenNumber || appt.queueNumber || 0,
            recallCount: appt.recallCount || 0,
            reason: appt.reason || appt.chiefComplaint || 'Consultation',
            time: appt.time, // Store the time field directly
            patientImage: appt.patientId?.profileImage || appt.patientId?.image || appt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            originalData: appt,
          })) : []
          
          setAppointments(transformedAppointments)
        }
      } else {
        toast.error(response.message || 'Failed to start session')
      }
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error(error.message || 'Failed to start session')
    }
  }

  const handleEndSession = async () => {
    if (!currentSession?._id) {
      toast.error('Session ID not found')
      return
    }

    // Confirm with user
    const confirmed = window.confirm('Are you sure you want to end this session? This will mark the session as completed and prevent new appointments from being booked.')
    if (!confirmed) {
      return
    }

    try {
      setLoadingSession(true)
      
      // Call backend API to end session (set status to completed)
      const response = await updateSession(currentSession._id, { status: 'completed' })
      
      if (response.success) {
        // Update local session state
        if (response.data?.session) {
          const updatedSession = {
            ...currentSession,
            ...response.data.session,
            status: 'completed',
            endedAt: new Date().toISOString()
          }
          setCurrentSession(updatedSession)
          localStorage.setItem('doctorCurrentSession', JSON.stringify(updatedSession))
        } else {
          // Fallback: update status manually
          const updatedSession = {
            ...currentSession,
            status: 'completed',
            endedAt: new Date().toISOString()
          }
          setCurrentSession(updatedSession)
          localStorage.setItem('doctorCurrentSession', JSON.stringify(updatedSession))
        }
        
        toast.success('Session ended successfully. No new appointments can be booked for this session.')
      } else {
        toast.error(response.message || 'Failed to end session')
      }
    } catch (error) {
      console.error('Error ending session:', error)
      toast.error(error.message || 'Failed to end session. Please try again.')
    } finally {
      setLoadingSession(false)
    }
  }

  const handleCancelSession = async () => {
    if (!cancelReason.trim()) {
      toast.warning('Please provide a reason for cancelling the session')
      return
    }

    if (!currentSession?._id) {
      toast.error('Session ID not found')
      return
    }

    try {
      setLoadingSession(true)
      
      // Call backend API to cancel session and all appointments
      const response = await cancelSession(currentSession._id, cancelReason.trim())
      
      if (response.success) {
        // Update local state - remove cancelled appointments from view
        setAppointments((prev) => prev.filter(apt => apt.status !== 'cancelled'))
      
      // Clear the session from state and localStorage (don't show cancelled sessions)
      setCurrentSession(null)
      localStorage.removeItem('doctorCurrentSession')
      
      setShowCancelSessionModal(false)
      setCancelReason('')
        
        toast.success(`Session cancelled successfully. ${response.data?.cancelledAppointments || 0} appointments have been cancelled and patients have been notified.`)
      } else {
        toast.error(response.message || 'Failed to cancel session')
      }
    } catch (error) {
      console.error('Error cancelling session:', error)
      toast.error(error.message || 'Failed to cancel session. Please try again.')
    } finally {
      setLoadingSession(false)
    }
  }

  const getSessionStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'live':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'completed':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getSessionStatusText = (status) => {
    switch (status) {
      case 'active':
      case 'live':
        return 'Live'
      case 'scheduled':
        return 'Scheduled'
      case 'paused':
        return 'Paused'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status || 'Not Started'
    }
  }

  // Handler for audio call button
  const handleAudioCall = async (appointmentId) => {
    console.log('📞 [handleAudioCall] Button clicked for appointmentId:', appointmentId)
    
    // Prevent multiple rapid clicks - check if we're already processing this specific appointment
    if (callInfoFull && (callInfoFull.appointmentId === appointmentId || callInfoFull.appointmentId === appointmentId?.toString())) {
      // If we have a callId, it means call was initiated, don't allow duplicate
      if (callInfoFull.callId) {
        console.log('📞 [handleAudioCall] Call already initiated for this appointment, ignoring click')
        toast.info('Call already initiated for this appointment')
        return
      }
    }
    
    try {
      const appointment = appointments.find((appt) => appt.id === appointmentId)
      if (!appointment) {
        console.error('📞 [handleAudioCall] Appointment not found:', appointmentId)
        toast.error('Appointment not found')
        return
      }

      console.log('📞 [handleAudioCall] Appointment found:', {
        id: appointment.id,
        consultationMode: appointment.consultationMode,
        status: appointment.status,
        patientId: appointment.patientId
      })

      // Check if consultation mode is 'call'
      if (appointment.consultationMode !== 'call') {
        console.warn('📞 [handleAudioCall] Invalid consultation mode:', appointment.consultationMode)
        toast.error('Audio call is only available for call consultation mode')
        return
      }

      // Check if appointment is called, in-consultation, or in_progress (after doctor has called the patient)
      const validStatuses = ['called', 'in-consultation', 'in_progress']
      if (!validStatuses.includes(appointment.status)) {
        console.warn('📞 [handleAudioCall] Invalid status:', appointment.status, 'Valid:', validStatuses)
        toast.error('Please call the patient first before starting audio call')
        return
      }

      const socket = getSocket()
      if (!socket) {
        console.error('📞 [handleAudioCall] Socket not available')
        toast.error('Not connected to server. Please refresh the page.')
        return
      }

      console.log('📞 [handleAudioCall] Socket state:', {
        connected: socket.connected,
        id: socket.id,
        disconnected: socket.disconnected,
        io: socket.io ? {
          readyState: socket.io.readyState,
          engine: socket.io.engine ? {
            transport: socket.io.engine.transport?.name,
            readyState: socket.io.engine.readyState
          } : null
        } : null
      })

      // Ensure socket is connected and ready
      if (!socket.connected || socket.disconnected) {
        console.error('📞 [handleAudioCall] Socket not connected. Current state:', {
          connected: socket.connected,
          disconnected: socket.disconnected
        })
        toast.error('Not connected to server. Please wait a moment and try again.')
        return
      }

      // Double-check socket is ready
      if (!socket.id) {
        console.error('📞 [handleAudioCall] Socket has no ID, not ready')
        toast.error('Socket not ready. Please wait a moment and try again.')
        return
      }

      console.log('📞 [handleAudioCall] Emitting call:initiate event with appointmentId:', appointmentId)
      console.log('📞 [handleAudioCall] Socket details:', {
        id: socket.id,
        connected: socket.connected,
        disconnected: socket.disconnected,
        transport: socket.io?.engine?.transport?.name,
        readyState: socket.io?.readyState
      })
      
      // Test socket connection with a simple event first
      socket.emit('test:ping', { timestamp: Date.now() }, (response) => {
        console.log('📞 [handleAudioCall] Test ping response:', response)
      })
      
      // Emit call:initiate event with acknowledgment
      console.log('📞 [handleAudioCall] About to emit call:initiate...')
      const emitResult = socket.emit('call:initiate', { appointmentId }, (response) => {
        console.log('📞 [handleAudioCall] Server response received:', response)
        if (response && response.error) {
          console.error('📞 [handleAudioCall] Server error:', response.error)
          toast.error(response.error)
        } else if (response && response.callId) {
          console.log('📞 [handleAudioCall] Call initiated successfully, callId:', response.callId)
        } else if (!response) {
          console.warn('📞 [handleAudioCall] No response from server (might be using one-way emit)')
        }
      })
      console.log('📞 [handleAudioCall] Emit result:', emitResult)
      
      // Also listen for call:initiated event (one-way emit from server)
      const handleCallInitiated = (data) => {
        console.log('📞 [handleAudioCall] Received call:initiated event:', data)
        
        // Update call status to 'calling' and store call info
        updateCallStatus('calling')
        setCallInfoFull({
          callId: data.callId || null,
          patientName: appointment.patientName || 'Patient',
          appointmentId: appointmentId,
          startTime: null,
        })
        
        socket.off('call:initiated', handleCallInitiated)
      }
      socket.once('call:initiated', handleCallInitiated)
      
      // Listen for errors
      const handleCallError = (data) => {
        console.error('📞 [handleAudioCall] Received call:error event:', data)
        const errorMessage = data.message || 'Call error occurred'
        
        // If error is about existing call, allow retry by clearing state
        if (errorMessage.includes('already in progress')) {
          console.log('📞 [handleAudioCall] Call already exists, clearing state to allow retry')
          updateCallStatus('idle')
          setCallInfoFull(null)
          toast.warning('A call already exists. Please wait a moment and try again.')
        } else {
          toast.error(errorMessage)
          updateCallStatus('idle')
          setCallInfoFull(null)
        }
        socket.off('call:error', handleCallError)
      }
      socket.once('call:error', handleCallError)

      // Set status to calling immediately (before server response)
      console.log('📞 [handleAudioCall] Setting call status to calling and call info')
      console.log('📞 [handleAudioCall] Appointment:', {
        patientName: appointment.patientName,
        appointmentId: appointmentId
      })
      updateCallStatus('calling')
      setCallInfoFull({
        callId: null,
        patientName: appointment.patientName || 'Patient',
        appointmentId: appointmentId,
        startTime: null,
      })
      console.log('📞 [handleAudioCall] Call status and info set. Should trigger re-render.')

      toast.info('Initiating audio call...')
    } catch (error) {
      console.error('📞 [handleAudioCall] Error initiating audio call:', error)
      toast.error('Failed to initiate audio call')
      // Reset state on error to allow retry
      updateCallStatus('idle')
      setCallInfoFull(null)
    }
  }

  // Handler for video call button (placeholder - no backend yet)
  const handleVideoCall = async (appointmentId) => {
    const appointment = appointments.find((appt) => appt.id === appointmentId)
    if (!appointment) {
      toast.error('Appointment not found')
      return
    }
    // TODO: Implement video call functionality
    toast.info('Video call feature coming soon')
  }

  // Handler for call button (for video call appointments - placeholder)
  const handleCallPatient = async (appointmentId) => {
    const appointment = appointments.find((appt) => appt.id === appointmentId)
    if (!appointment) {
      toast.error('Appointment not found')
      return
    }
    // TODO: Implement call functionality for video call appointments
    toast.info('Call feature coming soon')
  }

  const handleCallNext = async (appointmentId) => {
    const appointment = appointments.find((appt) => appt.id === appointmentId)
    if (!appointment) {
      toast.error('Appointment not found')
      return
    }

    // Check if session is active/live
    if (!currentSession || (currentSession.status !== 'active' && currentSession.status !== 'live')) {
      toast.warning('Please start the session first before calling patients')
      return
    }

    try {
      const sessionId = currentSession._id || currentSession.id
      if (!sessionId) {
        toast.error('Session ID not found')
        return
      }

      // Call API to call next patient (pass specific appointmentId if available)
      const response = await callNextPatient(sessionId, appointmentId)
      
      if (response.success) {
        toast.success('Patient called successfully')
        
        // Update local state with API response
        if (response.data?.appointment) {
          const calledAppointment = response.data.appointment
          const calledAppointmentId = calledAppointment._id || calledAppointment.id
          
          // IMPORTANT: Read recallCount from backend response first, then fallback to existing state
          // The backend should preserve recallCount (we fixed it to not reset), so it should be in the response
          const backendRecallCount = calledAppointment.recallCount !== undefined && calledAppointment.recallCount !== null
            ? calledAppointment.recallCount
            : undefined
          
          console.log('📞 Call Next - RecallCount Check:', {
            appointmentId: calledAppointmentId,
            backendRecallCount,
            calledAppointment: calledAppointment.recallCount,
            appointmentFromState: appointment.recallCount,
            originalDataRecallCount: appointment.originalData?.recallCount
          })
          
          // Update the called appointment status
          // IMPORTANT: Preserve recallCount when updating status to 'called'
          setAppointments((prev) =>
            prev.map((appt) => {
              // Match by appointment ID from response or by appointmentId parameter
              if (appt.id === appointmentId || appt._id === appointmentId || 
                  appt.id === calledAppointmentId || appt._id === calledAppointmentId) {
                // Preserve recallCount: prefer backend value, then existing state, then originalData, then 0
                const preservedRecallCount = backendRecallCount !== undefined
                  ? backendRecallCount
                  : (appt.recallCount !== undefined && appt.recallCount !== null
                      ? appt.recallCount
                      : (appt.originalData?.recallCount !== undefined && appt.originalData?.recallCount !== null
                          ? appt.originalData.recallCount
                          : 0))
                
                console.log('✅ Preserving recallCount:', {
                  appointmentId: appt.id || appt._id,
                  preservedRecallCount,
                  source: backendRecallCount !== undefined ? 'backend' : 'state'
                })
                
                return { 
                  ...appt, 
                  status: 'called', 
                  queueStatus: 'called',
                  recallCount: preservedRecallCount, // Preserve recallCount
                  _id: calledAppointmentId || appt._id,
                  id: calledAppointmentId || appt.id,
                  originalData: {
                    ...(appt.originalData || {}),
                    recallCount: preservedRecallCount
                  }
                }
              }
              return appt
            })
          )
        } else {
          // Fallback: update by appointmentId if response doesn't have appointment data
          // IMPORTANT: Preserve recallCount in fallback too
          setAppointments((prev) =>
            prev.map((appt) => {
              if (appt.id === appointmentId || appt._id === appointmentId) {
                // Preserve existing recallCount
                const preservedRecallCount = appt.recallCount || appt.originalData?.recallCount || 0
                return { 
                  ...appt, 
                  status: 'called', 
                  queueStatus: 'called',
                  recallCount: preservedRecallCount // Preserve recallCount
                }
              }
              return appt
            })
          )
        }

        // Load shared prescriptions from appointment
        const sharedPrescriptions = appointment.sharedPrescriptions || []
        
        // Fetch complete patient data including email and address
        let fullPatientData = null
        try {
          const patientId = appointment.patientId?._id || appointment.patientId
          if (patientId) {
            const patientResponse = await getPatientById(patientId)
            if (patientResponse.success && patientResponse.data) {
              fullPatientData = patientResponse.data
              console.log('✅ Fetched full patient data:', fullPatientData)
            }
          }
        } catch (error) {
          console.error('Error fetching patient data:', error)
          // Continue with appointment data if fetch fails
        }
        
        // Format patient address
        let formattedAddress = 'Not provided'
        if (fullPatientData?.address) {
          const address = fullPatientData.address
          if (typeof address === 'object') {
            const addressParts = []
            if (address.line1) addressParts.push(address.line1)
            if (address.line2) addressParts.push(address.line2)
            if (address.city) addressParts.push(address.city)
            if (address.state) addressParts.push(address.state)
            if (address.pincode || address.postalCode) addressParts.push(address.pincode || address.postalCode)
            formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided'
          } else if (typeof address === 'string' && address.trim() !== '') {
            formattedAddress = address
          }
        } else if (appointment.patientAddress && appointment.patientAddress !== 'Not provided' && appointment.patientAddress !== 'Address not provided') {
          formattedAddress = appointment.patientAddress
        }
        
        // Calculate age from date of birth if available
        let patientAge = appointment.age || 0
        if (fullPatientData?.dateOfBirth) {
          try {
            const dob = new Date(fullPatientData.dateOfBirth)
            const today = new Date()
            let age = today.getFullYear() - dob.getFullYear()
            const monthDiff = today.getMonth() - dob.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
              age--
            }
            if (age > 0) patientAge = age
          } catch (e) {
            console.error('Error calculating age:', e)
          }
        }
        
        // Navigate to consultations page with patient data
        // Convert appointment to consultation format with real patient data
        const consultationData = {
          id: `cons-${appointment.id}-${Date.now()}`, // Unique ID with timestamp
          patientId: appointment.patientId?._id || appointment.patientId,
          patientName: fullPatientData?.firstName && fullPatientData?.lastName
            ? `${fullPatientData.firstName} ${fullPatientData.lastName}`
            : appointment.patientName || 'Patient',
          age: patientAge,
          gender: fullPatientData?.gender || appointment.gender || 'M',
          appointmentTime: appointment.appointmentTime || new Date().toISOString(),
          appointmentType: appointment.appointmentType || 'Follow-up',
          status: 'in-progress',
          reason: appointment.reason || 'Consultation',
          patientImage: fullPatientData?.profileImage || appointment.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=11496c&color=fff&size=160`,
          patientPhone: fullPatientData?.phone || appointment.patientPhone || '',
          patientEmail: fullPatientData?.email || appointment.patientEmail || '',
          patientAddress: formattedAddress,
          diagnosis: '',
          symptoms: '',
          vitals: {},
          medications: [],
          investigations: [],
          advice: '',
          followUpDate: '',
          attachments: [],
          sharedPrescriptions: sharedPrescriptions, // Prescriptions shared by patient from other doctors
          sessionId: currentSession.id || currentSession._id,
          sessionDate: currentSession.date,
          calledAt: new Date().toISOString(),
        }

        // Save consultation state to localStorage for persistence
        try {
          localStorage.setItem('doctorSelectedConsultation', JSON.stringify(consultationData))
          console.log('✅ Saved consultation state to localStorage:', consultationData)
        } catch (error) {
          console.error('Error saving consultation state:', error)
        }
        
        // Navigate to consultations page with patient data in state
        navigate('/doctor/consultations', {
          state: { selectedConsultation: consultationData },
        })
      } else {
        toast.error(response.message || 'Failed to call patient')
      }
    } catch (error) {
      console.error('Error calling next patient:', error)
      toast.error(error.message || 'Failed to call patient')
    }
  }

  const handleComplete = async (appointmentId) => {
    try {
      const response = await updateQueueStatus(appointmentId, 'completed')
      
      if (response.success) {
        toast.success('Consultation completed successfully. Patient has been notified.')
        
        // Update appointment status to completed (keep in list, just update status)
        setAppointments((prev) =>
          prev.map((appt) =>
            appt.id === appointmentId || appt._id === appointmentId
              ? { ...appt, status: 'completed', queueStatus: 'completed' }
              : appt
          )
        )
        
        // Refresh appointments to get updated queue (including completed appointments)
        const queueResponse = await getPatientQueue(getTodayDateString())
        if (queueResponse.success && queueResponse.data) {
          const queueData = queueResponse.data.queue || queueResponse.data.appointments || []
          const transformedAppointments = queueData.map((appt) => ({
            id: appt._id || appt.id,
            _id: appt._id || appt.id,
            patientId: appt.patientId?._id || appt.patientId || appt.patientId,
            patientName: appt.patientId?.firstName && appt.patientId?.lastName
              ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
              : appt.patientId?.name || appt.patientName || 'Patient',
            age: appt.patientId?.age || appt.age || 0,
            gender: appt.patientId?.gender || appt.gender || 'unknown',
            appointmentTime: (() => {
              // Properly format appointment time
              if (appt.appointmentTime) {
                // If it's already a valid ISO string, return as is
                if (typeof appt.appointmentTime === 'string' && appt.appointmentTime.includes('T') && !appt.appointmentTime.includes('AM') && !appt.appointmentTime.includes('PM')) {
                  return appt.appointmentTime
                }
                // If it's a malformed string, try to fix it
                if (typeof appt.appointmentTime === 'string' && appt.appointmentTime.includes('T') && (appt.appointmentTime.includes('AM') || appt.appointmentTime.includes('PM'))) {
                  // Extract date and time parts
                  const dateMatch = appt.appointmentTime.match(/(\d{4}-\d{2}-\d{2})/)
                  const timeMatch = appt.appointmentTime.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
                  if (dateMatch && timeMatch) {
                    return formatAppointmentTime(dateMatch[1], timeMatch[1])
                  }
                }
              }
              if (appt.appointmentDate && appt.time) {
                return formatAppointmentTime(appt.appointmentDate, appt.time) || new Date().toISOString()
              }
              return new Date().toISOString()
            })(),
            appointmentType: appt.appointmentType || appt.type || 'New',
            consultationMode: appt.consultationMode || 'in_person',
            status: appt.status || 'waiting',
            queueStatus: appt.queueStatus || appt.status || 'waiting',
            queueNumber: appt.tokenNumber || appt.queueNumber || 0,
            recallCount: appt.recallCount || 0,
            reason: appt.reason || appt.chiefComplaint || 'Consultation',
            patientImage: appt.patientId?.profileImage || appt.patientId?.image || appt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            originalData: appt,
          }))
          setAppointments(transformedAppointments)
        }
      } else {
        toast.error(response.message || 'Failed to complete consultation')
      }
    } catch (error) {
      console.error('Error completing consultation:', error)
      toast.error(error.message || 'Failed to complete consultation')
    }
  }

  const handleRecall = async (appointmentId) => {
    try {
      const response = await recallPatient(appointmentId)
      
      if (response.success) {
        const updatedRecallCount = response.data?.recallCount || response.data?.appointment?.recallCount || 0
        const isSecondRecall = updatedRecallCount >= 2
        
        if (isSecondRecall) {
          toast.success('Patient recalled to waiting queue. Maximum recalls reached (2).')
        } else {
          toast.success('Patient recalled to waiting queue')
        }
        
        // Update local state with recallCount immediately
        setAppointments((prev) =>
          prev.map((appt) =>
            appt.id === appointmentId || appt._id === appointmentId
              ? { 
                  ...appt, 
                  status: 'waiting', 
                  queueStatus: 'waiting',
                  recallCount: updatedRecallCount
                } 
              : appt
          )
        )
        
        // Refresh appointments to get updated data
        const queueResponse = await getPatientQueue(getTodayDateString())
        if (queueResponse.success && queueResponse.data) {
          const queueData = queueResponse.data.queue || queueResponse.data.appointments || []
          const transformedAppointments = queueData.map((appt) => ({
            id: appt._id || appt.id,
            _id: appt._id || appt.id,
            patientId: appt.patientId?._id || appt.patientId || appt.patientId,
            patientName: appt.patientId?.firstName && appt.patientId?.lastName
              ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
              : appt.patientId?.name || appt.patientName || 'Patient',
            age: appt.patientId?.age || appt.age || 0,
            gender: appt.patientId?.gender || appt.gender || 'M',
            appointmentTime: (() => {
              // Properly format appointment time
              if (appt.appointmentTime) {
                // If it's already a valid ISO string, return as is
                if (typeof appt.appointmentTime === 'string' && appt.appointmentTime.includes('T') && !appt.appointmentTime.includes('AM') && !appt.appointmentTime.includes('PM')) {
                  return appt.appointmentTime
                }
                // If it's a malformed string, try to fix it
                if (typeof appt.appointmentTime === 'string' && appt.appointmentTime.includes('T') && (appt.appointmentTime.includes('AM') || appt.appointmentTime.includes('PM'))) {
                  // Extract date and time parts
                  const dateMatch = appt.appointmentTime.match(/(\d{4}-\d{2}-\d{2})/)
                  const timeMatch = appt.appointmentTime.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
                  if (dateMatch && timeMatch) {
                    return formatAppointmentTime(dateMatch[1], timeMatch[1])
                  }
                }
              }
              if (appt.appointmentDate && appt.time) {
                return formatAppointmentTime(appt.appointmentDate, appt.time) || new Date().toISOString()
              }
              return new Date().toISOString()
            })(),
            appointmentType: appt.appointmentType || appt.type || 'New',
            consultationMode: appt.consultationMode || 'in_person',
            status: appt.status || 'waiting',
            queueStatus: appt.queueStatus || appt.status || 'waiting',
            queueNumber: appt.tokenNumber || appt.queueNumber || 0,
            recallCount: appt.recallCount || 0,
            time: appt.time, // Store the time field directly
            reason: appt.reason || appt.chiefComplaint || 'Consultation',
            patientImage: appt.patientId?.profileImage || appt.patientId?.image || appt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            originalData: appt,
          }))
          setAppointments(transformedAppointments)
        }
      } else {
        toast.error(response.message || 'Failed to recall patient')
      }
    } catch (error) {
      console.error('Error recalling patient:', error)
      toast.error(error.message || 'Failed to recall patient')
    }
  }

  const handleSkip = async (appointmentId) => {
    try {
      const appointment = appointments.find((appt) => appt.id === appointmentId || appt._id === appointmentId)
      if (!appointment) {
        toast.error('Appointment not found')
        return
      }

      const response = await skipPatient(appointmentId)
      
      if (response.success) {
        toast.success('Patient skipped successfully')
        
        // Update local state immediately to remove from consultation room
        // If patient is currently in consultation room (called/in-consultation/in_progress),
        // change status to 'scheduled' to remove them from consultation room
        const currentStatus = appointment.status || appointment.originalData?.status
        const isInConsultation = currentStatus === 'called' || currentStatus === 'in-consultation' || currentStatus === 'in_progress'
        const newStatus = isInConsultation ? 'scheduled' : (currentStatus || 'waiting')
        
        setAppointments((prev) =>
          prev.map((appt) =>
            appt.id === appointmentId || appt._id === appointmentId
              ? { 
                  ...appt, 
                  status: newStatus, 
                  queueStatus: 'skipped',
                  originalData: {
                    ...(appt.originalData || {}),
                    status: newStatus,
                    queueStatus: 'skipped'
                  }
                }
              : appt
          )
        )
        
        // Wait a bit to ensure backend has saved the changes, then refresh
        setTimeout(async () => {
          const queueResponse = await getPatientQueue(getTodayDateString())
          if (queueResponse.success && queueResponse.data) {
            const queueData = queueResponse.data.queue || queueResponse.data.appointments || []
            const transformedAppointments = queueData.map((appt) => ({
              id: appt._id || appt.id,
              _id: appt._id || appt.id,
              patientId: appt.patientId?._id || appt.patientId || appt.patientId,
              patientName: appt.patientId?.firstName && appt.patientId?.lastName
                ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
                : appt.patientId?.name || appt.patientName || 'Patient',
              age: appt.patientId?.age || appt.age || 0,
              gender: appt.patientId?.gender || appt.gender || 'unknown',
              appointmentTime: (() => {
                // Properly format appointment time
                if (appt.appointmentTime) {
                  // If it's already a valid ISO string, return as is
                  if (typeof appt.appointmentTime === 'string' && appt.appointmentTime.includes('T') && !appt.appointmentTime.includes('AM') && !appt.appointmentTime.includes('PM')) {
                    return appt.appointmentTime
                  }
                  // If it's a malformed string, try to fix it
                  if (typeof appt.appointmentTime === 'string' && appt.appointmentTime.includes('T') && (appt.appointmentTime.includes('AM') || appt.appointmentTime.includes('PM'))) {
                    // Extract date and time parts
                    const dateMatch = appt.appointmentTime.match(/(\d{4}-\d{2}-\d{2})/)
                    const timeMatch = appt.appointmentTime.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
                    if (dateMatch && timeMatch) {
                      return formatAppointmentTime(dateMatch[1], timeMatch[1])
                    }
                  }
                }
                if (appt.appointmentDate && appt.time) {
                  return formatAppointmentTime(appt.appointmentDate, appt.time) || new Date().toISOString()
                }
                return new Date().toISOString()
              })(),
              appointmentType: appt.appointmentType || appt.type || 'New',
              consultationMode: appt.consultationMode || 'in_person',
              status: appt.status || 'waiting',
              queueStatus: appt.queueStatus || appt.status || 'waiting',
              queueNumber: appt.tokenNumber || appt.queueNumber || 0,
              recallCount: appt.recallCount || 0,
              reason: appt.reason || appt.chiefComplaint || 'Consultation',
              time: appt.time, // Store the time field directly
              patientImage: appt.patientId?.profileImage || appt.patientId?.image || appt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
              originalData: appt,
            }))
            setAppointments(transformedAppointments)
          }
        }, 500) // Wait 500ms for backend to save
      } else {
        toast.error(response.message || 'Failed to skip patient')
      }
    } catch (error) {
      console.error('Error skipping patient:', error)
      toast.error(error.message || 'Failed to skip patient')
    }
  }

  const handleNoShow = async (appointmentId) => {
    try {
      const response = await markNoShow(appointmentId)
      
      if (response.success) {
        toast.success('Patient marked as no-show. Appointment cancelled. Patient can reschedule.')
        
        // Update appointment status to no-show/cancelled (DON'T remove from list)
        setAppointments((prev) =>
          prev.map((appt) =>
            appt.id === appointmentId || appt._id === appointmentId
              ? { 
                  ...appt, 
                  status: 'cancelled',
                  queueStatus: 'no-show',
                  cancelledAt: new Date().toISOString(),
                  cancelledBy: 'doctor',
                  cancellationReason: 'Patient did not show up for appointment'
                }
              : appt
          )
        )
        
        // Refresh appointments to get updated queue (including no-show appointments)
        const queueResponse = await getPatientQueue(getTodayDateString())
        if (queueResponse.success && queueResponse.data) {
          const queueData = queueResponse.data.queue || queueResponse.data.appointments || []
          const transformedAppointments = queueData.map((appt) => ({
            id: appt._id || appt.id,
            _id: appt._id || appt.id,
            patientId: appt.patientId?._id || appt.patientId || appt.patientId,
            patientName: appt.patientId?.firstName && appt.patientId?.lastName
              ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
              : appt.patientId?.name || appt.patientName || 'Patient',
            age: appt.patientId?.age || appt.age || 0,
            gender: appt.patientId?.gender || appt.gender || 'M',
            appointmentTime: (() => {
              // Properly format appointment time
              if (appt.appointmentTime) {
                // If it's already a valid ISO string, return as is
                if (typeof appt.appointmentTime === 'string' && appt.appointmentTime.includes('T') && !appt.appointmentTime.includes('AM') && !appt.appointmentTime.includes('PM')) {
                  return appt.appointmentTime
                }
                // If it's a malformed string, try to fix it
                if (typeof appt.appointmentTime === 'string' && appt.appointmentTime.includes('T') && (appt.appointmentTime.includes('AM') || appt.appointmentTime.includes('PM'))) {
                  // Extract date and time parts
                  const dateMatch = appt.appointmentTime.match(/(\d{4}-\d{2}-\d{2})/)
                  const timeMatch = appt.appointmentTime.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
                  if (dateMatch && timeMatch) {
                    return formatAppointmentTime(dateMatch[1], timeMatch[1])
                  }
                }
              }
              if (appt.appointmentDate && appt.time) {
                return formatAppointmentTime(appt.appointmentDate, appt.time) || new Date().toISOString()
              }
              return new Date().toISOString()
            })(),
            appointmentType: appt.appointmentType || appt.type || 'New',
            consultationMode: appt.consultationMode || 'in_person',
            status: appt.status || 'waiting',
            queueStatus: appt.queueStatus || appt.status || 'waiting',
            queueNumber: appt.tokenNumber || appt.queueNumber || 0,
            recallCount: appt.recallCount || 0,
            reason: appt.reason || appt.chiefComplaint || 'Consultation',
            patientImage: appt.patientId?.profileImage || appt.patientId?.image || appt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            cancelledAt: appt.cancelledAt,
            cancelledBy: appt.cancelledBy,
            cancellationReason: appt.cancellationReason || appt.cancelReason,
            originalData: appt,
          }))
          setAppointments(transformedAppointments)
        }
      } else {
        toast.error(response.message || 'Failed to mark patient as no-show')
      }
    } catch (error) {
      console.error('Error marking no-show:', error)
      toast.error(error.message || 'Failed to mark patient as no-show')
    }
  }

  const handleMoveUp = (appointmentId) => {
    const currentIndex = appointments.findIndex((appt) => appt.id === appointmentId)
    if (currentIndex === 0) return

    setAppointments((prev) => {
      const newAppointments = [...prev]
      ;[newAppointments[currentIndex - 1], newAppointments[currentIndex]] = [
        newAppointments[currentIndex],
        newAppointments[currentIndex - 1],
      ]
      return newAppointments.map((appt, idx) => ({ ...appt, queueNumber: idx + 1 }))
    })
  }

  const handleMoveDown = (appointmentId) => {
    const currentIndex = appointments.findIndex((appt) => appt.id === appointmentId)
    if (currentIndex === appointments.length - 1) return

    setAppointments((prev) => {
      const newAppointments = [...prev]
      ;[newAppointments[currentIndex], newAppointments[currentIndex + 1]] = [
        newAppointments[currentIndex + 1],
        newAppointments[currentIndex],
      ]
      return newAppointments.map((appt, idx) => ({ ...appt, queueNumber: idx + 1 }))
    })
  }

  const handleViewHistory = (appointment) => {
    setSelectedPatient(appointment)
    setShowHistoryModal(true)
  }


  // Patient medical history - loaded from API
  const [medicalHistory, setMedicalHistory] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Load patient history when patient is selected
  useEffect(() => {
    const loadPatientHistory = async () => {
      if (selectedPatient?.patientId || selectedPatient?._id) {
        try {
          setLoadingHistory(true)
          const patientId = selectedPatient.patientId || selectedPatient._id
          const historyResponse = await getPatientHistory(patientId)
          if (historyResponse.success && historyResponse.data) {
            setMedicalHistory(historyResponse.data)
          } else {
            setMedicalHistory(null)
          }
        } catch (error) {
          console.error('Error loading patient history:', error)
          setMedicalHistory(null)
        } finally {
          setLoadingHistory(false)
        }
      } else {
        setMedicalHistory(null)
      }
    }
    
    loadPatientHistory()
  }, [selectedPatient?.patientId, selectedPatient?._id])

  // Show loading state if initial load
  if (loadingAppointments && appointments.length === 0 && !appointmentsError) {
    return (
      <>
        <DoctorNavbar />
        <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <IoPeopleOutline className="mx-auto h-12 w-12 text-slate-300 animate-pulse" />
            <p className="mt-4 text-sm font-medium text-slate-600">Loading patients...</p>
          </div>
        </section>
      </>
    )
  }

  // Show error state if there's an error
  if (appointmentsError && appointments.length === 0) {
    return (
      <>
        <DoctorNavbar />
        <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
            <IoCloseCircleOutline className="mx-auto h-12 w-12 text-red-300" />
            <p className="mt-4 text-sm font-medium text-red-600">Error loading patients</p>
            <p className="mt-1 text-xs text-red-500">{appointmentsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <DoctorNavbar />
      <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
          {/* Session Status Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <IoCalendarOutline className="h-5 w-5 text-[#11496c]" />
                  <h3 className="text-sm font-bold text-slate-900">Today's Session</h3>
                </div>
                {currentSession ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getSessionStatusColor(currentSession.status)}`}>
                        {getSessionStatusText(currentSession.status)}
                      </span>
                      <span className="text-xs text-slate-600">
                        {currentSession?.date && currentSession?.startTime && currentSession?.endTime
                          ? (() => {
                              // Helper to convert time to 12-hour format if needed
                              const formatTime12Hour = (time) => {
                                if (!time) return 'N/A'
                                // If already in 12-hour format (contains AM/PM), return as is
                                if (time.toString().includes('AM') || time.toString().includes('PM')) {
                                  return time
                                }
                                // Convert 24-hour to 12-hour
                                const [hours, minutes] = time.split(':').map(Number)
                                if (isNaN(hours) || isNaN(minutes)) return time
                                const period = hours >= 12 ? 'PM' : 'AM'
                                const hours12 = hours % 12 || 12
                                return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
                              }
                              return `${formatTime12Hour(currentSession.startTime)} - ${formatTime12Hour(currentSession.endTime)}`
                            })()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span>Avg Time: {currentSession?.averageConsultationMinutes || getAverageConsultationMinutes()} min/patient</span>
                      <span>•</span>
                      <span>Capacity: {appointments.filter(a => a.status !== 'cancelled' && a.status !== 'no-show').length} / {currentSession?.maxTokens || 0}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No session scheduled for today</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {currentSession && (
                  <>
                    {/* Show Start Session button when status is scheduled - ALWAYS visible during session time */}
                    {(() => {
                      // Normalize status to lowercase for comparison
                      const normalizedStatus = String(currentSession.status || 'scheduled').toLowerCase().trim()
                      
                      // Show start button ONLY if status is scheduled (not active/live/completed/cancelled)
                      const isScheduled = normalizedStatus === 'scheduled'
                      const isActiveOrLive = normalizedStatus === 'active' || normalizedStatus === 'live'
                      
                      console.log('🔵 Start Session Button Check:', {
                        originalStatus: currentSession.status,
                        normalizedStatus,
                        isScheduled,
                        isActiveOrLive,
                        willShow: isScheduled,
                      })
                      
                      // Don't show start button if session is already active/live (will show end button instead)
                      if (isActiveOrLive) {
                        console.log('ℹ️ Session is active/live - session will auto-end at scheduled end time')
                        return null
                      }
                      
                      // Only show start button for scheduled status
                      if (!isScheduled) {
                        console.log('⚠️ Not showing Start button - status is:', currentSession.status, 'normalized:', normalizedStatus)
                        return null
                      }
                      
                      const sessionStartTime = currentSession.startTime || currentSession.sessionStartTime
                      const sessionEndTime = currentSession.endTime || currentSession.sessionEndTime
                      
                      console.log('🟢 Start Session Button - Always Enabled:', {
                        status: currentSession.status,
                        normalizedStatus,
                        sessionTime: `${sessionStartTime} - ${sessionEndTime}`,
                        willShow: true,
                        willBeEnabled: true, // Always enabled - backend will validate time on click
                      })
                      
                      // Button is ALWAYS enabled when status is scheduled
                      // Backend will validate time when clicked and show error if outside session time
                      // Once clicked and session starts successfully, status changes to 'live' and session will auto-end at scheduled end time
                      return (
                      <button
                        type="button"
                        onClick={handleStartSession}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
                          title={`Start session (${sessionStartTime} - ${sessionEndTime})`}
                      >
                        <IoPlayOutline className="h-4 w-4" />
                          Start Session
                      </button>
                      )
                    })()}
                    {/* Show End Session button when session is active/live */}
                    {(currentSession.status === 'active' || currentSession.status === 'live') && (
                      <button
                        type="button"
                        onClick={handleEndSession}
                        disabled={loadingSession}
                        className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoCheckmarkCircleOutline className="h-4 w-4" />
                        {loadingSession ? 'Ending...' : 'End Session'}
                      </button>
                    )}
                    {/* Show Cancel Session button for scheduled/active/live sessions */}
                    {(currentSession.status === 'scheduled' || currentSession.status === 'active' || currentSession.status === 'live') && (
                      <button
                        type="button"
                        onClick={() => setShowCancelSessionModal(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 active:scale-95"
                      >
                        <IoCloseCircleOutline className="h-4 w-4" />
                        Cancel Session
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <IoSearchOutline className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patients by name or reason..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* Appointment Queue */}
          <div className="space-y-3">
            {!currentSession ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <IoCalendarOutline className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-600">No session available</p>
                <p className="mt-1 text-xs text-slate-500">A session will be created when you book an appointment or manually create one</p>
                {loadingSession && (
                  <p className="mt-2 text-xs text-slate-400">Loading session...</p>
                )}
              </div>
            ) : currentSession.status !== 'active' && currentSession.status !== 'live' && currentSession.status !== 'scheduled' ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <IoPeopleOutline className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-600">Session not started</p>
                <p className="mt-1 text-xs text-slate-500">Click "Start Session" to begin and view appointments</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <IoPeopleOutline className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-600">No appointments found</p>
                <p className="mt-1 text-xs text-slate-500">Your appointment queue will appear here</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`rounded-xl border bg-white p-3 shadow-sm transition-all ${
                    appointment.status === 'called' || appointment.status === 'in-consultation'
                      ? 'border-[#11496c] bg-[rgba(17,73,108,0.05)]'
                      : appointment.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : appointment.status === 'no-show'
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Queue Number, Profile Image, Patient Info, Time */}
                    <div className="flex items-start gap-2.5">
                      {/* Queue Number - Smaller */}
                      <div className="flex shrink-0 items-center justify-center">
                        <span
                          className={`text-xs font-semibold ${
                            appointment.status === 'called' || appointment.status === 'in-consultation'
                              ? 'text-[#11496c]'
                              : appointment.status === 'completed'
                              ? 'text-emerald-700'
                              : appointment.status === 'no-show'
                              ? 'text-red-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {appointment.queueNumber}.
                        </span>
                      </div>

                      {/* Profile Image - Side */}
                      <img
                        src={appointment.patientImage}
                        alt={appointment.patientName}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=3b82f6&color=fff&size=160`
                        }}
                      />

                      {/* Patient Info - Full Name */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {appointment.patientName}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {appointment.age || 0} years • {(appointment.gender && typeof appointment.gender === 'string' && appointment.gender.length > 0) ? appointment.gender.charAt(0).toUpperCase() : 'N/A'}
                        </p>
                      </div>

                      {/* Time - Right Side */}
                      <div className="flex shrink-0 items-center">
                        <div className="text-xs font-medium text-slate-700">
                          {appointment.time || appointment.originalData?.time || formatTime(appointment.appointmentTime)}
                        </div>
                      </div>
                    </div>

                    {/* Appointment Type Badge, Consultation Mode, and Status Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          appointment.appointmentType === 'New'
                            ? 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {appointment.appointmentType === 'New' ? 'New' : 'Follow up'}
                      </span>
                      {/* Consultation Mode Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          appointment.consultationMode === 'in_person'
                            ? 'bg-blue-100 text-blue-700'
                            : appointment.consultationMode === 'video_call'
                            ? 'bg-purple-100 text-purple-700'
                            : appointment.consultationMode === 'call'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {appointment.consultationMode === 'in_person' ? (
                          <>
                            <IoPersonOutline className="h-2.5 w-2.5" />
                            <span>In-Person</span>
                          </>
                        ) : appointment.consultationMode === 'video_call' ? (
                          <>
                            <IoVideocamOutline className="h-2.5 w-2.5" />
                            <span>Video Call</span>
                          </>
                        ) : appointment.consultationMode === 'call' ? (
                          <>
                            <IoCallOutline className="h-2.5 w-2.5" />
                            <span>Call</span>
                          </>
                        ) : (
                          <span>In-Person</span>
                        )}
                      </span>
                      {/* Status Badge - Show Cancelled for no-show/cancelled-by-session, Completed for completed */}
                      {(() => {
                        const status = appointment.status || appointment.originalData?.status
                        const queueStatus = appointment.queueStatus || appointment.originalData?.queueStatus
                        
                        if (status === 'cancelled_by_session' || status === 'cancelled' || queueStatus === 'no-show') {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                              <IoCloseCircleOutline className="h-2.5 w-2.5" />
                              Cancelled
                            </span>
                          )
                        }
                        if (status === 'completed') {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <IoCheckmarkCircleOutline className="h-2.5 w-2.5" />
                              Completed
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>

                    {/* Action Buttons - Use helper function to determine button visibility */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {(() => {
                        const buttonConfig = getAppointmentButtons(appointment, currentSession?.status)
                        
                        // If no buttons should be shown (completed/cancelled), return early
                        if (!buttonConfig.showButtons) {
                          return null
                        }

                        const { buttons, consultationMode } = buttonConfig
                        const appointmentId = appointment.id || appointment._id
                        
                        // Get consultationMode from multiple sources for reliability
                        const actualConsultationMode = consultationMode || appointment.consultationMode || appointment.originalData?.consultationMode || 'in_person'
                        const isCallMode = actualConsultationMode && actualConsultationMode.toLowerCase() === 'call'

                        // Debug log to check button configuration
                        console.log('📞 Button Configuration Check:', {
                          appointmentId,
                          consultationMode,
                          actualConsultationMode,
                          isCallMode,
                          buttons,
                          hasCall: buttons.includes('call'),
                          hasAudioCall: buttons.includes('audioCall'),
                          status: appointment.status || appointment.originalData?.status,
                          queueStatus: appointment.queueStatus || appointment.originalData?.queueStatus,
                          appointmentConsultationMode: appointment.consultationMode,
                          originalDataConsultationMode: appointment.originalData?.consultationMode
                        })

                        return (
                          <>
                            {/* Call button - only show for waiting/scheduled/confirmed/skipped (before first call) */}
                            {buttons.includes('call') && (
                              <>
                                {actualConsultationMode === 'video_call' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCallNext(appointmentId)}
                                    className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                                  >
                                    <IoCallOutline className="h-3.5 w-3.5" />
                                    Call
                                  </button>
                                ) : isCallMode ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleCallNext(appointmentId)}
                                      className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                                    >
                                      <IoCallOutline className="h-3.5 w-3.5" />
                                      Call
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleCallNext(appointmentId)}
                                    className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                                  >
                                    <IoCallOutline className="h-3.5 w-3.5" />
                                    Call
                                  </button>
                                )}
                              </>
                            )}

                            {/* Video Call button - only show for video_call mode after patient is called */}
                            {buttons.includes('videoCall') && consultationMode === 'video_call' && (
                              <button
                                type="button"
                                onClick={() => handleVideoCall(appointmentId)}
                                className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 active:scale-95"
                              >
                                <IoVideocamOutline className="h-3.5 w-3.5" />
                                Video Call
                              </button>
                            )}

                            {/* Audio Call button - only show for call mode after patient is called */}
                            {buttons.includes('audioCall') && isCallMode && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('📞 Audio Call button clicked for appointmentId:', appointmentId)
                                  handleAudioCall(appointmentId)
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                                title="Start audio call"
                              >
                                <IoCallOutline className="h-3.5 w-3.5" />
                                Audio Call
                              </button>
                            )}

                            {/* Recall button - only show when called/in-consultation and recallCount < 2 */}
                            {buttons.includes('recall') && (
                              <button
                                type="button"
                                onClick={() => handleRecall(appointmentId)}
                                className="flex items-center gap-1.5 rounded-lg border border-[#11496c] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#11496c] transition hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                              >
                                <IoRefreshOutline className="h-3.5 w-3.5" />
                                Recall
                              </button>
                            )}

                            {/* Skip button */}
                            {buttons.includes('skip') && (
                              <button
                                type="button"
                                onClick={() => handleSkip(appointmentId)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                              >
                                Skip
                              </button>
                            )}

                            {/* No Show button */}
                            {buttons.includes('noShow') && (
                              <button
                                type="button"
                                onClick={() => handleNoShow(appointmentId)}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
                              >
                                No Show
                              </button>
                            )}

                            {/* Complete button */}
                            {buttons.includes('complete') && (
                              <button
                                type="button"
                                onClick={() => handleComplete(appointmentId)}
                                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                              >
                                <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                                Complete
                              </button>
                            )}
                          </>
                        )
                      })()}
                      
                      {/* History button for no-show appointments */}
                      {appointment.status === 'no-show' && (
                        <button
                          type="button"
                          onClick={() => handleViewHistory(appointment)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                        >
                          <IoDocumentTextOutline className="h-3.5 w-3.5" />
                          History
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </section>

      {/* Medical History Modal */}
      {showHistoryModal && selectedPatient && medicalHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHistoryModal(false)
            }
          }}
        >
          <div className="relative w-full max-w-md max-h-[90vh] rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPatient.patientImage}
                  alt={selectedPatient.patientName}
                  className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedPatient.patientName}</h2>
                  <p className="text-xs text-slate-600">
                    {selectedPatient.age} years • {selectedPatient.gender}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Personal Information */}
              {medicalHistory.personalInfo && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Personal Information
                  </h3>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="grid gap-2 grid-cols-2">
                      {medicalHistory.personalInfo.bloodGroup && (
                        <div>
                          <p className="text-xs text-slate-600">Blood Group</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {medicalHistory.personalInfo.bloodGroup}
                          </p>
                        </div>
                      )}
                      {medicalHistory.personalInfo.phone && (
                        <div>
                          <p className="text-xs text-slate-600">Phone</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {medicalHistory.personalInfo.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Conditions */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Conditions
                </h3>
                {medicalHistory.conditions && medicalHistory.conditions.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.conditions.map((condition, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{condition.name || condition}</p>
                        {condition.diagnosedDate && (
                          <p className="text-xs text-slate-600 mt-1">
                            Since {formatDate(condition.diagnosedDate)} • {condition.status || 'Active'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">No known conditions</p>
                  </div>
                )}
              </div>

              {/* Allergies */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Allergies
                </h3>
                {medicalHistory.allergies && medicalHistory.allergies.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.allergies.map((allergy, idx) => (
                      <div key={idx} className="rounded-lg bg-red-50 p-3">
                        <p className="text-sm font-semibold text-red-900">{allergy.name || allergy}</p>
                        {allergy.severity && (
                          <p className="text-xs text-red-700 mt-1">
                            {allergy.severity} • {allergy.reaction || ''}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs text-slate-500">No known allergies</p>
                  </div>
                )}
              </div>

              {/* Current Medications */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Current Medications
                </h3>
                {medicalHistory.medications && medicalHistory.medications.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.medications.map((med, idx) => (
                      <div key={idx} className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-sm font-semibold text-emerald-900">
                          {med.name || med}
                        </p>
                        {med.dosage && med.frequency && (
                          <p className="text-xs text-emerald-700 mt-1">
                            {med.dosage} • {med.frequency}
                          </p>
                        )}
                        {med.startDate && (
                          <p className="text-xs text-emerald-600 mt-1">Since {formatDate(med.startDate)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs text-slate-500">No current medications</p>
                  </div>
                )}
              </div>

              {/* Vitals Records */}
              {(() => {
                try {
                  const historyKey = `patientHistory_${selectedPatient?.patientId}`
                  const savedHistory = JSON.parse(localStorage.getItem(historyKey) || '{}')
                  const vitalsRecords = savedHistory.vitalsRecords || []
                  
                  if (vitalsRecords.length > 0) {
                    return (
                      <div>
                        <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Vitals Records
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {vitalsRecords.map((vital, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-slate-600">
                                  {vital.recordedAt || formatDate(vital.date)}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {vital.bloodPressure?.systolic && vital.bloodPressure?.diastolic && (
                                  <div>
                                    <p className="text-slate-600">BP</p>
                                    <p className="font-semibold text-slate-900">
                                      {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg
                                    </p>
                                  </div>
                                )}
                                {vital.temperature && (
                                  <div>
                                    <p className="text-slate-600">Temp</p>
                                    <p className="font-semibold text-slate-900">{vital.temperature} °F</p>
                                  </div>
                                )}
                                {vital.pulse && (
                                  <div>
                                    <p className="text-slate-600">Pulse</p>
                                    <p className="font-semibold text-slate-900">{vital.pulse} bpm</p>
                                  </div>
                                )}
                                {vital.respiratoryRate && (
                                  <div>
                                    <p className="text-slate-600">RR</p>
                                    <p className="font-semibold text-slate-900">{vital.respiratoryRate} /min</p>
                                  </div>
                                )}
                                {vital.oxygenSaturation && (
                                  <div>
                                    <p className="text-slate-600">SpO2</p>
                                    <p className="font-semibold text-slate-900">{vital.oxygenSaturation}%</p>
                                  </div>
                                )}
                                {vital.weight && (
                                  <div>
                                    <p className="text-slate-600">Weight</p>
                                    <p className="font-semibold text-slate-900">{vital.weight} kg</p>
                                  </div>
                                )}
                                {vital.height && (
                                  <div>
                                    <p className="text-slate-600">Height</p>
                                    <p className="font-semibold text-slate-900">{vital.height} cm</p>
                                  </div>
                                )}
                                {vital.bmi && (
                                  <div>
                                    <p className="text-slate-600">BMI</p>
                                    <p className="font-semibold text-slate-900">{vital.bmi}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                } catch (error) {
                  console.error('Error loading vitals records:', error)
                }
                return null
              })()}

              {/* Previous Consultations */}
              {medicalHistory.previousConsultations && medicalHistory.previousConsultations.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Previous Consultations
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {medicalHistory.previousConsultations.map((consult, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-900">{consult.diagnosis}</p>
                            <p className="mt-1 text-xs text-slate-600">{formatDate(consult.date)}</p>
                            <p className="mt-1 text-xs text-slate-600">Dr. {consult.doctor}</p>
                            {consult.medications && consult.medications.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {consult.medications.map((med, medIdx) => (
                                  <span
                                    key={medIdx}
                                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                  >
                                    {med}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Reports */}
              {medicalHistory.labReports && medicalHistory.labReports.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Lab Reports
                  </h3>
                  <div className="space-y-2">
                    {medicalHistory.labReports.map((report, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{report.testName}</p>
                            <p className="mt-1 text-xs text-slate-600">{formatDate(report.date)}</p>
                            <p className="mt-1 text-xs font-medium text-slate-900">{report.result}</p>
                            <span
                              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                report.status === 'Normal'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Visit */}
              {medicalHistory.lastVisit && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Last Visit
                  </h3>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-700">{formatDate(medicalHistory.lastVisit)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Session Modal */}
      {showCancelSessionModal && currentSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowCancelSessionModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <IoCloseCircleOutline className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Cancel Session</h2>
                  <p className="text-xs text-slate-600">{currentSession?.date ? formatDate(currentSession.date) : 'N/A'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelSessionModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-800 mb-1">Warning</p>
                <p className="text-xs text-red-700">
                  Cancelling this session will cancel all appointments. Patients will be notified and can reschedule.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this session..."
                  rows="4"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-200 p-4 sm:p-6">
              <button
                type="button"
                onClick={() => {
                  setShowCancelSessionModal(false)
                  setCancelReason('')
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Keep Session
              </button>
              <button
                type="button"
                onClick={handleCancelSession}
                disabled={!cancelReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DoctorPatients
