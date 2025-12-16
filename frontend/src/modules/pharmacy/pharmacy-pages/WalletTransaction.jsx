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
  IoBagHandleOutline,
  IoPersonOutline,
} from 'react-icons/io5'
import { getPharmacyWalletTransactions } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

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

const WalletTransaction = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [filterType, setFilterType] = useState('all') // all, earnings, withdrawals
  const [transactions, setTransactions] = useState([])
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterType])

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const response = await getPharmacyWalletTransactions({ 
          page: currentPage,
          limit: itemsPerPage
        })
        
        console.log('Pharmacy Wallet Transactions Response:', response)
        
        if (response?.success && response.data) {
          const transactionsData = Array.isArray(response.data)
            ? response.data
            : response.data.items || response.data.transactions || []
          
          console.log('Pharmacy Transactions Data:', transactionsData)
          
          // Extract pagination info
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1)
            setTotalItems(response.data.pagination.total || 0)
            setTotalTransactions(response.data.pagination.total || 0)
          } else {
            setTotalPages(1)
            setTotalItems(transactionsData.length)
            setTotalTransactions(transactionsData.length)
          }
          
          const transformed = transactionsData.map(txn => {
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
            
            // Extract transaction ID
            const transactionId = txn._id?.toString() || txn.id?.toString() || ''
            
            // Extract request/order ID
            const requestId = txn.requestId?._id?.toString() || 
                            txn.requestId?.toString() || 
                            txn.orderId?._id?.toString() || 
                            txn.orderId?.toString() || ''
            
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
            
            // Clean description - remove request ID and commission
            let description = txn.description || txn.notes || ''
            if (description) {
              // Remove request ID pattern
              description = description.replace(/\s*-\s*Request\s+[a-f0-9]+/gi, '')
              // Remove commission info
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
              type: txn.type || 'earning',
              amount: Number(txn.amount ?? 0),
              description,
              commission: commissionInfo,
              date: txn.createdAt || txn.date || new Date().toISOString(),
              status: txn.status || 'completed',
              category: txn.category || (txn.type === 'earning' ? 'Earning' : txn.type === 'withdrawal' ? 'Withdrawal' : 'Transaction'),
              patientName,
              transactionId: transactionId ? transactionId.substring(0, 8) : '',
              requestId: requestId ? requestId.substring(0, 8) : '',
              originalData: txn,
            }
          })
          
          console.log('Pharmacy Transformed Transactions:', transformed)
          setTransactions(transformed)
        } else {
          console.error('Pharmacy Wallet Transactions Error:', response)
          toast.error('Failed to load transactions')
          setTransactions([])
          setTotalPages(1)
          setTotalItems(0)
          setTotalTransactions(0)
        }
      } catch (err) {
        console.error('Error fetching transactions:', err)
        toast.error('Failed to load transactions')
        setTransactions([])
        setTotalPages(1)
        setTotalItems(0)
        setTotalTransactions(0)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [toast, currentPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredTransactions = transactions.filter((txn) => {
    if (filterType === 'all') return true
    if (filterType === 'earnings') return txn.type === 'earning'
    if (filterType === 'withdrawals') return txn.type === 'withdrawal'
    return true
  })

  return (
    <section className="flex flex-col gap-6 pb-4">
      {/* Header - Back Button Only */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/pharmacy/wallet')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
      </div>

      {/* Main Transaction Card - Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-100/60 bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 p-6 sm:p-8 text-white shadow-2xl shadow-purple-500/30">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80 mb-1">Total Transactions</p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight">{loading ? '...' : totalTransactions || transactions.length}</p>
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
              ? 'bg-purple-500 text-white shadow-sm shadow-purple-400/40'
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

      {/* Transactions List - Scrollable Container */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Transaction History</h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {totalItems} {totalItems === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>
        <div className="max-h-[60vh] md:max-h-[65vh] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-500">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoReceiptOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No transactions found</p>
              <p className="mt-1 text-sm text-slate-500">Your transaction history will appear here</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                      transaction.type === 'earning' 
                        ? 'bg-emerald-50 border border-emerald-100' 
                        : 'bg-amber-50 border border-amber-100'
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
                        {/* Patient Name */}
                        {transaction.patientName && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-sm font-semibold text-slate-900">{transaction.patientName}</p>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 capitalize">Patient</span>
                          </div>
                        )}
                        {/* Description */}
                        <p className={`text-sm ${transaction.patientName ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                          {transaction.description}
                        </p>
                        {/* Commission and Request ID */}
                        {(transaction.commission || transaction.requestId) && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            {transaction.commission && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 font-medium border border-blue-200">
                                {transaction.commission}
                              </span>
                            )}
                            {transaction.requestId && (
                              <span className="text-slate-500">
                                Request: {transaction.requestId}
                              </span>
                            )}
                          </div>
                        )}
                        {/* Transaction Details */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                            {transaction.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            {formatDateTime(transaction.date)}
                          </span>
                          {transaction.transactionId && (
                            <span className="text-slate-400">
                              Txn ID: {transaction.transactionId}
                            </span>
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
                          className={`text-xl font-bold ${
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

        {/* Pagination */}
        {!loading && filteredTransactions.length > 0 && totalPages > 1 && (
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

export default WalletTransaction

