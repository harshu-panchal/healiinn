import { useState, useEffect } from 'react'
import {
  IoArrowDownOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
} from 'react-icons/io5'
import { getPharmacyWalletEarnings } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

// Default earning data (will be replaced by API data)
const defaultEarningData = {
  totalEarnings: 0,
  thisMonthEarnings: 0,
  lastMonthEarnings: 0,
  thisYearEarnings: 0,
  todayEarnings: 0,
  earnings: [],
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

const WalletEarning = () => {
  const toast = useToast()
  const [filterType, setFilterType] = useState('all') // all, today, year, month
  const [earningData, setEarningData] = useState(defaultEarningData)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Fetch earnings from API
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true)
        const response = await getPharmacyWalletEarnings()
        
        console.log('Pharmacy Wallet Earnings Response:', response)
        
        if (response?.success && response.data) {
          const data = response.data
          console.log('Pharmacy Wallet Earnings Data:', data)
          const items = Array.isArray(data.items ?? data.earnings) ? (data.items ?? data.earnings) : []
          console.log('Pharmacy Wallet Earnings Items:', items)
          setEarningData({
            totalEarnings: Number(data.totalEarnings ?? 0),
            thisMonthEarnings: Number(data.thisMonthEarnings ?? 0),
            lastMonthEarnings: Number(data.lastMonthEarnings ?? 0),
            thisYearEarnings: Number(data.thisYearEarnings ?? 0),
            todayEarnings: Number(data.todayEarnings ?? 0),
            earnings: items.map((earn) => {
              // Extract patient name from populated orderId or requestId
              let patientName = ''
              if (earn.orderId && earn.orderId.patientId) {
                const patient = earn.orderId.patientId
                if (typeof patient === 'object') {
                  patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || ''
                }
              } else if (earn.requestId && earn.requestId.patientId) {
                const patient = earn.requestId.patientId
                if (typeof patient === 'object') {
                  patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || ''
                }
              }
              
              // Extract commission from description or metadata
              let commissionInfo = ''
              if (earn.metadata?.commissionRate) {
                commissionInfo = `Commission: ${(earn.metadata.commissionRate * 100).toFixed(1)}%`
              } else if (earn.description && earn.description.includes('Commission:')) {
                const commissionMatch = earn.description.match(/\(Commission:\s*([^)]+)\)/)
                if (commissionMatch) {
                  commissionInfo = commissionMatch[0].replace(/[()]/g, '')
                }
              }
              
              // Clean description
              let description = earn.description || earn.notes || ''
              if (description) {
                description = description.replace(/\s*-\s*Request\s+[a-f0-9]+/gi, '')
                description = description.replace(/\s*\(Commission:[^)]+\)/gi, '').trim()
              }
              
              // Build clean description if empty
              if (!description || description === 'Earning' || description === 'Transaction') {
                description = patientName 
                  ? `Payment received for medicines from patient ${patientName}`
                  : 'Payment received for medicines'
              }
              
              return {
                id: earn._id || earn.id,
                amount: Number(earn.amount ?? 0),
                description,
                commission: commissionInfo,
                date: earn.createdAt || earn.date || new Date().toISOString(),
                status: earn.status || 'completed',
                category: earn.category || 'Order Payment',
                patientName,
              }
            }),
          })
          console.log('Pharmacy Wallet Earnings State Set:', {
            totalEarnings: Number(data.totalEarnings ?? 0),
            thisMonthEarnings: Number(data.thisMonthEarnings ?? 0),
            lastMonthEarnings: Number(data.lastMonthEarnings ?? 0),
            thisYearEarnings: Number(data.thisYearEarnings ?? 0),
            todayEarnings: Number(data.todayEarnings ?? 0),
            earningsCount: items.length,
          })
        } else {
          console.error('Pharmacy Wallet Earnings Error:', response)
          toast.error('Failed to load earnings')
          setEarningData(defaultEarningData)
          setTotalPages(1)
          setTotalItems(0)
        }
      } catch (err) {
        console.error('Error fetching earnings:', err)
        toast.error('Failed to load earnings')
        setEarningData(defaultEarningData)
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [toast, currentPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const earningsChange = earningData.lastMonthEarnings > 0
    ? ((earningData.thisMonthEarnings - earningData.lastMonthEarnings) / earningData.lastMonthEarnings) * 100
    : 0

  const filteredEarnings = earningData.earnings.filter((earning) => {
    if (filterType === 'all') return true
    // In a real app, you would filter by date range
    return true
  })

  return (
    <section className="flex flex-col gap-6 pb-4">
      {/* Main Earnings Card - Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100/60 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 p-6 sm:p-8 text-white shadow-2xl shadow-emerald-500/30">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80 mb-1">Total Earnings</p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight">{formatCurrency(earningData.totalEarnings)}</p>
            </div>
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <IoArrowDownOutline className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today Earnings */}
        <div className="group relative overflow-hidden rounded-2xl border border-[rgba(17,73,108,0.2)] bg-gradient-to-br from-[rgba(17,73,108,0.05)] via-white to-[rgba(17,73,108,0.05)] p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-[rgba(17,73,108,0.1)] blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                <IoCalendarOutline className="h-5 w-5 text-[#11496c]" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#11496c]">Today</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(earningData.todayEarnings)}</p>
          </div>
        </div>

        {/* Month Earnings */}
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <IoTrendingUpOutline className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">This Month</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(earningData.thisMonthEarnings)}</p>
            <div className="mt-4 flex items-center gap-2 text-xs">
              {earningsChange >= 0 ? (
                <>
                  <IoTrendingUpOutline className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">+{earningsChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <IoTrendingDownOutline className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-red-600 font-semibold">{earningsChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-slate-500">vs last month</span>
            </div>
          </div>
        </div>

        {/* Year Earnings */}
        <div className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-purple-50/30 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-purple-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <IoCalendarOutline className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">This Year</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(earningData.thisYearEarnings)}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'all'
              ? 'text-white shadow-sm'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
          style={filterType === 'all' ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : {}}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterType('today')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'today'
              ? 'text-white shadow-sm'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
          style={filterType === 'today' ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : {}}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setFilterType('year')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'year'
              ? 'text-white shadow-sm'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
          style={filterType === 'year' ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : {}}
        >
          Year
        </button>
        <button
          type="button"
          onClick={() => setFilterType('month')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'month'
              ? 'text-white shadow-sm'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
          style={filterType === 'month' ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : {}}
        >
          Month
        </button>
      </div>

      {/* Earnings List - Scrollable Container */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Earning History</h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {totalItems} {totalItems === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>
        <div className="max-h-[60vh] md:max-h-[65vh] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-500">Loading earnings...</p>
            </div>
          ) : filteredEarnings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoArrowDownOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No earnings found</p>
              <p className="mt-1 text-sm text-slate-500">Your earnings will appear here</p>
            </div>
          ) : (
            filteredEarnings.map((earning) => (
              <article
                key={earning.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
                    <IoArrowDownOutline className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Patient Name */}
                        {earning.patientName && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-sm font-semibold text-slate-900">{earning.patientName}</p>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 capitalize">Patient</span>
                          </div>
                        )}
                        {/* Description */}
                        <p className={`text-sm ${earning.patientName ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                          {earning.description}
                        </p>
                        {/* Commission */}
                        {earning.commission && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 font-medium border border-blue-200">
                              {earning.commission}
                            </span>
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium border border-slate-200">
                            {earning.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            {formatDateTime(earning.date)}
                          </span>
                        </div>
                        <div className="mt-2.5">
                          {earning.status === 'pending' && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                              <IoTimeOutline className="h-3.5 w-3.5" />
                              Processing
                            </div>
                          )}
                          {earning.status === 'completed' && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                              <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                              Completed
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <p className="text-xl font-bold text-emerald-600">
                          +{formatCurrency(earning.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredEarnings.length > 0 && totalPages > 1 && (
          <div className="pt-4 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </div>
        )}
      </section>
    </section>
  )
}

export default WalletEarning

