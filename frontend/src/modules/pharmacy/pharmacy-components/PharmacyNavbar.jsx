import { useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  IoHomeOutline,
  IoBagHandleOutline,
  IoWalletOutline,
  IoPersonCircleOutline,
  IoMenuOutline,
  IoDocumentTextOutline,
  IoHelpCircleOutline,
  IoMedicalOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'
import PharmacySidebar from './PharmacySidebar'
import { usePharmacySidebar } from './PharmacySidebarContext'
import { useToast } from '../../../contexts/ToastContext'
import NotificationBell from '../../../components/NotificationBell'

// Sidebar nav and desktop navbar (includes Support above Profile)
const sidebarNavItems = [
  { id: 'home', label: 'Home', to: '/pharmacy/dashboard', Icon: IoHomeOutline },
  { id: 'orders', label: 'Orders', to: '/pharmacy/orders', Icon: IoBagHandleOutline },
  { id: 'medicines', label: 'Medicines', to: '/pharmacy/medicines', Icon: IoMedicalOutline },
  { id: 'wallet', label: 'Wallet', to: '/pharmacy/prescriptions', Icon: IoWalletOutline },
  { id: 'support', label: 'Support', to: '/pharmacy/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/pharmacy/profile', Icon: IoPersonCircleOutline },
]

// Bottom nav items (without Support only, Wallet included)
const navItems = sidebarNavItems.filter((item) => item.id !== 'support')

const PharmacyNavbar = () => {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = usePharmacySidebar()
  const toggleButtonRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  
  // Hide top header only on dashboard page
  const isDashboardPage = location.pathname === '/pharmacy/dashboard' || location.pathname === '/pharmacy/'

  const mobileLinkBase =
    'flex flex-1 items-center justify-center rounded-full px-1 py-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[rgba(17,73,108,0.7)] focus-visible:ring-offset-2'

  const mobileIconWrapper =
    'flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-200'

  const desktopLinkBase =
    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(17,73,108,0.7)] focus-visible:ring-offset-2'

  const handleSidebarToggle = () => {
    toggleSidebar()
  }

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    closeSidebar()
  }

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      const { logoutPharmacy } = await import('../pharmacy-services/pharmacyService')
      await logoutPharmacy()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      // Clear tokens manually if API call fails
      const { clearPharmacyTokens } = await import('../pharmacy-services/pharmacyService')
      clearPharmacyTokens()
      toast.success('Logged out successfully')
    }
    // Force navigation to login page
    setTimeout(() => {
      window.location.href = '/pharmacy/login'
    }, 500)
  }

  return (
    <>
      {/* Top Header - Hidden on dashboard page */}
      {!isDashboardPage && (
        <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/95 px-4 py-3 backdrop-blur shadow md:px-6">
          <div className="flex items-center">
            <img
              src={healinnLogo}
              alt="Healiinn"
              className="h-8 w-auto object-contain"
              loading="lazy"
            />
          </div>
          <nav className="hidden items-center gap-2 rounded-full bg-white/90 px-2 py-1 shadow-lg shadow-[rgba(17,73,108,0.1)] ring-1 ring-slate-200 md:flex">
            {sidebarNavItems.map(({ id, label, to, Icon }) => (
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

      <PharmacySidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        navItems={sidebarNavItems}
        onLogout={handleLogout}
      />

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
                  style={isActive ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="sr-only">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default PharmacyNavbar

