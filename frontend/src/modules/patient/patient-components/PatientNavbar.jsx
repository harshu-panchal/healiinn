import { useRef, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  IoHomeOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
  IoMenuOutline,
  IoHelpCircleOutline,
  IoReceiptOutline,
  IoArchiveOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'
import PatientSidebar from './PatientSidebar'
import { useToast } from '../../../contexts/ToastContext'
import NotificationBell from '../../../components/NotificationBell'

// All nav items for sidebar and desktop navbar (includes Support)
const allNavItems = [
  { id: 'home', label: 'Home', to: '/patient/dashboard', Icon: IoHomeOutline },
  { id: 'doctors', label: 'Doctors', to: '/patient/doctors', Icon: IoPeopleOutline },
  { id: 'transactions', label: 'Transactions', to: '/patient/transactions', Icon: IoReceiptOutline },
  { id: 'history', label: 'History', to: '/patient/history', Icon: IoArchiveOutline },
  { id: 'support', label: 'Support', to: '/patient/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/patient/profile', Icon: IoPersonCircleOutline },
]

// Nav items for mobile bottom nav (without Support)
const navItems = allNavItems.filter((item) => item.id !== 'support')

const PatientNavbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleButtonRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  
  // Hide top header only on dashboard page
  const isDashboardPage = location.pathname === '/patient/dashboard' || location.pathname === '/patient/'
  // Hide navbar completely on login page
  const isLoginPage = location.pathname === '/patient/login'

  const mobileLinkBase =
    'flex flex-1 items-center justify-center rounded-full px-1 py-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2'
  const mobileLinkFocusStyle = { '--tw-ring-color': 'rgba(17, 73, 108, 0.7)' }

  const mobileIconWrapper =
    'flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-200'

  const desktopLinkBase =
    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
  const desktopLinkFocusStyle = { '--tw-ring-color': 'rgba(17, 73, 108, 0.7)' }

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
    <>
      {/* Top Header - Hidden on dashboard and login pages */}
      {!isDashboardPage && !isLoginPage && (
        <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/95 px-4 py-3 backdrop-blur shadow md:px-6">
          <div className="flex items-center">
            <img
              src={healinnLogo}
              alt="Healiinn"
              className="h-8 w-auto object-contain"
              loading="lazy"
            />
          </div>
          <nav className="hidden items-center gap-2 rounded-full bg-white/90 px-2 py-1 shadow-lg ring-1 ring-slate-200 md:flex" style={{ boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.1), 0 4px 6px -2px rgba(17, 73, 108, 0.05)' }}>
            {allNavItems.map(({ id, label, to, Icon }) => (
              <NavLink
                key={id}
                to={to}
                className={({ isActive }) =>
                  `${desktopLinkBase} ${
                    isActive ? 'text-white shadow-sm' : 'hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
                style={({ isActive }) => isActive ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : {}}
                end={id === 'home'}
              >
                {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                <span>{label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-red-500 transition-all duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Logout
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <NotificationBell />
            </div>
            <button
              type="button"
              ref={toggleButtonRef}
              className="md:hidden"
              aria-label="Toggle navigation menu"
              onClick={handleSidebarToggle}
            >
              <IoMenuOutline className="text-2xl text-slate-600" aria-hidden="true" />
            </button>
          </div>
        </header>
      )}

      <PatientSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={allNavItems}
        onLogout={handleLogout}
      />

      {!isLoginPage && (
        <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around gap-1 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
        {navItems.map(({ id, label, to, Icon }) => (
          <NavLink
            key={id}
            to={to}
            className={({ isActive }) =>
              `${mobileLinkBase} ${
                isActive ? '' : 'text-slate-400 hover:text-slate-600'
              }`
            }
            style={({ isActive }) => isActive ? { color: '#11496c' } : {}}
            end={id === 'home'}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`${mobileIconWrapper} ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                  style={isActive ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2), 0 2px 4px -1px rgba(17, 73, 108, 0.1)' } : {}}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="sr-only">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        </nav>
      )}
    </>
  )
}

export default PatientNavbar

