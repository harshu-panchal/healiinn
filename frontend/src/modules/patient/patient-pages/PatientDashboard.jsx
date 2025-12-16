import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoSearchOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoMedicalOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoHomeOutline,
  IoBagHandleOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
  IoChatbubbleOutline,
  IoCheckmarkCircleOutline,
  IoWalletOutline,
  IoHelpCircleOutline,
  IoArrowForwardOutline,
  IoReceiptOutline,
  IoArchiveOutline,
} from 'react-icons/io5'
import PatientNavbar from '../patient-components/PatientNavbar'
import PatientSidebar from '../patient-components/PatientSidebar'
import { useToast } from '../../../contexts/ToastContext'
import { getPatientDashboard, getPatientProfile } from '../patient-services/patientService'
import NotificationBell from '../../../components/NotificationBell'

// Category cards configuration (values will be populated from API)
const categoryCardsConfig = [
  {
    id: 'appointments',
    title: 'APPOINTMENTS',
    description: 'Upcoming',
    iconBgColor: '#1976D2',
    icon: IoCalendarOutline,
    route: '/patient/appointments',
    dataKey: 'upcomingAppointmentsCount', // Use count instead of array
  },
  {
    id: 'prescriptions',
    title: 'PRESCRIPTION AND LAB REPORT',
    description: 'Active',
    iconBgColor: '#14B8A6',
    icon: IoDocumentTextOutline,
    route: '/patient/prescriptions',
    dataKey: 'activePrescriptions',
  },
  {
    id: 'orders',
    title: 'ORDERS',
    description: 'Recent',
    iconBgColor: '#3B82F6',
    icon: IoBagHandleOutline,
    route: '/patient/orders',
    dataKey: 'recentOrders',
  },
  {
    id: 'requests',
    title: 'REQUESTS',
    description: 'Responses',
    iconBgColor: '#8B5CF6',
    icon: IoChatbubbleOutline,
    route: '/patient/requests',
    dataKey: 'pendingRequests',
  },
]

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <svg key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  if (hasHalfStar) {
    stars.push(
      <svg key="half" className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
        <defs>
          <linearGradient id={`half-fill-${rating}`}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path fill={`url(#half-fill-${rating})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  const remainingStars = 5 - Math.ceil(rating)
  for (let i = 0; i < remainingStars; i++) {
    stars.push(
      <svg key={`empty-${i}`} className="h-3.5 w-3.5 fill-slate-300 text-slate-300" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  return stars
}

const navItems = [
  { id: 'home', label: 'Home', to: '/patient/dashboard', Icon: IoHomeOutline },
  { id: 'doctors', label: 'Doctors', to: '/patient/doctors', Icon: IoPeopleOutline },
  { id: 'transactions', label: 'Transactions', to: '/patient/transactions', Icon: IoReceiptOutline },
  { id: 'history', label: 'History', to: '/patient/history', Icon: IoArchiveOutline },
  { id: 'support', label: 'Support', to: '/patient/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/patient/profile', Icon: IoPersonCircleOutline },
]

// Helper function to check if doctor is active
const isDoctorActive = (doctorName) => {
  try {
    const saved = localStorage.getItem('doctorProfile')
    if (saved) {
      const profile = JSON.parse(saved)
      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      // Check if this doctor matches the saved profile
      if (doctorName.includes(profile.firstName) || doctorName.includes(profile.lastName) || doctorName === fullName) {
        return profile.isActive !== false // Default to true if not set
      }
    }
    // Check separate active status
    const activeStatus = localStorage.getItem('doctorProfileActive')
    if (activeStatus !== null) {
      const isActive = JSON.parse(activeStatus)
      // If doctor name matches, return the status
      if (saved) {
        const profile = JSON.parse(saved)
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
        if (doctorName.includes(profile.firstName) || doctorName.includes(profile.lastName) || doctorName === fullName) {
          return isActive
        }
      }
    }
  } catch (error) {
    console.error('Error checking doctor active status:', error)
  }
  // Default: show all doctors if no profile found (for mock data)
  return true
}

const PatientDashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleButtonRef = useRef(null)
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [profile, setProfile] = useState(null)

  // Fetch profile data for location
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { getAuthToken } = await import('../../../utils/apiClient')
        const token = getAuthToken('patient')
        if (!token) return

        const response = await getPatientProfile()
        if (response.success && response.data) {
          const patient = response.data.patient || response.data
          setProfile({
            address: patient.address || {},
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        // Don't show error toast as it's not critical
      }
    }
    fetchProfile()
  }, [])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Check if user is authenticated before making API call
      const { getAuthToken } = await import('../../../utils/apiClient')
      const token = getAuthToken('patient')
      
      if (!token) {
        // No token, redirect to login
        navigate('/patient/login')
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        const response = await getPatientDashboard()
        
        if (response.success && response.data) {
          setDashboardData(response.data)
          
          // Set category card values
          const data = response.data
          
          // Set upcoming appointments
          if (data.upcomingAppointments) {
            setUpcomingAppointments(data.upcomingAppointments)
          }
          
          // Set doctors (if available in dashboard response)
          if (data.recommendedDoctors) {
            setDoctors(data.recommendedDoctors)
          }
        }
      } catch (err) {
        // Handle 401 Unauthorized - user logged out
        if (err.message && (err.message.includes('Authentication token missing') || err.message.includes('Unauthorized') || err.message.includes('401') || err.message.includes('Session expired'))) {
          // Don't show error toast for auth errors - user is being redirected
          // Clear tokens and redirect to login (apiClient should handle this, but ensure it happens)
          const { clearTokens } = await import('../../../utils/apiClient')
          clearTokens('patient')
          // Don't navigate if already on login page or if redirect is happening
          if (!window.location.pathname.includes('/login')) {
            navigate('/patient/login')
          }
          return
        }
        
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast, navigate])

  // Get category cards with real data
  const categoryCards = useMemo(() => {
    if (!dashboardData) return categoryCardsConfig.map(card => ({ ...card, value: '0' }))
    
    return categoryCardsConfig.map(card => {
      let value = dashboardData[card.dataKey]
      
      // Handle arrays - get length instead of array itself
      if (Array.isArray(value)) {
        value = value.length
      }
      
      // Handle objects - try to get count property or default to 0
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        value = value.count || value.length || 0
      }
      
      return {
      ...card,
        value: String(value || 0),
      }
    })
  }, [dashboardData])

  const filteredDoctors = useMemo(() => {
    let filtered = [...doctors]

    // Filter by active status
    filtered = filtered.filter((doctor) => isDoctorActive(doctor.name || `${doctor.firstName} ${doctor.lastName}`))

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(
        (doctor) => {
          const name = doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()
          const specialty = doctor.specialty || doctor.specialization || ''
          return (
            name.toLowerCase().includes(normalizedSearch) ||
            specialty.toLowerCase().includes(normalizedSearch)
          )
        }
      )
    }

    return filtered
  }, [searchTerm, doctors])

  const handleTakeToken = (doctorId, fee) => {
    if (!doctorId) {
      toast.error('Doctor information is not available. Please try again.')
      return
    }
    navigate(`/patient/doctors/${doctorId}?book=true`)
  }

  const handleSidebarToggle = () => {
    if (isSidebarOpen) {
      handleSidebarClose()
    } else {
      setIsSidebarOpen(true)
    }
  }

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    setIsSidebarOpen(false)
  }

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      // Import logout function from patientService
      const { logoutPatient } = await import('../patient-services/patientService')
      await logoutPatient()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      // Clear tokens manually if API call fails
      const { clearPatientTokens } = await import('../patient-services/patientService')
      clearPatientTokens()
      toast.success('Logged out successfully')
    }
    // Navigate to login page
    setTimeout(() => {
      navigate('/patient/login', { replace: true })
    }, 500)
  }

  return (
    <section className="flex flex-col gap-4 pb-4 -mt-20">
      {/* Top Header with Gradient Background */}
      <header 
        className="relative text-white -mx-4 mb-4 overflow-hidden"
        style={{
          background: 'linear-gradient(to right, #11496c 0%, #1a5a7a 50%, #2a7a9a 100%)'
        }}
      >
        <div className="px-4 pt-5 pb-4">
          {/* Top Row: Brand and Icons */}
          <div className="flex items-start justify-between mb-3.5">
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-white leading-tight mb-0.5">Healiinn</h1>
              <p className="text-sm font-normal text-white/95 leading-tight">Digital Healthcare</p>
            </div>
            <div className="flex items-center gap-4 pt-0.5">
              <NotificationBell className="text-white" />
              <button
                type="button"
                ref={toggleButtonRef}
                onClick={handleSidebarToggle}
                className="flex items-center justify-center p-1 rounded-lg transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Toggle navigation menu"
              >
                <IoMenuOutline className="h-6 w-6 text-white" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {/* Location Row */}
          <div className="flex items-center gap-1.5">
            <IoLocationOutline className="h-4 w-4 text-white" strokeWidth={2} />
            <span className="text-xs font-normal text-white">
              {profile?.address?.city && profile?.address?.state
                ? `${profile.address.city}, ${profile.address.state}`
                : profile?.address?.city || profile?.address?.state || profile?.address?.line1 || 'Location not set'}
            </span>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors or specialties"
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value
              setSearchTerm(value)
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:border-[#11496c] transition-all"
            onFocus={(e) => {
              e.target.style.borderColor = '#11496c'
              e.target.style.boxShadow = '0 0 0 2px rgba(17, 73, 108, 0.2)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = ''
              e.target.style.boxShadow = ''
            }}
          />
        </div>
      </div>

      {/* Category Cards - 3x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {categoryCards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.id}
              onClick={() => navigate(card.route)}
              className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-left transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 leading-tight flex-1 min-w-0 pr-1">
                  {card.title}
                </h3>
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: card.iconBgColor }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 mb-0.5 leading-none">{card.value}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{card.description}</p>
            </button>
          )
        })}
      </div>

      {/* Upcoming Schedule Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Upcoming Schedule</h2>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="flex items-center gap-1 text-sm font-semibold text-[#11496c] hover:text-[#0d3a52] transition-colors"
          >
            <span>See All</span>
            <IoArrowForwardOutline className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-slate-500">Loading appointments...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-red-500">Failed to load appointments</div>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-slate-500">No upcoming appointments</div>
            </div>
          ) : (
            upcomingAppointments.slice(0, 2).map((appointment) => {
              const doctorName = appointment.doctorId?.firstName && appointment.doctorId?.lastName
                ? `Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`
                : appointment.doctorName || 'Dr. Unknown'
              const specialty = appointment.doctorId?.specialization || appointment.specialty || appointment.doctorSpecialty || ''
              const appointmentDate = new Date(appointment.appointmentDate || appointment.date)
              
              // Convert time to 12-hour format if needed
              const convertTimeTo12Hour = (timeStr) => {
                if (!timeStr) return '';
                if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
                const [hours, minutes] = timeStr.split(':').map(Number);
                if (isNaN(hours) || isNaN(minutes)) return timeStr;
                const period = hours >= 12 ? 'PM' : 'AM';
                const hours12 = hours % 12 || 12;
                return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
              };
              
              const time = convertTimeTo12Hour(appointment.time || appointment.appointmentTime) || appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              
              // Format location
              const location = appointment.location || appointment.clinic || null
              
              return (
            <div
                  key={appointment._id || appointment.id}
              onClick={() => {
                    navigate(`/patient/appointments?appointment=${appointment._id || appointment.id}`)
              }}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-[#11496c] hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <img
                    src={appointment.doctorId?.profileImage || appointment.doctorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=11496c&color=fff&size=128&bold=true`}
                    alt={doctorName}
                className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=11496c&color=fff&size=128&bold=true`
                }}
              />
              <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 mb-0.5 leading-tight">{doctorName}</h3>
                    <p className="text-xs text-slate-600 mb-1.5">{specialty}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-1">
                  <div className="flex items-center gap-1">
                    <IoCalendarOutline className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IoTimeOutline className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{time}</span>
                      </div>
                    </div>
                    {(appointment.clinic || location) && (
                      <p className="text-xs text-slate-500">{location || appointment.clinic}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Doctors Section */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Doctors</h2>

        {/* Doctor Cards */}
        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                <IoPeopleOutline className="h-8 w-8" />
              </div>
              <p className="text-lg font-semibold text-slate-700">No doctors found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm.trim() 
                  ? `No doctors match "${searchTerm}". Try a different search term.`
                  : 'No doctors available at the moment.'}
              </p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
            <div
              key={doctor._id || doctor.id}
              onClick={() => navigate(`/patient/doctors/${doctor._id || doctor.id}`)}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="p-4">
                {/* Doctor Info Row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={doctor.image || doctor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim())}&background=11496c&color=fff&size=128&bold=true`}
                      alt={doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()}
                      className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim())}&background=11496c&color=fff&size=128&bold=true`
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 mb-0.5 leading-tight">
                      {doctor.name || `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()}
                    </h3>
                    <p className="text-xs text-slate-600 mb-0.5">{doctor.specialty || doctor.specialization || ''}</p>
                    {doctor.clinicName && (
                      <p className="text-xs font-semibold text-slate-700 mb-0.5">{doctor.clinicName}</p>
                    )}
                    {doctor.clinicAddress && (
                      <p className="text-xs text-slate-500 mb-1.5 line-clamp-2">{doctor.clinicAddress}</p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">{renderStars(doctor.rating || doctor.averageRating || 0)}</div>
                      <span className="text-xs font-semibold text-slate-700">
                        {(doctor.rating || doctor.averageRating || 0).toFixed(1)} ({doctor.reviewCount || doctor.totalReviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-base font-bold text-slate-900">₹{doctor.fee || doctor.consultationFee || 0}</div>
                  </div>
                </div>

                {/* Availability Section - Now Serving */}
                {doctor.isServing && doctor.nextToken && (
                  <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)', border: '1px solid rgba(17, 73, 108, 0.3)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-xs font-semibold text-slate-800">Now Serving</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1.5">Your ETA if you book now:</p>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-900">Token #{doctor.nextToken}</span>
                      {doctor.eta && (
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <IoTimeOutline className="h-3.5 w-3.5" />
                        <span className="font-medium">{doctor.eta}</span>
                      </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Take Token Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTakeToken(doctor._id || doctor.id, doctor.fee || doctor.consultationFee || 0)
                  }}
                  className="w-full text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors shadow-sm"
                  style={{ 
                    backgroundColor: '#11496c',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0d3a52'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#11496c'
                  }}
                  onMouseDown={(e) => {
                    e.target.style.backgroundColor = '#0a2d3f'
                  }}
                  onMouseUp={(e) => {
                    e.target.style.backgroundColor = '#11496c'
                  }}
                >
                  Take Token • ₹{doctor.fee || doctor.consultationFee || 0}
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar */}
      <PatientSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={navItems}
        onLogout={handleLogout}
      />
    </section>
  )
}

export default PatientDashboard
