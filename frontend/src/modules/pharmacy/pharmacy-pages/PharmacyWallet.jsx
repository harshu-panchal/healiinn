import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoWalletOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import { getPharmacyWalletBalance, getPharmacyWalletTransactions } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'

// Default wallet data (will be replaced by API data)
const defaultWalletData = {
  totalBalance: 0,
  availableBalance: 0,
  pendingBalance: 0,
  thisMonthEarnings: 0,
  lastMonthEarnings: 0,
  totalEarnings: 0,
  totalWithdrawals: 0,
  totalTransactions: 0,
  recentActivity: [],
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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

const PharmacyWallet = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [walletData, setWalletData] = useState(defaultWalletData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch wallet data from API
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [balanceResponse, transactionsResponse] = await Promise.all([
          getPharmacyWalletBalance(),
          getPharmacyWalletTransactions({ limit: 5 }),
        ])
        
        console.log('Pharmacy Wallet Balance Response:', balanceResponse)
        console.log('Pharmacy Wallet Transactions Response:', transactionsResponse)
        
        if (balanceResponse?.success && balanceResponse.data) {
          const data = balanceResponse.data
          console.log('Pharmacy Wallet Data:', data)
          
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
                      patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient'
                    }
                  } else if (txn.requestId && txn.requestId.patientId) {
                    const patient = txn.requestId.patientId
                    if (typeof patient === 'object') {
                      patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient'
                    }
                  }
                  
                  // Extract transaction ID
                  const transactionId = txn._id?.toString() || txn.id?.toString() || ''
                  
                  // Extract request/order ID
                  const requestId = txn.requestId?._id?.toString() || 
                                  txn.requestId?.toString() || 
                                  txn.orderId?._id?.toString() || 
                                  txn.orderId?.toString() || ''
                  
                  // Build description from transaction data
                  let description = txn.description || txn.notes || ''
                  
                  // Extract commission from description if present, or from metadata
                  let commissionInfo = ''
                  if (txn.metadata?.commissionRate) {
                    commissionInfo = `(Commission: ${(txn.metadata.commissionRate * 100).toFixed(1)}%)`
                  } else if (description.includes('Commission:')) {
                    // Extract commission from description
                    const commissionMatch = description.match(/\(Commission:\s*([^)]+)\)/)
                    if (commissionMatch) {
                      commissionInfo = commissionMatch[0]
                    }
                  }
                  
                  // Clean description - remove request ID and commission from main description for cleaner display
                  if (description) {
                    // Remove request ID pattern if present
                    description = description.replace(/\s*-\s*Request\s+[a-f0-9]+/gi, '')
                    // Remove commission info from description (we'll show it separately)
                    description = description.replace(/\s*\(Commission:[^)]+\)/gi, '').trim()
                  }
                  
                  // Build clean description based on type
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
                    transactionId: transactionId ? transactionId.substring(0, 8) : '',
                    requestId: requestId ? requestId.substring(0, 8) : '',
                  }
                })
            : []
          
          console.log('Pharmacy Wallet Recent Activity:', recentActivity)
          
          setWalletData({
            totalBalance: Number(data.totalBalance ?? data.balance ?? 0),
            availableBalance: Number(data.availableBalance ?? data.available ?? 0),
            pendingBalance: Number(data.pendingBalance ?? data.pendingWithdrawals ?? data.pending ?? 0),
            thisMonthEarnings: Number(data.thisMonthEarnings ?? 0),
            lastMonthEarnings: Number(data.lastMonthEarnings ?? 0),
            totalEarnings: Number(data.totalEarnings ?? 0),
            totalWithdrawals: Number(data.totalWithdrawals ?? 0),
            totalTransactions: Number(data.totalTransactions ?? 0),
            recentActivity,
          })
        } else {
          console.error('Pharmacy Wallet Balance Error:', balanceResponse)
          setError('Failed to load wallet data')
          toast.error('Failed to load wallet data')
        }
      } catch (err) {
        console.error('Error fetching wallet data:', err)
        setError(err.message || 'Failed to load wallet data')
        toast.error('Failed to load wallet data')
      } finally {
        setLoading(false)
      }
    }

    fetchWalletData()
  }, [toast])

  return (
    <section className="flex flex-col gap-6 pb-4">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Wallet</h1>
            <p className="mt-1.5 text-sm text-slate-600">Manage your pharmacy earnings and withdrawals</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 border border-emerald-100">
            <IoShieldCheckmarkOutline className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700 hidden sm:inline">Secure</span>
          </div>
        </div>
      </div>

      {/* Main Balance Card - Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(17,73,108,0.15)] bg-gradient-to-br from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 sm:p-8 text-white shadow-2xl shadow-[rgba(17,73,108,0.25)]">
        {/* Animated Background Elements */}
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80 mb-1">Total Balance</p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight">{loading ? '...' : formatCurrency(walletData.totalBalance)}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 border border-white/30">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium">Available: {loading ? '...' : formatCurrency(walletData.availableBalance)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 border border-white/30">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-medium">Pending: {loading ? '...' : formatCurrency(walletData.pendingBalance)}</span>
                </div>
              </div>
            </div>
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <IoWalletOutline className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Earning Card */}
        <button
          onClick={() => navigate('/pharmacy/wallet/earning')}
          className="group relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-5 shadow-sm hover:shadow-lg transition-all active:scale-[0.98] hover:border-emerald-200"
        >
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-emerald-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <IoArrowDownOutline className="h-5 w-5 text-emerald-600" />
              </div>
              <IoArrowForwardOutline className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">Total Earnings</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{loading ? '...' : formatCurrency(walletData.totalEarnings)}</p>
            <p className="mt-1 text-[10px] text-slate-500">All time earnings</p>
          </div>
        </button>

        {/* Withdraw Card */}
        <button
          onClick={() => navigate('/pharmacy/wallet/withdraw')}
          className="group relative overflow-hidden rounded-2xl border border-amber-100/60 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 p-5 shadow-sm hover:shadow-lg transition-all active:scale-[0.98] hover:border-amber-200"
        >
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-amber-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <IoCashOutline className="h-5 w-5 text-amber-600" />
              </div>
              <IoArrowForwardOutline className="h-4 w-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Total Withdrawals</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{loading ? '...' : formatCurrency(walletData.totalWithdrawals)}</p>
            <p className="mt-1 text-[10px] text-slate-500">All time withdrawals</p>
          </div>
        </button>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Balance Details Card */}
        <button
          onClick={() => navigate('/pharmacy/wallet/balance')}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] hover:border-[rgba(17,73,108,0.3)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#11496c] to-[#1a5f7a]">
                <IoWalletOutline className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">Balance Details</p>
                <p className="text-xs text-slate-500">View breakdown</p>
              </div>
            </div>
            <IoArrowForwardOutline className="h-5 w-5 text-slate-400 group-hover:text-[#11496c] group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* Transaction History Card */}
        <button
          onClick={() => navigate('/pharmacy/wallet/transaction')}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] hover:border-[rgba(17,73,108,0.3)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                <IoReceiptOutline className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">Transaction History</p>
                <p className="text-xs text-slate-500">{loading ? '...' : walletData.totalTransactions} transactions</p>
              </div>
            </div>
            <IoArrowForwardOutline className="h-5 w-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>

      {/* Recent Activity Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Activity</h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {walletData.recentActivity.length} {walletData.recentActivity.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-sm text-slate-500">Loading recent activity...</p>
            </div>
          ) : walletData.recentActivity.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoReceiptOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No recent activity</p>
              <p className="mt-1 text-sm text-slate-500">Your recent transactions will appear here</p>
            </div>
          ) : (
            walletData.recentActivity.map((activity) => (
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
                    {activity.type === 'available' ? (
                      <IoCheckmarkCircleOutline className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <IoTimeOutline className="h-6 w-6 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Patient Name and Transaction Type */}
                        {activity.patientName && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-sm font-semibold text-slate-900">{activity.patientName}</p>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 capitalize">
                              {activity.type === 'available' ? 'Payment' : 'Transaction'}
                            </span>
                          </div>
                        )}
                        {/* Description */}
                        <div className="space-y-1">
                          <p className={`text-sm ${activity.patientName ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                            {activity.description}
                          </p>
                          {/* Commission and Request ID */}
                          {(activity.commission || activity.requestId) && (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {activity.commission && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 font-medium border border-blue-200">
                                  {activity.commission}
                                </span>
                              )}
                              {activity.requestId && (
                                <span className="text-slate-400">
                                  Request: {activity.requestId}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Transaction Details */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <IoReceiptOutline className="h-3.5 w-3.5" />
                            {formatDateTime(activity.date)}
                          </span>
                          {activity.transactionId && (
                            <span className="text-slate-400">
                              Txn ID: {activity.transactionId.substring(0, 8)}
                            </span>
                          )}
                        </div>
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
                          {activity.type === 'available' ? '+' : ''}{formatCurrency(activity.amount)}
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

export default PharmacyWallet


