import { useState, useEffect } from 'react'
import {
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoFlaskOutline,
  IoBagHandleOutline,
  IoPeopleOutline,
} from 'react-icons/io5'
import { getPatientTransactions } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'

// Default transactions (will be replaced by API data)
const defaultTransactions = []

const PatientTransactions = () => {
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [transactions, setTransactions] = useState(defaultTransactions)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPatientTransactions()
        
        if (response.success && response.data) {
          // Handle both array and object with items/transactions property
          const transactionsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.transactions || []
          
          // Transform API data to match component structure
          const transformed = transactionsData.map(txn => {
            // Extract provider name based on category
            let providerName = 'Provider'
            let category = txn.category || 'appointment'
            
            if (txn.category === 'appointment' && txn.appointmentId) {
              // For appointments, get doctor name
              const doctor = txn.appointmentId.doctorId
              if (doctor) {
                if (doctor.firstName && doctor.lastName) {
                  providerName = `Dr. ${doctor.firstName} ${doctor.lastName}`
                } else if (doctor.name) {
                  providerName = doctor.name
                } else {
                  providerName = 'Doctor'
                }
                category = 'appointment'
              }
            } else if ((txn.category === 'medicine' || txn.category === 'order') && txn.orderId) {
              // For orders (pharmacy/lab), get provider name
              const order = txn.orderId
              if (order.providerId) {
                if (order.providerType === 'laboratory') {
                  providerName = order.providerId.labName || order.providerId.name || 'Laboratory'
                  category = 'laboratory'
                } else if (order.providerType === 'pharmacy') {
                  providerName = order.providerId.name || 'Pharmacy'
                  category = 'pharmacy'
                }
              }
            }
            
            // Extract service/description
            let serviceName = txn.description || ''
            if (txn.category === 'appointment' && txn.appointmentId) {
              const doctor = txn.appointmentId.doctorId
              if (doctor && doctor.specialization) {
                serviceName = `Appointment with ${providerName} - ${doctor.specialization}`
              } else {
                serviceName = `Appointment payment for appointment`
              }
            } else if ((txn.category === 'medicine' || txn.category === 'order') && txn.orderId) {
              serviceName = txn.description || `Payment for ${category === 'laboratory' ? 'lab test' : 'medicine'} order`
            }
            
            return {
              id: txn._id || txn.id,
              _id: txn._id || txn.id,
              type: txn.type || txn.transactionType || 'payment',
              category: category,
              providerName: providerName,
              serviceName: serviceName,
              amount: txn.amount || 0,
              status: txn.status || 'completed',
              date: txn.createdAt ? new Date(txn.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              time: txn.createdAt ? new Date(txn.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
              transactionId: txn.transactionId || txn._id || txn.id,
              paymentMethod: txn.paymentMethod || 'razorpay',
              queueNumber: txn.queueNumber || null,
              originalData: txn,
            }
          })
          
          setTransactions(transformed)
        }
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err.message || 'Failed to load transactions')
        toast.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
    
    // Listen for appointment booking event to refresh transactions
    const handleAppointmentBooked = () => {
      fetchTransactions()
    }
    window.addEventListener('appointmentBooked', handleAppointmentBooked)
    
    return () => {
      window.removeEventListener('appointmentBooked', handleAppointmentBooked)
    }
  }, [toast])

  // Legacy localStorage loading removed - using API now

  // Filter out pending transactions (they should show in requests page)
  const completedTransactions = transactions.filter(txn => txn.status !== 'pending' && txn.status !== 'accepted')
  
  const filteredTransactions = filter === 'all' 
    ? completedTransactions 
    : completedTransactions.filter(txn => txn.status === filter)

  // Show loading state
  if (loading) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold text-slate-700">Loading transactions...</p>
        </div>
      </section>
    )
  }

  // Show error state
  if (error) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold text-red-700">Error loading transactions</p>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
        </div>
      </section>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'paid':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending':
      case 'accepted':
        return 'bg-amber-100 text-amber-700'
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'paid':
        return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
      case 'pending':
      case 'accepted':
        return <IoTimeOutline className="h-3.5 w-3.5" />
      case 'failed':
      case 'cancelled':
        return <IoCloseCircleOutline className="h-3.5 w-3.5" />
      default:
        return null
    }
  }

  const getTypeIcon = (type, category) => {
    if (category === 'laboratory' || type === 'Lab Test') {
      return <IoFlaskOutline className="h-6 w-6 text-[#11496c]" />
    } else if (category === 'pharmacy' || type === 'Pharmacy') {
      return <IoBagHandleOutline className="h-6 w-6 text-amber-600" />
    } else {
      return <IoPeopleOutline className="h-6 w-6 text-purple-600" />
    }
  }

  const getTypeBgColor = (category) => {
    if (category === 'laboratory') {
      return 'bg-[rgba(17,73,108,0.1)]'
    } else if (category === 'pharmacy') {
      return 'bg-amber-100'
    } else {
      return 'bg-purple-100'
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  const formatDateTime = (dateString, timeString) => {
    try {
      if (dateString && timeString && timeString !== 'N/A') {
        return `${formatDate(dateString)}, ${timeString}`
      }
      return formatDate(dateString)
    } catch (error) {
      return dateString
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'completed', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === status
                ? 'text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            style={filter === status ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : {}}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map((transaction) => (
          <article
            key={transaction.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getTypeBgColor(transaction.category)}`}>
                {getTypeIcon(transaction.type, transaction.category)}
              </div>

              {/* Main Content with Amount on Right */}
              <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                {/* Left Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Provider Name and Amount Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">{transaction.providerName}</p>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 capitalize shrink-0">{transaction.category}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <p className={`text-lg font-bold whitespace-nowrap ${transaction.status === 'completed' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {transaction.status === 'completed' ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs text-slate-600">
                      {transaction.category === 'laboratory' 
                        ? `Payment for lab test order`
                        : transaction.category === 'pharmacy'
                        ? `Payment for medicine order`
                        : transaction.category === 'appointment'
                        ? `Appointment payment`
                        : `Payment for ${transaction.type.toLowerCase()}`
                      }
                    </p>
                    {transaction.serviceName && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{transaction.serviceName}</p>
                    )}
                  </div>

                  {/* Status Badge and Type Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span className="capitalize">{transaction.status === 'paid' ? 'completed' : transaction.status === 'accepted' ? 'pending' : transaction.status}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      transaction.category === 'laboratory' 
                        ? 'bg-blue-100 text-blue-700' 
                        : transaction.category === 'pharmacy'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {transaction.type}
                    </span>
                  </div>

                  {/* Date and Time */}
                  <div className="text-xs text-slate-500">
                    <span>{formatDateTime(transaction.date, transaction.time)}</span>
                  </div>

                  {/* Transaction ID and Order ID */}
                  <div className="space-y-0.5 pt-0.5">
                    <p className="text-xs text-slate-400">Transaction ID: {transaction.transactionId}</p>
                    {transaction.requestId && (
                      <p className="text-xs text-slate-400">Order: {transaction.requestId}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            <IoReceiptOutline className="h-8 w-8" />
          </div>
          <p className="text-lg font-semibold text-slate-700">No transactions found</p>
          <p className="text-sm text-slate-500">Try selecting a different filter</p>
        </div>
      )}
    </section>
  )
}

export default PatientTransactions
