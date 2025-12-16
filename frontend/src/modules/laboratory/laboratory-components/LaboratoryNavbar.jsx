import { useRef, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  IoHomeOutline,
  IoBagHandleOutline,
  IoWalletOutline,
  IoPersonCircleOutline,
  IoMenuOutline,
  IoPeopleOutline,
  IoHelpCircleOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'
import LaboratorySidebar from './LaboratorySidebar'
import NotificationBell from '../../../components/NotificationBell'

// Sidebar nav and desktop navbar (includes Support above Profile)
const sidebarNavItems = [
  { id: 'home', label: 'Home', to: '/laboratory/dashboard', Icon: IoHomeOutline },
  { id: 'orders', label: 'Orders', to: '/laboratory/orders', Icon: IoBagHandleOutline },
  { id: 'reports', label: 'Patients', to: '/laboratory/patients', Icon: IoPeopleOutline },
  { id: 'wallet', label: 'Wallet', to: '/laboratory/wallet', Icon: IoWalletOutline },
  { id: 'support', label: 'Support', to: '/laboratory/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/laboratory/profile', Icon: IoPersonCircleOutline },
]

// Bottom nav items (without Support)
const navItems = sidebarNavItems.filter((item) => item.id !== 'support')

const LaboratoryNavbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleButtonRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  
  // Hide top header only on dashboard page
  const isDashboardPage = location.pathname === '/laboratory/dashboard' || location.pathname === '/laboratory/'

  const mobileLinkBase =
    'flex flex-1 items-center justify-center rounded-full px-1 py-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[rgba(17,73,108,0.7)] focus-visible:ring-offset-2'

  const mobileIconWrapper =
    'flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-200'

  const desktopLinkBase =
    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(17,73,108,0.7)] focus-visible:ring-offset-2'

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

  const handleLogout = () => {
    handleSidebarClose()
    localStorage.removeItem('laboratoryAuthToken')
    sessionStorage.removeItem('laboratoryAuthToken')
    navigate('/doctor/login', { replace: true })
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

      <LaboratorySidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
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

export default LaboratoryNavbar

