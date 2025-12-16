import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoCallOutline,
} from 'react-icons/io5'
import { getPatientAppointments, rescheduleAppointment, createAppointmentPaymentOrder, verifyAppointmentPayment } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'
import { getSocket } from '../../../utils/socketClient'

// Default appointments (will be replaced by API data)
const defaultAppointments = []

// Map backend status to frontend display status
const mapBackendStatusToDisplay = (backendStatus) => {
  switch (backendStatus) {
    case 'scheduled':
      return 'scheduled' // Backend 'scheduled' shows as 'scheduled' for patient
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'no_show':
      return 'no_show'
    default:
      return backendStatus || 'scheduled'
  }
}

// Helper function to convert time to 12-hour format
const convertTimeTo12Hour = (timeStr) => {
  if (!timeStr) return '';
  // If already in 12-hour format (contains AM/PM), return as is
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }
  // Convert 24-hour format to 12-hour format
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getStatusColor = (status) => {
  // Handle both backend and frontend statuses
  const displayStatus = mapBackendStatusToDisplay(status)
  
  switch (displayStatus) {
    case 'confirmed':
      return 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
    case 'scheduled':
      return 'bg-blue-100 text-blue-700'
    case 'upcoming': // Legacy support
      return 'bg-blue-100 text-blue-700'
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    case 'no_show':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getStatusIcon = (status) => {
  const displayStatus = mapBackendStatusToDisplay(status)
  switch (displayStatus) {
    case 'confirmed':
      return <IoCheckmarkCircleOutline className="h-4 w-4" />
    case 'scheduled':
      return <IoCalendarOutline className="h-4 w-4" />
    case 'upcoming': // Legacy support
      return <IoCalendarOutline className="h-4 w-4" />
    case 'completed':
      return <IoCheckmarkCircleOutline className="h-4 w-4" />
    case 'cancelled':
      return <IoCloseCircleOutline className="h-4 w-4" />
    default:
      return null
  }
}

const PatientAppointments = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [appointments, setAppointments] = useState(defaultAppointments)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inConsultationRoom, setInConsultationRoom] = useState(false)
  const [consultationAppointmentId, setConsultationAppointmentId] = useState(null)

  // Fetch appointments from API - Always fetch all appointments, filter on frontend
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)
        // Always fetch all appointments including cancelled, we'll filter on frontend
        // Pass empty object to get all appointments (backend will include cancelled)
        const response = await getPatientAppointments({})
        
        console.log('📋 Patient appointments fetched:', {
          success: response.success,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          hasItems: !!response.data?.items,
          hasAppointments: !!response.data?.appointments,
          count: Array.isArray(response.data) 
            ? response.data.length 
            : (response.data?.items?.length || response.data?.appointments?.length || 0),
        })
        
        if (response.success && response.data) {
          // Handle both array and object with items/appointments property
          let appointmentsData = []
          
          if (Array.isArray(response.data)) {
            appointmentsData = response.data
          } else if (response.data.items && Array.isArray(response.data.items)) {
            appointmentsData = response.data.items
          } else if (response.data.appointments && Array.isArray(response.data.appointments)) {
            appointmentsData = response.data.appointments
          } else {
            console.warn('⚠️ Unexpected response data structure:', response.data)
            appointmentsData = []
          }
          
          // Transform API data to match component structure
          const transformedAppointments = appointmentsData.map(apt => ({
            id: apt._id || apt.id,
            _id: apt._id || apt.id,
            doctor: apt.doctorId ? {
              id: apt.doctorId._id || apt.doctorId.id,
              name: apt.doctorId.firstName && apt.doctorId.lastName
                ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`
                : apt.doctorId.name || 'Dr. Unknown',
              specialty: apt.doctorId.specialization || apt.doctorId.specialty || '',
              image: apt.doctorId.profileImage || apt.doctorId.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorId.firstName || 'Doctor')}&background=11496c&color=fff&size=128&bold=true`,
            } : apt.doctor || {},
            date: apt.appointmentDate || apt.date,
            time: convertTimeTo12Hour(apt.time || ''),
            status: apt.status || 'scheduled',
            type: apt.appointmentType || apt.type || 'In-Person',
            clinic: apt.doctorId?.clinicDetails?.name || apt.clinicDetails?.name || apt.clinic || '',
            location: (() => {
              // Try to get location from doctor's clinicDetails first
              const doctorClinic = apt.doctorId?.clinicDetails;
              if (doctorClinic?.address) {
                const parts = [];
                if (doctorClinic.address.line1) parts.push(doctorClinic.address.line1);
                if (doctorClinic.address.city) parts.push(doctorClinic.address.city);
                if (doctorClinic.address.state) parts.push(doctorClinic.address.state);
                if (doctorClinic.address.pincode) parts.push(doctorClinic.address.pincode);
                return parts.join(', ').trim();
              }
              // Fallback to appointment's clinicDetails
              const aptClinic = apt.clinicDetails;
              if (aptClinic?.address) {
                const parts = [];
                if (aptClinic.address.line1) parts.push(aptClinic.address.line1);
                if (aptClinic.address.city) parts.push(aptClinic.address.city);
                if (aptClinic.address.state) parts.push(aptClinic.address.state);
                if (aptClinic.address.pincode) parts.push(aptClinic.address.pincode);
                return parts.join(', ').trim();
              }
              return apt.location || '';
            })(),
            token: apt.tokenNumber ? `Token #${apt.tokenNumber}` : apt.token || null,
            fee: apt.fee || apt.consultationFee || 0,
            paymentStatus: apt.paymentStatus || 'paid', // Include payment status
            cancelledBy: apt.cancelledBy,
            cancelledAt: apt.cancelledAt,
            cancelReason: apt.cancellationReason || apt.cancelReason,
            rescheduledAt: apt.rescheduledAt,
            rescheduledBy: apt.rescheduledBy,
            rescheduleReason: apt.rescheduleReason,
            isRescheduled: !!apt.rescheduledAt, // Flag to identify rescheduled appointments
            sessionId: apt.sessionId, // Include sessionId for cancelled session date check
            originalData: apt, // Keep original data for reference
          }))
          
          setAppointments(transformedAppointments)
          
          // Check if any appointment is in 'called' or 'in-consultation' status
          // Also check queueStatus to handle skipped appointments that might be recalled
          const activeConsultation = transformedAppointments.find(apt => {
            const status = apt.status || apt.originalData?.status
            const queueStatus = apt.queueStatus || apt.originalData?.queueStatus
            // Active if status is called/in-consultation OR if patient is waiting after being recalled
            return status === 'called' || 
                   status === 'in-consultation' || 
                   status === 'in_progress' ||
                   (status === 'waiting' && apt.originalData?.recallCount > 0) // Recalled patient
          })
          
          if (activeConsultation) {
            const appointmentId = activeConsultation.id || activeConsultation._id
            // Update consultation room state based on appointment status from backend
            // Always set based on current appointment status (handles refresh)
            setInConsultationRoom(true)
            setConsultationAppointmentId(appointmentId)
            try {
              const consultationState = {
                appointmentId: appointmentId,
                tokenNumber: activeConsultation.originalData?.tokenNumber || null,
                calledAt: new Date().toISOString(),
                isInConsultation: true,
              }
              localStorage.setItem('patientConsultationRoom', JSON.stringify(consultationState))
              console.log('✅ Consultation room state set from appointment status:', consultationState)
            } catch (error) {
              console.error('Error saving consultation room state:', error)
            }
          } else {
            // No active consultation found - check if we should clear state
            // Only clear if consultation was completed (not if skipped)
            try {
              const savedState = localStorage.getItem('patientConsultationRoom')
              if (savedState) {
                const consultationState = JSON.parse(savedState)
                // Check if the saved appointment still exists and is completed/cancelled
                const savedAppointment = transformedAppointments.find(apt => 
                  (apt.id || apt._id)?.toString() === consultationState.appointmentId?.toString()
                )
                if (savedAppointment && 
                    (savedAppointment.status === 'completed' || savedAppointment.status === 'cancelled')) {
                  // Only clear if appointment is completed or cancelled
                  setInConsultationRoom(false)
                  setConsultationAppointmentId(null)
                  localStorage.removeItem('patientConsultationRoom')
                  console.log('✅ Cleared consultation room state - appointment completed/cancelled')
                }
                // If appointment is skipped, keep consultation room state (patient might be recalled)
              }
            } catch (error) {
              console.error('Error checking consultation room state:', error)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching appointments:', err)
        
        // Don't show error toast for rate limiting - just set error state
        if (err.message?.includes('Too many requests') || err.response?.status === 429) {
          setError('Too many requests. Please wait a moment and refresh the page.')
          // Don't retry immediately - wait for user action
        } else {
        setError(err.message || 'Failed to load appointments')
        toast.error('Failed to load appointments')
        }
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to prevent rapid requests on mount
    const timeoutId = setTimeout(() => {
    fetchAppointments()
    }, 100)
    
    // Listen for appointment booking event to refresh
    const handleAppointmentBooked = () => {
      // Debounce the refresh to prevent rapid requests
      setTimeout(() => {
      fetchAppointments()
      }, 500)
    }
    window.addEventListener('appointmentBooked', handleAppointmentBooked)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('appointmentBooked', handleAppointmentBooked)
    }
  }, [toast]) // Remove filter dependency - fetch all appointments once

  // Check for consultation room state on mount and restore it
  // Also check appointment status from backend to validate
  useEffect(() => {
    const restoreConsultationState = async () => {
      try {
        const savedState = localStorage.getItem('patientConsultationRoom')
        if (savedState) {
          const consultationState = JSON.parse(savedState)
          if (consultationState?.isInConsultation && consultationState?.appointmentId) {
            // Verify appointment status from backend
            const response = await getPatientAppointments({})
            if (response.success && response.data) {
              let appointmentsData = []
              if (Array.isArray(response.data)) {
                appointmentsData = response.data
              } else if (response.data.items && Array.isArray(response.data.items)) {
                appointmentsData = response.data.items
              } else if (response.data.appointments && Array.isArray(response.data.appointments)) {
                appointmentsData = response.data.appointments
              }
              
              const appointment = appointmentsData.find(apt => 
                (apt._id || apt.id)?.toString() === consultationState.appointmentId?.toString()
              )
              
              // Only restore if appointment is still in called/in-consultation status
              // Don't restore if completed or cancelled
              if (appointment && 
                  (appointment.status === 'called' || 
                   appointment.status === 'in-consultation' || 
                   appointment.status === 'in_progress')) {
                setInConsultationRoom(true)
                setConsultationAppointmentId(consultationState.appointmentId)
                console.log('✅ Restored consultation room state:', consultationState)
              } else {
                // Appointment is no longer in consultation, clear state
                localStorage.removeItem('patientConsultationRoom')
                console.log('✅ Cleared consultation room state - appointment no longer in consultation')
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading consultation room state:', error)
      }
    }
    
    restoreConsultationState()
  }, [])

  // Setup socket listener for token:called event
  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      console.warn('⚠️ Patient socket not connected')
      return
    }
    
    console.log('✅ Patient socket connected, listening for call invites. Socket ID:', socket.id)

    const handleTokenCalled = (data) => {
      if (data?.appointmentId) {
        setInConsultationRoom(true)
        setConsultationAppointmentId(data.appointmentId)
        try {
          const consultationState = {
            appointmentId: data.appointmentId,
            tokenNumber: data.tokenNumber || null,
            calledAt: new Date().toISOString(),
            isInConsultation: true,
          }
          localStorage.setItem('patientConsultationRoom', JSON.stringify(consultationState))
          console.log('✅ Consultation room state saved from socket:', consultationState)
        } catch (error) {
          console.error('Error saving consultation room state:', error)
        }
        toast.info('Doctor has called you! Please enter the consultation room.', {
          duration: 5000,
        })
      }
    }

    const handleConsultationCompleted = () => {
      setInConsultationRoom(false)
      setConsultationAppointmentId(null)
      localStorage.removeItem('patientConsultationRoom')
      console.log('✅ Consultation completed, cleared room state')
    }

    const handleTokenRecalled = (data) => {
      // When patient is recalled, they should enter consultation room again
      if (data?.appointmentId) {
        setInConsultationRoom(true)
        setConsultationAppointmentId(data.appointmentId)
        try {
          const consultationState = {
            appointmentId: data.appointmentId,
            tokenNumber: data.tokenNumber || null,
            calledAt: new Date().toISOString(),
            isInConsultation: true,
          }
          localStorage.setItem('patientConsultationRoom', JSON.stringify(consultationState))
          console.log('✅ Consultation room state saved from recall:', consultationState)
        } catch (error) {
          console.error('Error saving consultation room state from recall:', error)
        }
        toast.info('You have been recalled! Please enter the consultation room.', {
          duration: 5000,
        })
      }
    }

    const handleAppointmentSkipped = (data) => {
      // When appointment is skipped, DON'T clear consultation room state
      // Patient might still be in consultation or will be recalled
      // Only update if this is the current consultation appointment
      if (data?.appointmentId && consultationAppointmentId === data.appointmentId) {
        console.log('⚠️ Appointment skipped but keeping consultation room state (patient may be recalled)')
        // Don't clear - patient might be recalled
      }
    }

    socket.on('token:called', handleTokenCalled)
    socket.on('token:recalled', handleTokenRecalled)
    socket.on('appointment:skipped', handleAppointmentSkipped)
    socket.on('consultation:completed', handleConsultationCompleted)

    return () => {
      socket.off('token:called', handleTokenCalled)
      socket.off('token:recalled', handleTokenRecalled)
      socket.off('appointment:skipped', handleAppointmentSkipped)
      socket.off('consultation:completed', handleConsultationCompleted)
    }
  }, [toast, consultationAppointmentId])

  const handleRescheduleAppointment = (appointmentId, doctorId) => {
    navigate(`/patient/doctors/${doctorId}?reschedule=${appointmentId}`)
  }

  const handleCompletePayment = async (appointment) => {
    try {
      const appointmentId = appointment.id || appointment._id
      
      // Create payment order
      const paymentOrderResponse = await createAppointmentPaymentOrder(appointmentId)
      
      if (!paymentOrderResponse.success) {
        toast.error(paymentOrderResponse.message || 'Failed to create payment order. Please try again.')
        return
      }

      const { orderId, amount, currency, razorpayKeyId } = paymentOrderResponse.data

      // Initialize Razorpay payment
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page and try again.')
        return
      }

      const options = {
        key: razorpayKeyId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency || 'INR',
        name: 'Healiinn',
        description: `Appointment payment for ${appointment.doctor.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await verifyAppointmentPayment(appointmentId, {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              paymentMethod: 'razorpay',
            })

            if (verifyResponse.success) {
              toast.success('Payment successful! Appointment confirmed.')
              // Refresh appointments
              window.dispatchEvent(new CustomEvent('appointmentBooked'))
            } else {
              toast.error(verifyResponse.message || 'Payment verification failed.')
            }
          } catch (error) {
            console.error('Error verifying payment:', error)
            toast.error(error.message || 'Error verifying payment. Please contact support.')
          }
        },
        prefill: {
          name: '', // Can be filled from user profile if available
          email: '',
          contact: '',
        },
        theme: {
          color: '#11496c',
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed')
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error(error.message || 'Error processing payment. Please try again.')
    }
  }

  // Calculate filtered appointments - MUST be before early returns (React Hooks rule)
  const filteredAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return []
    }
    
    // Filter out appointments with pending payment status - these should not be shown to patients
    const validAppointments = appointments.filter(apt => {
      // Don't show appointments with pending payment status (payment failed or not completed)
      return apt.paymentStatus !== 'pending'
    })
    
    if (filter === 'all') {
      return validAppointments
    } else if (filter === 'rescheduled') {
      return validAppointments.filter(apt => apt.isRescheduled)
    } else if (filter === 'scheduled') {
      return validAppointments.filter(apt => {
        const displayStatus = mapBackendStatusToDisplay(apt.status)
        // Show scheduled appointments but exclude rescheduled ones
        return (displayStatus === 'scheduled' || apt.status === 'upcoming') && !apt.isRescheduled
      })
    } else {
      return validAppointments.filter(apt => {
        const displayStatus = mapBackendStatusToDisplay(apt.status)
        return displayStatus === filter
      })
    }
  }, [appointments, filter])

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'scheduled', 'rescheduled', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === status
                ? 'bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)]'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status === 'scheduled' ? 'Scheduled' : status === 'rescheduled' ? 'Rescheduled' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Consultation Room Notice - Show when patient is in consultation */}
      {inConsultationRoom && consultationAppointmentId && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
              <IoCallOutline className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-green-900">You are in Consultation Room</h3>
              <p className="text-xs text-green-700 mt-0.5">Doctor has called you. Your consultation is in progress.</p>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="space-y-3">
        {filteredAppointments.map((appointment) => {
          const isInConsultation = inConsultationRoom && (
            consultationAppointmentId === appointment.id || 
            consultationAppointmentId === appointment._id
          )
          const isCalled = appointment.status === 'called' || 
                          appointment.status === 'in-consultation' || 
                          appointment.status === 'in_progress' ||
                          isInConsultation
          
          return (
          <article
            key={appointment.id}
            className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${
              isInConsultation 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                : isCalled
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={appointment.doctor.image}
                  alt={appointment.doctor.name}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100 bg-slate-100"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                  }}
                />
                {(() => {
                  const displayStatus = mapBackendStatusToDisplay(appointment.status)
                  const isInConsultation = inConsultationRoom && (
                    consultationAppointmentId === appointment.id || 
                    consultationAppointmentId === appointment._id
                  )
                  const isCalled = appointment.status === 'called' || 
                                  appointment.status === 'in-consultation' || 
                                  appointment.status === 'in_progress'
                  
                  if (isInConsultation) {
                    return (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 ring-2 ring-white animate-pulse">
                        <IoCallOutline className="h-3 w-3 text-white" />
                      </span>
                    )
                  }
                  
                  if (isCalled) {
                    return (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-white">
                        <IoCallOutline className="h-3 w-3 text-white" />
                      </span>
                    )
                  }
                  
                  return (displayStatus === 'confirmed' || displayStatus === 'scheduled' || appointment.status === 'upcoming') && (
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-white">
                      <IoCalendarOutline className="h-3 w-3 text-white" />
                    </span>
                  )
                })()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{appointment.doctor.name}</h3>
                    <p className="text-sm text-[#11496c]">{appointment.doctor.specialty}</p>
                  </div>
                  {(() => {
                    const displayStatus = mapBackendStatusToDisplay(appointment.status)
                    const isPendingPayment = appointment.paymentStatus === 'pending' && displayStatus !== 'cancelled'
                    // Priority: If cancelled, show "Cancelled" regardless of rescheduled status
                    // If pending payment, show "Pending Payment" with high priority
                    // Otherwise, show "Rescheduled" if rescheduled, or the actual status
                    const isInConsultation = inConsultationRoom && (
                      consultationAppointmentId === appointment.id || 
                      consultationAppointmentId === appointment._id
                    )
                    const isCalled = appointment.status === 'called' || 
                                    appointment.status === 'in-consultation' || 
                                    appointment.status === 'in_progress'
                    
                    let statusText = displayStatus === 'cancelled'
                      ? 'Cancelled'
                      : isPendingPayment
                      ? 'Pending Payment'
                      : appointment.isRescheduled 
                      ? 'Rescheduled' 
                      : isInConsultation
                      ? 'In Consultation'
                      : isCalled
                      ? 'Called'
                      : displayStatus === 'scheduled' 
                        ? 'Scheduled' 
                        : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)
                    
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold shrink-0 ${
                        isInConsultation
                          ? 'bg-green-100 text-green-700'
                          : displayStatus === 'cancelled' 
                          ? getStatusColor(appointment.status) 
                          : isPendingPayment
                          ? 'bg-amber-100 text-amber-700'
                          : appointment.isRescheduled 
                            ? 'bg-blue-100 text-blue-700' 
                            : isCalled
                            ? 'bg-blue-100 text-blue-700'
                            : getStatusColor(appointment.status)
                      }`}>
                        {isInConsultation ? <IoCallOutline className="h-3 w-3" /> : getStatusIcon(appointment.status)}
                        {statusText}
                      </span>
                    )
                  })()}
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <IoCalendarOutline className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{formatDate(appointment.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoTimeOutline className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{appointment.time}</span>
                    {appointment.token && (
                      <span className="ml-2 rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-0.5 text-xs font-semibold text-[#11496c]">
                        {appointment.token}
                      </span>
                    )}
                  </div>
                  {(appointment.location || appointment.clinic) && (
                    <div className="flex items-center gap-2">
                      <IoLocationOutline className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{appointment.location || appointment.clinic || 'Location not available'}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">{appointment.type}</span>
                    <span className="text-sm font-semibold text-slate-900">₹{appointment.fee}</span>
                  </div>
                </div>

                {appointment.paymentStatus === 'pending' && appointment.status !== 'cancelled' && (
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                      <p className="text-xs font-semibold text-amber-800 mb-1">
                        Payment Pending
                      </p>
                      <p className="text-xs text-amber-700">
                        Please complete payment to confirm your appointment. Amount: ₹{appointment.fee}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCompletePayment(appointment)
                      }}
                      className="flex-1 w-full rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(217,119,6,0.2)] transition hover:bg-amber-700 active:scale-95"
                    >
                      Complete Payment
                    </button>
                  </div>
                )}
                {appointment.status === 'cancelled' && (
                  <div className="mt-3 space-y-2">
                    {appointment.cancelledBy === 'doctor' && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-2.5">
                        <p className="text-xs font-semibold text-orange-800 mb-1">
                          Cancelled by Doctor
                        </p>
                        {appointment.cancelReason && (
                          <p className="text-xs text-orange-700">
                            Reason: {appointment.cancelReason}
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRescheduleAppointment(appointment.id, appointment.doctor.id)
                      }}
                      className="flex-1 w-full rounded-xl bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                    >
                      Reschedule Appointment
                    </button>
                  </div>
                )}
                {(appointment.status === 'confirmed' || appointment.status === 'scheduled' || appointment.status === 'upcoming') && appointment.paymentStatus !== 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/patient/doctors/${appointment.doctor.id}`)}
                      className="flex-1 rounded-xl bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                    >
                      View Details
                    </button>
                    {!appointment.isRescheduled && (
                      <button
                        onClick={() => handleRescheduleAppointment(appointment.id, appointment.doctor.id)}
                        className="flex-1 rounded-xl border border-[#11496c] bg-white px-3 py-2 text-xs font-semibold text-[#11496c] transition hover:bg-[#11496c]/5 active:scale-95"
                      >
                        Reschedule
                      </button>
                    )}
                  </div>
                )}
                {appointment.isRescheduled && appointment.status !== 'cancelled' && (
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                      <p className="text-xs font-semibold text-blue-800 mb-1">
                        Rescheduled Appointment
                      </p>
                      {appointment.rescheduleReason && (
                        <p className="text-xs text-blue-700">
                          {appointment.rescheduleReason}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/patient/doctors/${appointment.doctor.id}`)}
                        className="flex-1 rounded-xl bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
          )
        })}
      </div>

      {!loading && filteredAppointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            <IoCalendarOutline className="h-8 w-8" />
          </div>
          <p className="text-lg font-semibold text-slate-700">
            {appointments && appointments.length > 0 
              ? `No ${filter === 'all' ? '' : filter.charAt(0).toUpperCase() + filter.slice(1)} appointments found`
              : 'No appointments available'}
          </p>
          {appointments && appointments.length > 0 && (
            <p className="text-sm text-slate-500 mt-1">Try selecting a different filter</p>
          )}
        </div>
      )}

    </section>
  )
}

export default PatientAppointments

