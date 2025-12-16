import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoBagHandleOutline,
  IoCalendarOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
  IoWalletOutline,
  IoMedicalOutline,
  IoListOutline,
  IoPersonOutline,
} from 'react-icons/io5'
import { usePharmacySidebar } from '../pharmacy-components/PharmacySidebarContext'
import { getPharmacyDashboard, getPharmacyOrders, getPharmacyRequestOrders, getPharmacyMedicines, getPharmacyPatients, getPharmacyProfile, getPharmacyWalletBalance } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'
import NotificationBell from '../../../components/NotificationBell'

// Default stats (will be replaced by API data)
const defaultStats = {
  totalOrders: 0,
  activePatients: 0,
  inactivePatients: 0,
  pendingPrescriptions: 0,
  walletBalance: 0,
}

// Mock data removed - using API data now

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

const getStatusColor = (status) => {
  switch (status) {
    case 'ready':
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'ready':
    case 'delivered':
      return IoCheckmarkCircleOutline
    case 'cancelled':
      return IoCloseCircleOutline
    default:
      return IoTimeOutline
  }
}

const PharmacyDashboard = () => {
  const navigate = useNavigate()
  const { toggleSidebar } = usePharmacySidebar()
  const toast = useToast()
  const [availableMedicinesCount, setAvailableMedicinesCount] = useState(0)
  const [todayOrders, setTodayOrders] = useState([])
  const [recentPatients, setRecentPatients] = useState([])
  const [requestOrdersCount, setRequestOrdersCount] = useState(0)
  const [stats, setStats] = useState(defaultStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getPharmacyProfile()
        if (response.success && response.data) {
          const pharmacy = response.data.pharmacy || response.data
          setProfile({
            name: pharmacy.pharmacyName || pharmacy.name || '',
            address: pharmacy.address || {},
            isActive: pharmacy.isActive !== undefined ? pharmacy.isActive : true,
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        // Don't show error toast as it's not critical
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
        const [dashboardResponse, walletResponse] = await Promise.all([
          getPharmacyDashboard(),
          getPharmacyWalletBalance().catch(() => ({ success: false, data: null })) // Don't fail if wallet fails
        ])
        
        if (dashboardResponse.success && dashboardResponse.data) {
          const data = dashboardResponse.data
          const walletBalance = walletResponse.success && walletResponse.data 
            ? (walletResponse.data.availableBalance || walletResponse.data.balance || 0)
            : 0
          
          setStats({
            totalOrders: data.totalOrders || 0,
            activePatients: data.activePatients || 0,
            inactivePatients: data.inactivePatients || 0,
            pendingPrescriptions: data.pendingPrescriptions || 0,
            walletBalance: walletBalance,
          })
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  // Fetch today's orders, medicines count, and request orders count
  useEffect(() => {
    const fetchDashboardDetails = async () => {
      try {
        // Fetch today's orders - filter by today's date
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)
        
        const ordersResponse = await getPharmacyOrders({ limit: 100 })
        if (ordersResponse.success && ordersResponse.data) {
          const ordersData = Array.isArray(ordersResponse.data) 
            ? ordersResponse.data 
            : ordersResponse.data.orders || ordersResponse.data.items || []
          
          // Filter orders created today
          const todayOrdersFiltered = ordersData.filter(order => {
            if (!order.createdAt) return false
            const orderDate = new Date(order.createdAt)
            return orderDate >= today && orderDate <= todayEnd
          })
          
          const transformed = todayOrdersFiltered.map(order => ({
            id: order._id || order.id,
            patientName: order.patientId?.firstName && order.patientId?.lastName
              ? `${order.patientId.firstName} ${order.patientId.lastName}`
              : order.patientId?.name || order.patientName || 'Unknown Patient',
            patientImage: order.patientId?.profileImage || order.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.patientId?.firstName || order.patientName || 'Patient')}&background=3b82f6&color=fff&size=128`,
            time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
            date: order.createdAt ? new Date(order.createdAt) : new Date(),
            status: order.status || 'pending',
            totalAmount: Number(order.totalAmount ?? order.amount ?? 0),
            deliveryType: order.deliveryType || order.deliveryOption || 'home',
            prescriptionId: order.prescriptionId?._id || order.prescriptionId || '',
          }))
          setTodayOrders(transformed)
        }

        // Fetch recent patients (last 5 patients)
        const patientsResponse = await getPharmacyPatients({ limit: 5 })
        console.log('Pharmacy Patients Response:', patientsResponse)
        if (patientsResponse?.success && patientsResponse.data) {
          const patientsData = Array.isArray(patientsResponse.data.items) 
            ? patientsResponse.data.items 
            : Array.isArray(patientsResponse.data.patients)
            ? patientsResponse.data.patients
            : Array.isArray(patientsResponse.data)
            ? patientsResponse.data
            : []
          
          console.log('Pharmacy Patients Data:', patientsData)
          
          const transformed = patientsData.map(patient => ({
            id: patient._id || patient.id,
            name: patient.firstName && patient.lastName
              ? `${patient.firstName} ${patient.lastName}`
              : patient.name || 'Unknown Patient',
            image: patient.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.firstName || patient.name || 'Patient')}&background=3b82f6&color=fff&size=128`,
            totalOrders: Number(patient.totalOrders ?? 0),
            lastOrderDate: patient.lastOrderDate || patient.lastOrder || null,
            status: patient.status || 'active',
          }))
          
          console.log('Pharmacy Transformed Patients:', transformed)
          setRecentPatients(transformed)
        }

        // Fetch medicines count
        const medicinesResponse = await getPharmacyMedicines({ limit: 1 })
        if (medicinesResponse.success && medicinesResponse.data) {
          // Backend returns total in data.pagination.total
          const totalCount = medicinesResponse.data.pagination?.total || 
                            medicinesResponse.data.total || 
                            (medicinesResponse.data.items?.length || 0)
          setAvailableMedicinesCount(totalCount)
        }

        // Fetch request orders count (all visible requests, not just pending)
        const requestsResponse = await getPharmacyRequestOrders({ limit: 1 })
        if (requestsResponse.success && requestsResponse.data) {
          const totalCount = requestsResponse.data.pagination?.total || 
                            requestsResponse.data.total || 
                            (requestsResponse.data.items?.length || 0)
          console.log('Pharmacy Request Orders Count:', { totalCount, data: requestsResponse.data })
          setRequestOrdersCount(totalCount)
        }
      } catch (err) {
        console.error('Error fetching dashboard details:', err)
        // Don't show error toast as these are not critical
      }
    }

    fetchDashboardDetails()
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardDetails, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="flex flex-col gap-4 pb-24 -mt-20">
      {/* Top Header with Gradient Background */}
      <header 
        className="relative text-white -mx-4 mb-4 overflow-hidden"
        style={{
          background: 'linear-gradient(to right, #11496c 0%, #1a5f7a 50%, #2a8ba8 100%)'
        }}
      >
        <div className="px-4 pt-5 pb-4">
          {/* Top Section - Pharmacy Info */}
          <div className="flex items-start justify-between mb-3.5">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-0.5">
                {profile?.name || 'Pharmacy'}
              </h1>
              <p className="text-sm font-normal text-white/95 leading-tight">
                {profile?.address?.city || profile?.address?.line1 || 'Address'} • <span className="text-white font-medium">{profile?.isActive ? 'Online' : 'Offline'}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Notification Icon */}
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <NotificationBell className="text-white" />
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                aria-label="Menu"
              >
                <IoMenuOutline className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
            </div>
          </header>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {/* Total Orders */}
        <article
          onClick={() => navigate('/pharmacy/orders')}
          className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700 leading-tight mb-1">Total Orders</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{loading ? '...' : stats.totalOrders}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <IoBagHandleOutline className="text-base" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">This month</p>
        </article>

        {/* Wallet Card */}
        <article
          onClick={() => navigate('/pharmacy/prescriptions')}
          className="relative overflow-hidden rounded-xl border border-[#11496c]/20 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#11496c] leading-tight mb-1">Wallet</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{loading ? '...' : formatCurrency(stats.walletBalance || 0)}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11496c] text-white">
              <IoWalletOutline className="text-base" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">Active</p>
        </article>

        {/* Available Medicines */}
        <article
          onClick={() => navigate('/pharmacy/medicines')}
          className="relative overflow-hidden rounded-xl border border-purple-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-purple-700 leading-tight mb-1">Available Medicines</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{availableMedicinesCount}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-white">
              <IoMedicalOutline className="text-base" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">In stock</p>
        </article>

        {/* Request Orders */}
        <article
          onClick={() => navigate('/pharmacy/request-orders')}
          className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-blue-700 leading-tight mb-1">Request</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{requestOrdersCount}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <IoListOutline className="text-base" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">Patient requests</p>
        </article>
      </div>

      {/* Today's Orders */}
      <section aria-labelledby="orders-title" className="space-y-3">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 id="orders-title" className="text-base font-semibold text-slate-900">
              Today's Orders
            </h2>
            <span className="flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)] px-2 text-xs font-medium text-[#11496c]">
              {todayOrders.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/pharmacy/orders')}
            className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
          >
            See all
          </button>
        </header>

        <div className="space-y-3">
          {todayOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoBagHandleOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No orders today</p>
              <p className="mt-1 text-sm text-slate-500">Today's orders will appear here</p>
            </div>
          ) : (
            todayOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status)
            return (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={order.patientImage}
                      alt={order.patientName}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.patientName)}&background=3b82f6&color=fff&size=128&bold=true`
                      }}
                    />
                    {order.status === 'ready' && (
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                        <IoCheckmarkCircleOutline className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">{order.patientName}</h3>
                        <p className="mt-0.5 text-xs text-slate-600">Prescription: {order.prescriptionId}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                          <StatusIcon className="h-3 w-3" />
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <IoTimeOutline className="h-3.5 w-3.5" />
                        <span className="font-medium">{order.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IoLocationOutline className="h-3.5 w-3.5" />
                        <span>{order.deliveryType === 'home' ? 'Home Delivery' : 'Pickup'}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-emerald-600">
                        <IoWalletOutline className="h-3.5 w-3.5" />
                        <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
            })
          )}
          </div>
        </section>

        {/* Recent Patients */}
      <div className="grid grid-cols-1 gap-6">
        <section aria-labelledby="patients-title" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 id="patients-title" className="text-base font-semibold text-slate-900">
              Patients
            </h2>
          </header>

          <div className="space-y-3">
            {recentPatients.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <IoPersonOutline className="mx-auto h-16 w-16 text-slate-300" />
                <p className="mt-4 text-base font-semibold text-slate-600">No patients found</p>
                <p className="mt-1 text-sm text-slate-500">Patient data will appear here</p>
              </div>
            ) : (
              recentPatients.map((patient) => (
        <article
                key={patient.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                  <img
                    src={patient.image}
                    alt={patient.name}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=3b82f6&color=fff&size=128&bold=true`
                    }}
                  />
                    {patient.status === 'active' && (
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                        <IoCheckmarkCircleOutline className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">{patient.name}</h3>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {patient.lastOrderDate ? `Last order: ${formatDate(patient.lastOrderDate)}` : 'No orders yet'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${
                        patient.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {patient.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <IoBagHandleOutline className="h-3.5 w-3.5" />
                        <span className="font-medium">{patient.totalOrders} {patient.totalOrders === 1 ? 'order' : 'orders'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
              ))
            )}
          </div>
        </section>
      </div>

    </section>
  )
}

export default PharmacyDashboard
















