import { NavLink, useNavigate } from 'react-router-dom'
import {
  IoHomeOutline,
  IoPersonCircleOutline,
  IoNotificationsOutline,
  IoWalletOutline,
  IoCalendarOutline,
  IoReceiptOutline,
  IoLogOutOutline,
  IoHelpCircleOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'
import { useToast } from '../../../contexts/ToastContext'
import NotificationBell from '../../../components/NotificationBell'

const navItems = [
  { id: 'home', label: 'Dashboard', to: '/nurse/dashboard', Icon: IoHomeOutline },
  { id: 'bookings', label: 'Booking', to: '/nurse/booking', Icon: IoCalendarOutline },
  { id: 'transactions', label: 'Transactions', to: '/nurse/transactions', Icon: IoReceiptOutline },
  { id: 'wallet', label: 'Wallet', to: '/nurse/wallet', Icon: IoWalletOutline },
  { id: 'support', label: 'Support', to: '/nurse/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/nurse/profile', Icon: IoPersonCircleOutline },
]

const NurseHeader = () => {
  const navigate = useNavigate()
  const toast = useToast()

  const handleLogout = async () => {
    try {
      // TODO: Import nurse logout service when available
      // const { logoutNurse } = await import('../nurse-services/nurseService')
      // await logoutNurse()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      // Clear tokens manually if API call fails
      // const { clearNurseTokens } = await import('../nurse-services/nurseService')
      // clearNurseTokens()
      toast.success('Logged out successfully')
    }
    // Force navigation to login page
    setTimeout(() => {
      window.location.href = '/nurse/login'
    }, 500)
  }

  return (
    <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/nurse/dashboard" className="flex items-center">
              <img
                src={healinnLogo}
                alt="Healiinn"
                className="h-10 w-auto object-contain"
                loading="lazy"
              />
            </NavLink>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ id, label, to, Icon }) => (
              <NavLink
                key={id}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#11496c] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
                end={id === 'home'}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center gap-4">
            <NotificationBell />

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <IoLogOutOutline className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default NurseHeader

