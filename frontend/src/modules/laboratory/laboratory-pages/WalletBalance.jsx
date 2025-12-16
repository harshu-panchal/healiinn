import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoWalletOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import { getLaboratoryWalletBalance, getLaboratoryWalletTransactions } from '../laboratory-services/laboratoryService'
import { useToast } from '../../../contexts/ToastContext'

// Default balance data (will be replaced by API data)
const defaultBalanceData = {
  totalBalance: 0,
  availableBalance: 0,
  pendingBalance: 0,
  recentActivity: [],
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

const WalletBalance = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [balanceData, setBalanceData] = useState(defaultBalanceData)
  const [loading, setLoading] = useState(true)

  // Fetch balance and recent activity from API
  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        setLoading(true)
        const [balanceResponse, transactionsResponse] = await Promise.all([
          getLaboratoryWalletBalance(),
          getLaboratoryWalletTransactions({ limit: 5 }),
        ])
        
        if (balanceResponse.success && balanceResponse.data) {
          const balance = balanceResponse.data
          const recentActivity = transactionsResponse.success && transactionsResponse.data
            ? (Array.isArray(transactionsResponse.data) 
                ? transactionsResponse.data 
                : transactionsResponse.data.transactions || [])
                .slice(0, 5)
                .map(txn => ({
                  id: txn._id || txn.id,
                  type: txn.type === 'earning' ? 'available' : txn.status === 'pending' ? 'pending' : 'available',
                  amount: txn.amount || 0,
                  description: txn.description || txn.notes || 'Transaction',
                  date: txn.createdAt || txn.date || new Date().toISOString(),
                  status: txn.status || 'completed',
                }))
            : []
          
          setBalanceData({
            totalBalance: balance.totalBalance || balance.balance || 0,
            availableBalance: balance.availableBalance || balance.available || 0,
            pendingBalance: balance.pendingBalance || balance.pending || 0,
            recentActivity,
          })
        }
      } catch (err) {
        console.error('Error fetching balance data:', err)
        toast.error('Failed to load balance data')
      } finally {
        setLoading(false)
      }
    }

    fetchBalanceData()
  }, [toast])

  return (
    <section className="flex flex-col gap-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/laboratory/wallet')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Balance</h1>
          <p className="mt-1 text-sm text-slate-600">View your wallet balance details</p>
        </div>
      </div>

      {/* Main Balance Card - Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(17,73,108,0.15)] bg-gradient-to-br from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 sm:p-8 text-white shadow-2xl shadow-[rgba(17,73,108,0.25)]">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80 mb-1">Total Balance</p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight">{formatCurrency(balanceData.totalBalance)}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 border border-white/30">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium">Available: {formatCurrency(balanceData.availableBalance)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 border border-white/30">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-medium">Pending: {formatCurrency(balanceData.pendingBalance)}</span>
                </div>
              </div>
            </div>
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <IoWalletOutline className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Balance Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Available</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(balanceData.availableBalance)}</p>
          <p className="mt-1 text-xs text-slate-500">Ready to withdraw</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(balanceData.pendingBalance)}</p>
          <p className="mt-1 text-xs text-slate-500">Processing</p>
        </div>
      </div>

      {/* Recent Activity */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Recent Activity</h2>
        <div className="space-y-3">
          {balanceData.recentActivity.map((activity) => (
            <article
              key={activity.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    activity.type === 'available'
                      ? 'bg-emerald-100'
                      : 'bg-amber-100'
                  }`}
                >
                  <IoWalletOutline
                    className={`h-6 w-6 ${
                      activity.type === 'available'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {activity.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(activity.date)}
                      </p>
                      {activity.status === 'pending' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                          <IoTimeOutline className="h-3.5 w-3.5" />
                          Processing
                        </div>
                      )}
                      {activity.status === 'completed' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                          <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                          Completed
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <p
                        className={`text-lg font-bold ${
                          activity.type === 'available'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        +{formatCurrency(activity.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default WalletBalance

