import { useState, useEffect } from 'react'
import {
  IoArrowDownOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
} from 'react-icons/io5'
import { getLaboratoryWalletEarnings } from '../laboratory-services/laboratoryService'
import { useToast } from '../../../contexts/ToastContext'

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
    style: 'currency',
    currency: 'INR',
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

  // Fetch earnings from API
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true)
        const response = await getLaboratoryWalletEarnings()
        
        if (response?.success && response.data) {
          const data = response.data
          const items = Array.isArray(data.items ?? data.earnings) ? (data.items ?? data.earnings) : []
          setEarningData({
            totalEarnings: Number(data.totalEarnings ?? 0),
            thisMonthEarnings: Number(data.thisMonthEarnings ?? 0),
            lastMonthEarnings: Number(data.lastMonthEarnings ?? 0),
            thisYearEarnings: Number(data.thisYearEarnings ?? 0),
            todayEarnings: Number(data.todayEarnings ?? 0),
            earnings: items.map((earn) => ({
                  id: earn._id || earn.id,
              amount: Number(earn.amount ?? 0),
                  description: earn.description || earn.notes || 'Earning',
                  date: earn.createdAt || earn.date || new Date().toISOString(),
                  status: earn.status || 'completed',
                  category: earn.category || 'Test Order Payment',
            })),
          })
        } else {
          toast.error('Failed to load earnings')
        }
      } catch (err) {
        console.error('Error fetching earnings:', err)
        toast.error('Failed to load earnings')
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [toast])

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
      {/* Main Earnings Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100/60 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 p-6 sm:p-8 text-white shadow-xl shadow-emerald-500/30">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        
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

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Today</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(earningData.todayEarnings)}</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Month</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(earningData.thisMonthEarnings)}</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {earningsChange >= 0 ? (
              <>
                <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">+{earningsChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                <span className="text-red-600 font-semibold">{earningsChange.toFixed(1)}%</span>
              </>
            )}
            <span className="text-slate-500">vs last month</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(17,73,108,0.2)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#11496c]">Year</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(earningData.thisYearEarnings)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 pb-2">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
            filterType === 'all'
              ? 'bg-[#11496c] text-white shadow-sm'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterType('today')}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
            filterType === 'today'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-400/40'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setFilterType('month')}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
            filterType === 'month'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-400/40'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => setFilterType('year')}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
            filterType === 'year'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-400/40'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Year
        </button>
      </div>

      {/* Earnings List */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Earning History</h2>
        <div className="space-y-3">
          {filteredEarnings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoArrowDownOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No earnings found</p>
              <p className="mt-1 text-sm text-slate-500">Your earnings will appear here</p>
            </div>
          ) : (
            filteredEarnings.map((earning) => (
              <article
                key={earning.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <IoArrowDownOutline className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {earning.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                            {earning.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            {formatDateTime(earning.date)}
                          </span>
                        </div>
                        {earning.status === 'pending' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            <IoTimeOutline className="h-3.5 w-3.5" />
                            Processing
                          </div>
                        )}
                        {earning.status === 'completed' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                            Completed
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <p className="text-lg font-bold text-emerald-600">
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
      </section>
    </section>
  )
}

export default WalletEarning

