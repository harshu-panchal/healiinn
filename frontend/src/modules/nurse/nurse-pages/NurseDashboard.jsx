import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import NurseNavbar from '../nurse-components/NurseNavbar'
import NurseHeader from '../nurse-components/NurseHeader'
import NurseFooter from '../nurse-components/NurseFooter'
import NurseSidebar from '../nurse-components/NurseSidebar'
import { useToast } from '../../../contexts/ToastContext'
import NotificationBell from '../../../components/NotificationBell'
import {
  IoHomeOutline,
  IoCalendarOutline,
  IoReceiptOutline,
  IoWalletOutline,
  IoPersonCircleOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoMenuOutline,
  IoSearchOutline,
  IoHelpCircleOutline,
} from 'react-icons/io5'

// Default stats (will be replaced by API data)
const defaultStats = {
  totalBookings: 0,
  todayBookings: 0,
  totalEarnings: 0,
  thisMonthEarnings: 0,
  lastMonthEarnings: 0,
  totalTransactions: 0,
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const allNavItems = [
  { id: 'home', label: 'Dashboard', to: '/nurse/dashboard', Icon: IoHomeOutline },
  { id: 'bookings', label: 'Booking', to: '/nurse/booking', Icon: IoCalendarOutline },
  { id: 'transactions', label: 'Transactions', to: '/nurse/transactions', Icon: IoReceiptOutline },
  { id: 'wallet', label: 'Wallet', to: '/nurse/wallet', Icon: IoWalletOutline },
  { id: 'support', label: 'Support', to: '/nurse/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/nurse/profile', Icon: IoPersonCircleOutline },
]

const NurseDashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [stats, setStats] = useState(defaultStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleButtonRef = useRef(null)

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  // Sidebar toggle functions
  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    setIsSidebarOpen(false)
  }

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      // TODO: Import nurse logout service when available
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      toast.success('Logged out successfully')
    }
    setTimeout(() => {
      window.location.href = '/nurse/login'
    }, 500)
  }

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // TODO: Import nurse profile service when available
        // const response = await getNurseProfile()
        // if (response.success && response.data) {
        //   const nurse = response.data.nurse || response.data
        //   setProfile({
        //     firstName: nurse.firstName || '',
        //     lastName: nurse.lastName || '',
        //     isActive: nurse.isActive !== undefined ? nurse.isActive : true,
        //   })
        // }
        setProfile({
          firstName: 'Nurse',
          lastName: 'User',
          isActive: true,
        })
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    }
    fetchProfile()
  }, [])

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        // TODO: Import nurse dashboard service when available
        // const response = await getNurseDashboard()
        // if (response && response.success && response.data) {
        //   const data = response.data
          //   const statsUpdate = {
          //     totalBookings: Number(data.totalBookings || 0),
          //     todayBookings: Number(data.todayBookings || 0),
          //     totalEarnings: Number(data.totalEarnings || 0),
          //     thisMonthEarnings: Number(data.thisMonthEarnings || 0),
          //     lastMonthEarnings: Number(data.lastMonthEarnings || 0),
          //     totalTransactions: Number(data.totalTransactions || 0),
          //   }
        //   setStats(statsUpdate)
        // }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  const earningsChange = stats.lastMonthEarnings > 0 
    ? ((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings) * 100 
    : 0

  return (
    <>
      <NurseNavbar />
      <NurseHeader />
      <NurseSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={allNavItems}
        onLogout={handleLogout}
      />
      <section className="flex flex-col gap-4 pb-24 -mt-20 lg:mt-0 lg:pb-8">
        {/* Top Header with Gradient Background - Hidden on Desktop */}
        <header 
          className="lg:hidden relative text-white -mx-4 mb-4 overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #11496c 0%, #1a5f7a 50%, #2a8ba8 100%)'
          }}
        >
          <div className="px-4 pt-5 pb-4">
            {/* Top Section - Nurse Info */}
            <div className="flex items-start justify-between mb-3.5">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-0.5">
                  {profile?.firstName || profile?.lastName
                    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
                    : 'Nurse'}
                </h1>
                <p className="text-sm font-normal text-white/95 leading-tight">
                  <span className="text-white font-medium">{profile?.isActive ? 'Online' : 'Offline'}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                  <NotificationBell className="text-white" />
                </div>
                <button
                  type="button"
                  ref={toggleButtonRef}
                  onClick={handleSidebarToggle}
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                  aria-label="Menu"
                >
                  <IoMenuOutline className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar - Desktop Only */}
        <div className="hidden lg:block mb-6">
          <div className="relative w-full group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 group-hover:scale-110 group-focus-within:scale-110">
              <IoSearchOutline className="h-5 w-5 text-slate-400 group-focus-within:text-[#11496c] transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder="Search bookings, transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-20 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c] transition-all duration-300 shadow-sm hover:shadow-md hover:border-[#11496c]/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
              <kbd className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-300 rounded">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-2 lg:gap-4">
          {/* Total Bookings */}
          <article
            onClick={() => navigate('/nurse/booking')}
            className="group relative overflow-hidden rounded-xl lg:rounded-2xl border border-[rgba(17,73,108,0.2)] bg-white p-3 lg:p-6 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#11496c]/40 active:scale-[0.98] lg:hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
            
            <div className="relative flex items-start justify-between mb-2 lg:mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] lg:text-xs font-semibold uppercase tracking-wide text-[#11496c] leading-tight mb-1 lg:mb-2 group-hover:text-[#0d3a52] transition-colors">Total Bookings</p>
                <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-none group-hover:text-[#11496c] transition-colors duration-300">{loading ? '...' : stats.totalBookings}</p>
              </div>
              <div className="flex h-8 w-8 lg:h-14 lg:w-14 items-center justify-center rounded-lg lg:rounded-xl bg-[#11496c] text-white group-hover:bg-[#0d3a52] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <IoCalendarOutline className="text-base lg:text-2xl" aria-hidden="true" />
              </div>
            </div>
            <p className="relative text-[10px] lg:text-xs text-slate-600 leading-tight group-hover:text-slate-700 transition-colors">All time</p>
          </article>

          {/* Total Earnings */}
          <article
            onClick={() => navigate('/nurse/wallet')}
            className="group relative overflow-hidden rounded-xl lg:rounded-2xl border border-amber-100 bg-white p-3 lg:p-6 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-amber-300 active:scale-[0.98] lg:hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-amber-500/10 transition-all duration-300"></div>
            
            <div className="relative flex items-start justify-between mb-2 lg:mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] lg:text-xs font-semibold uppercase tracking-wide text-amber-700 leading-tight mb-1 lg:mb-2 group-hover:text-amber-800 transition-colors">Total Earnings</p>
                <p className="text-lg lg:text-3xl font-bold text-slate-900 leading-none group-hover:text-amber-700 transition-colors duration-300">{loading ? '...' : formatCurrency(stats.totalEarnings)}</p>
                <div className="flex items-center gap-1 mt-1 lg:mt-2 text-[10px] lg:text-xs group-hover:scale-105 transition-transform">
                  {earningsChange >= 0 ? (
                    <>
                      <IoTrendingUpOutline className="h-3 w-3 lg:h-4 lg:w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <span className="text-emerald-600 font-semibold">+{earningsChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <IoTrendingDownOutline className="h-3 w-3 lg:h-4 lg:w-4 text-red-600 group-hover:scale-110 transition-transform" />
                      <span className="text-red-600 font-semibold">{earningsChange.toFixed(1)}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex h-8 w-8 lg:h-14 lg:w-14 items-center justify-center rounded-lg lg:rounded-xl bg-amber-500 text-white group-hover:bg-amber-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <IoWalletOutline className="text-base lg:text-2xl" aria-hidden="true" />
              </div>
            </div>
            <p className="relative text-[10px] lg:text-xs text-slate-600 leading-tight group-hover:text-slate-700 transition-colors">vs last month</p>
          </article>
        </div>
      </section>
      <NurseFooter />
    </>
  )
}

export default NurseDashboard

