import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoWalletOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import { getPharmacyWalletBalance, getPharmacyWalletTransactions } from '../pharmacy-services/pharmacyService'
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
          getPharmacyWalletBalance(),
          getPharmacyWalletTransactions({ limit: 5 }),
        ])
        
        console.log('Pharmacy Wallet Balance Response:', balanceResponse)
        console.log('Pharmacy Wallet Transactions Response:', transactionsResponse)
        
        if (balanceResponse?.success && balanceResponse.data) {
          const balance = balanceResponse.data
          console.log('Pharmacy Balance Data:', balance)
          
          // Parse recent activity from transactions
          const recentActivity = transactionsResponse?.success && transactionsResponse.data
            ? (Array.isArray(transactionsResponse.data)
                ? transactionsResponse.data
                : transactionsResponse.data.items || transactionsResponse.data.transactions || [])
                .slice(0, 5)
                .map(txn => {
                  // Extract patient name from populated orderId or requestId
                  let patientName = ''
                  if (txn.orderId && txn.orderId.patientId) {
                    const patient = txn.orderId.patientId
                    if (typeof patient === 'object') {
                      patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || ''
                    }
                  } else if (txn.requestId && txn.requestId.patientId) {
                    const patient = txn.requestId.patientId
                    if (typeof patient === 'object') {
                      patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || ''
                    }
                  }
                  
                  // Extract commission from description or metadata
                  let commissionInfo = ''
                  if (txn.metadata?.commissionRate) {
                    commissionInfo = `Commission: ${(txn.metadata.commissionRate * 100).toFixed(1)}%`
                  } else if (txn.description && txn.description.includes('Commission:')) {
                    const commissionMatch = txn.description.match(/\(Commission:\s*([^)]+)\)/)
                    if (commissionMatch) {
                      commissionInfo = commissionMatch[0].replace(/[()]/g, '')
                    }
                  }
                  
                  // Clean description
                  let description = txn.description || txn.notes || ''
                  if (description) {
                    description = description.replace(/\s*-\s*Request\s+[a-f0-9]+/gi, '')
                    description = description.replace(/\s*\(Commission:[^)]+\)/gi, '').trim()
                  }
                  
                  // Build clean description if empty
                  if (!description || description === 'Transaction') {
                    if (txn.type === 'earning') {
                      description = patientName 
                        ? `Payment received for medicines from patient ${patientName}`
                        : 'Payment received for medicines'
                    } else if (txn.type === 'withdrawal') {
                      description = 'Withdrawal request'
                    } else {
                      description = description || 'Transaction'
                    }
                  }
                  
                  return {
                    id: txn._id || txn.id,
                    type: txn.type === 'earning' ? 'available' : txn.status === 'pending' ? 'pending' : 'available',
                    amount: Number(txn.amount ?? 0),
                    description,
                    commission: commissionInfo,
                    date: txn.createdAt || txn.date || new Date().toISOString(),
                    status: txn.status || 'completed',
                    patientName,
                  }
                })
            : []
          
          console.log('Pharmacy Recent Activity:', recentActivity)
          
          setBalanceData({
            totalBalance: Number(balance.totalBalance ?? balance.balance ?? 0),
            availableBalance: Number(balance.availableBalance ?? balance.available ?? 0),
            pendingBalance: Number(balance.pendingBalance ?? balance.pendingWithdrawals ?? balance.pending ?? 0),
            recentActivity,
          })
        } else {
          console.error('Pharmacy Wallet Balance Error:', balanceResponse)
          toast.error('Failed to load balance data')
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
          onClick={() => navigate('/pharmacy/wallet')}
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
            </div>
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <IoWalletOutline className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Balance Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Available Balance */}
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <IoCheckmarkCircleOutline className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Available Balance</p>
                <p className="mt-1 text-xs text-slate-500">Ready to withdraw</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(balanceData.availableBalance)}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">Available now</span>
            </div>
          </div>
        </div>

        {/* Pending Balance */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-amber-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <IoTimeOutline className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending Balance</p>
                <p className="mt-1 text-xs text-slate-500">Processing</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(balanceData.pendingBalance)}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-600">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-medium">Under review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Activity</h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {balanceData.recentActivity.length} transactions
          </span>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-sm text-slate-500">Loading recent activity...</p>
            </div>
          ) : balanceData.recentActivity.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoWalletOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No recent activity</p>
              <p className="mt-1 text-sm text-slate-500">Your recent transactions will appear here</p>
            </div>
          ) : (
            balanceData.recentActivity.map((activity) => (
            <article
              key={activity.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                    activity.type === 'available'
                      ? 'bg-emerald-50 border border-emerald-100'
                      : 'bg-amber-50 border border-amber-100'
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
                      {/* Patient Name */}
                      {activity.patientName && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-sm font-semibold text-slate-900">{activity.patientName}</p>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 capitalize">Patient</span>
                        </div>
                      )}
                      {/* Description */}
                      <p className={`text-sm ${activity.patientName ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                        {activity.description}
                      </p>
                      {/* Commission */}
                      {activity.commission && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 font-medium border border-blue-200">
                            {activity.commission}
                          </span>
                        </div>
                      )}
                      {/* Date */}
                      <p className="mt-1.5 text-xs text-slate-500">
                        {formatDateTime(activity.date)}
                      </p>
                      <div className="mt-2.5">
                        {activity.status === 'pending' && (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            <IoTimeOutline className="h-3.5 w-3.5" />
                            Processing
                          </div>
                        )}
                        {activity.status === 'completed' && (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <p
                        className={`text-xl font-bold ${
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
            ))
          )}
        </div>
      </section>
    </section>
  )
}

export default WalletBalance

