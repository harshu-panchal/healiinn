import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoReceiptOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoFilterOutline,
  IoFlaskOutline,
  IoPersonOutline,
} from 'react-icons/io5'
import { getLaboratoryWalletTransactions } from '../laboratory-services/laboratoryService'
import { useToast } from '../../../contexts/ToastContext'

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

const WalletTransaction = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [filterType, setFilterType] = useState('all') // all, earnings, withdrawals
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const response = await getLaboratoryWalletTransactions()
        
        if (response?.success && response.data) {
          const transactionsData = Array.isArray(response.data.items) 
            ? response.data.items 
            : Array.isArray(response.data)
            ? response.data 
            : response.data.transactions || []
          
          const transformed = transactionsData.map(txn => {
            const order = txn.orderId || {}
            const patient = order.patientId || {}
            const withdrawal = txn.withdrawalRequestId || {}
            
            return {
            id: txn._id || txn.id,
            type: txn.type || 'earning',
              amount: Number(txn.amount || 0),
              description: txn.description || txn.notes || (txn.type === 'earning' ? 'Test Order Payment' : 'Withdrawal'),
            date: txn.createdAt || txn.date || new Date().toISOString(),
            status: txn.status || 'completed',
              category: txn.type === 'earning' ? 'Test Order Payment' : 'Withdrawal',
              patientName: patient.name || 'Patient',
              transactionId: txn._id?.toString() || '',
              requestId: order._id?.toString() || withdrawal._id?.toString() || '',
            originalData: txn,
            }
          })
          
          setTransactions(transformed)
        } else {
          toast.error('Failed to load transactions')
        }
      } catch (err) {
        console.error('Error fetching transactions:', err)
        toast.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [toast])

  const filteredTransactions = transactions.filter((txn) => {
    if (filterType === 'all') return true
    if (filterType === 'earnings') return txn.type === 'earning'
    if (filterType === 'withdrawals') return txn.type === 'withdrawal'
    return true
  })

  return (
    <section className="flex flex-col gap-6 pb-4">

      {/* Main Transaction Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(17,73,108,0.15)] bg-gradient-to-br from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 sm:p-8 text-white shadow-2xl shadow-[rgba(17,73,108,0.25)]">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80 mb-1">Total Transactions</p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight">{transactions.length}</p>
            </div>
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <IoReceiptOutline className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
        <IoFilterOutline className="h-5 w-5 shrink-0 text-slate-500" />
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'all'
              ? 'bg-[#11496c] text-white shadow-sm'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterType('earnings')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'earnings'
              ? 'bg-purple-500 text-white shadow-sm shadow-purple-400/40'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Earnings
        </button>
        <button
          type="button"
          onClick={() => setFilterType('withdrawals')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'withdrawals'
              ? 'bg-purple-500 text-white shadow-sm shadow-purple-400/40'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Withdrawals
        </button>
      </div>

      {/* Transactions List */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Transaction History</h2>
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoReceiptOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No transactions found</p>
              <p className="mt-1 text-sm text-slate-500">Your transaction history will appear here</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      transaction.type === 'earning' ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}
                  >
                    {transaction.type === 'earning' ? (
                      <IoArrowDownOutline className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <IoArrowUpOutline className="h-6 w-6 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-sm font-semibold text-slate-900">{transaction.patientName || 'Patient'}</p>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 capitalize">Patient</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{transaction.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                            {transaction.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            {formatDateTime(transaction.date)}
                          </span>
                          {transaction.transactionId && (
                            <span className="text-xs text-slate-400">Transaction ID: {transaction.transactionId}</span>
                          )}
                          {transaction.requestId && (
                            <span className="text-xs text-slate-400">Order: {transaction.requestId}</span>
                          )}
                        </div>
                        {transaction.status === 'pending' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            <IoTimeOutline className="h-3.5 w-3.5" />
                            Processing
                          </div>
                        )}
                        {transaction.status === 'completed' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                            Completed
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <p
                          className={`text-lg font-bold ${
                            transaction.type === 'earning' ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {transaction.type === 'earning' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
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

export default WalletTransaction

