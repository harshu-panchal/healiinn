import { useState, useMemo, useEffect } from 'react'
import {
  IoBagHandleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoSearchOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
} from 'react-icons/io5'
import { getPharmacyOrders, updateOrderStatus } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

// Default orders (will be replaced by API data)
const defaultOrders = []

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: IoTimeOutline },
  prescription_received: { label: 'Prescription Received', color: 'bg-blue-100 text-blue-700', icon: IoDocumentTextOutline },
  medicine_collected: { label: 'Medicine Collected', color: 'bg-indigo-100 text-indigo-700', icon: IoBagHandleOutline },
  packed: { label: 'Packed', color: 'bg-purple-100 text-purple-700', icon: IoBagHandleOutline },
  ready_to_be_picked: { label: 'Ready to be Picked', color: 'bg-cyan-100 text-cyan-700', icon: IoCheckmarkCircleOutline },
  picked_up: { label: 'Picked Up', color: 'bg-emerald-100 text-emerald-700', icon: IoCheckmarkCircleOutline },
  delivered: { label: 'Delivered', color: 'bg-slate-100 text-slate-700', icon: IoCheckmarkCircleOutline },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: IoCheckmarkCircleOutline },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: IoCloseCircleOutline },
  // Legacy statuses for backward compatibility
  accepted: { label: 'Accepted', color: 'bg-indigo-100 text-indigo-700', icon: IoCheckmarkCircleOutline },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: IoTimeOutline },
  ready: { label: 'Ready', color: 'bg-emerald-100 text-emerald-700', icon: IoCheckmarkCircleOutline },
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const PharmacyOrders = () => {
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [orders, setOrders] = useState(defaultOrders)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPharmacyOrders({ page: currentPage, limit: itemsPerPage })

        if (response.success && response.data) {
          const ordersData = Array.isArray(response.data.items)
            ? response.data.items
            : Array.isArray(response.data)
              ? response.data
              : response.data.orders || response.data.leads || []

          // Extract pagination info
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1)
            setTotalItems(response.data.pagination.total || 0)
          } else {
            // Fallback if pagination info not available
            setTotalPages(1)
            setTotalItems(ordersData.length)
          }

          // Transform API data to match component structure
          const transformed = ordersData.map(order => {
            const patientName = order.patientId?.firstName && order.patientId?.lastName
              ? `${order.patientId.firstName} ${order.patientId.lastName}`
              : order.patientId?.name || order.patientName || 'Unknown Patient'

            return {
              id: order._id || order.id,
              _id: order._id || order.id,
              type: 'pharmacy',
              patientId: order.patientId?._id || order.patientId?.id || order.patientId || 'pat-unknown',
              patientName: patientName,
              patientPhone: order.patientId?.phone || order.patientPhone || '',
              patientEmail: order.patientId?.email || order.patientEmail || '',
              status: order.status || 'pending',
              createdAt: order.createdAt || new Date().toISOString(),
              prescriptionId: order.prescriptionId?._id || order.prescriptionId?.id || order.prescriptionId || null,
              medicines: (order.items || order.medicines || []).map(med => ({
                name: typeof med === 'string' ? med : med.name || 'Medicine',
                dosage: typeof med === 'object' ? med.dosage : null,
                quantity: typeof med === 'object' ? med.quantity : 1,
                price: typeof med === 'object' ? med.price : 0,
                brand: typeof med === 'object' ? med.brand : null,
              })),
              totalAmount: order.totalAmount || order.amount || 0,
              deliveryType: (() => {
                // Get delivery option from order
                const deliveryOpt = order.deliveryOption || order.deliveryType || order.requestId?.deliveryOption || order.requestId?.deliveryType || (order.originalData?.deliveryOption || order.originalData?.deliveryType)
                // Map backend values to frontend values
                if (deliveryOpt === 'home_delivery' || deliveryOpt === 'home') return 'home'
                if (deliveryOpt === 'pickup') return 'pickup'
                // Default to home if not specified
                return 'home'
              })(),
              address: order.patientId?.address
                ? typeof order.patientId.address === 'object'
                  ? `${order.patientId.address.line1 || ''} ${order.patientId.address.city || ''} ${order.patientId.address.state || ''}`.trim() || 'Address not provided'
                  : order.patientId.address
                : order.deliveryAddress || order.address || 'Address not provided',
              originalData: order,
            }
          })

          setOrders(transformed)
        } else {
          setOrders([])
          setTotalPages(1)
          setTotalItems(0)
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError(err.message || 'Failed to load orders')
        toast.error('Failed to load orders')
        setOrders([])
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [toast, currentPage])
  const [selectedOrder, setSelectedOrder] = useState(null)

  const filteredOrders = useMemo(() => {
    let filtered = orders

    if (filter !== 'all') {
      filtered = filtered.filter((order) => order.status === filter)
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.patientName.toLowerCase().includes(normalizedSearch) ||
          String(order.id || order._id || '').toLowerCase().includes(normalizedSearch) ||
          String(order.prescriptionId || '').toLowerCase().includes(normalizedSearch)
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [filter, searchTerm, orders])

  const handleStatusUpdate = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId || o._id === orderId)
    if (!order) {
      toast.error('Order not found')
      return
    }

    const statusLabel = statusConfig[newStatus]?.label || newStatus
    const patientName = order.patientName
    const totalAmount = formatCurrency(order.totalAmount)

    // Confirm status update
    // Removed confirm popup as per user request
    // const confirmMessage = `Update order status to "${statusLabel}"?\n\nPatient: ${patientName}\nOrder ID: ${orderId}\nTotal Amount: ${totalAmount}\n\nThis will send a notification to the patient about the order status.`

    // if (!window.confirm(confirmMessage)) {
    //   return
    // }

    try {
      // Call API to update order status
      await updateOrderStatus(orderId, newStatus)

      // Update order status in state
      setOrders(prevOrders =>
        prevOrders.map(o =>
          (o.id === orderId || o._id === orderId)
            ? { ...o, status: newStatus }
            : o
        )
      )

      // Prepare notification data for patient
      const notificationData = {
        orderId,
        orderNumber: orderId,
        patientId: order.patientId,
        patientName,
        patientEmail: order.patientEmail,
        patientPhone: order.patientPhone,
        status: newStatus,
        statusLabel,
        totalAmount: order.totalAmount,
        formattedAmount: totalAmount,
        prescriptionId: order.prescriptionId,
        deliveryType: order.deliveryType,
        address: order.address,
        medicines: order.medicines,
        updatedAt: new Date().toISOString(),
      }

      // Status-specific notification messages for patient
      let notificationTitle = ''
      let notificationMessage = ''

      switch (newStatus) {
        case 'pending':
          notificationTitle = '📦 Order Received'
          notificationMessage = `Your order ${orderId} has been received and is being processed.\n\nTotal Amount: ${totalAmount}\n\nWe will update you as your order progresses.`
          break
        case 'prescription_received':
          notificationTitle = '📋 Prescription Received'
          notificationMessage = `Your prescription for order ${orderId} has been received.\n\nTotal Amount: ${totalAmount}\n\nWe are now collecting your medicines.`
          break
        case 'medicine_collected':
          notificationTitle = '💊 Medicine Collected'
          notificationMessage = `All medicines for order ${orderId} have been collected.\n\nTotal Amount: ${totalAmount}\n\nYour order is being packed now.`
          break
        case 'packed':
          notificationTitle = '📦 Order Packed'
          notificationMessage = `Your order ${orderId} has been packed and is ready.\n\nTotal Amount: ${totalAmount}\n\nYour order will be available for ${order.deliveryType === 'home' ? 'delivery' : 'pickup'} soon.`
          break
        case 'ready_to_be_picked':
          notificationTitle = '✅ Order Ready'
          notificationMessage = `Your order ${orderId} is ready for ${order.deliveryType === 'home' ? 'delivery' : 'pickup'}!\n\nTotal Amount: ${totalAmount}\n\n${order.deliveryType === 'home' ? 'It will be delivered to your address soon.' : 'You can now pick it up from the pharmacy.'}`
          break
        case 'picked_up':
          notificationTitle = '🎉 Order Picked Up'
          notificationMessage = `Your order ${orderId} has been picked up.\n\nTotal Amount: ${totalAmount}\n\nThank you for your business!`
          break
        case 'delivered':
          notificationTitle = '🚚 Order Delivered'
          notificationMessage = `Your order ${orderId} has been delivered successfully!\n\nTotal Amount: ${totalAmount}\n\nThank you for choosing us!`
          break
        case 'completed':
          notificationTitle = '✅ Order Completed'
          notificationMessage = `Your order ${orderId} has been completed.\n\nTotal Amount: ${totalAmount}\n\nWe hope you are satisfied with our service!`
          break
        default:
          notificationTitle = 'Order Status Updated'
          notificationMessage = `Your order ${orderId} status has been updated to ${statusLabel}.\n\nTotal Amount: ${totalAmount}`
      }

      // In real app, this would be an API call to backend notification service
      // The backend would send notification via in-app, email, SMS, and push notification
      console.log('Sending order status notification to patient:', {
        type: 'ORDER_STATUS_UPDATE',
        recipient: {
          role: 'patient',
          userId: order.patientId,
          email: order.patientEmail,
          phone: order.patientPhone,
        },
        notification: {
          title: notificationTitle,
          message: notificationMessage,
          data: notificationData,
        },
      })

      // Show success message
      toast.success(`Order status updated to "${statusLabel}"! Notification sent to ${patientName}`)

    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status. Please try again.')
      // Revert status change on error
      setOrders(prevOrders =>
        prevOrders.map(o =>
          (o.id === orderId || o._id === orderId)
            ? { ...o, status: order.status }
            : o
        )
      )
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by patient name, order ID, or prescription..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${filter === status
                ? 'text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            style={filter === status ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : {}}
          >
            {status === 'all' ? 'All Orders' : statusConfig[status]?.label || 'Completed'}
          </button>
        ))}
      </div>

      {/* Orders List - Scrollable Container */}
      <div className="space-y-4">
        <div className="max-h-[60vh] md:max-h-[65vh] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#11496c] border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-500">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <IoBagHandleOutline className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No orders found</p>
              <p className="mt-1 text-xs text-slate-500">
                {searchTerm.trim() || filter !== 'all'
                  ? 'No orders match your search or filter criteria.'
                  : 'Your orders will appear here'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.pending
            const StatusIcon = statusInfo.icon
            const orderId = order.id || order._id || `order-${Math.random()}`

            return (
              <article
                key={orderId}
                className="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#11496c]/30 active:scale-[0.98] lg:hover:scale-[1.02] sm:p-5 lg:gap-3.5"
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
                <div className="relative flex items-start justify-between gap-3 lg:gap-2">
                  <div className="flex-1 min-w-0 lg:min-w-0">
                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap lg:gap-1.5">
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#11496c] transition-colors duration-300 lg:text-sm lg:truncate lg:flex-1">{order.patientName}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${statusInfo.color} group-hover:scale-105 transition-transform duration-300 shrink-0 lg:text-[9px] lg:px-1.5 lg:py-0.5`}>
                        <StatusIcon className="h-3 w-3 lg:h-2.5 lg:w-2.5" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-600 transition-colors break-all lg:text-[10px]">Order ID: {String(orderId)}</p>
                    {order.prescriptionId && (
                      <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors break-all lg:text-[10px]">Prescription: {String(order.prescriptionId)}</p>
                    )}
                    {/* Delivery Type Badge */}
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${order.deliveryType === 'home'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                        }`}>
                        {order.deliveryType === 'home' ? '🏠 Home Delivery' : '📦 Pickup'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 group-hover:text-slate-700 transition-colors lg:text-[10px] lg:flex lg:items-center lg:gap-1">
                      <IoCalendarOutline className="mr-1 inline h-3 w-3 text-[#11496c] lg:h-2.5 lg:w-2.5 lg:mr-0" />
                      <span className="lg:truncate">{formatDateTime(order.createdAt)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0 lg:flex lg:flex-col lg:items-end lg:gap-0.5">
                    <p className="text-lg font-bold text-slate-900 group-hover:text-[#11496c] transition-colors duration-300 lg:text-base lg:leading-tight">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>

                {/* Medicines */}
                {order.medicines && order.medicines.length > 0 && (
                  <div className="relative rounded-lg bg-slate-50 p-3 group-hover:bg-slate-100 transition-colors duration-300 lg:p-2.5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 group-hover:text-slate-600 transition-colors lg:text-[10px] lg:mb-1.5">Medicines</p>
                    <ul className="space-y-1.5 lg:space-y-1">
                      {order.medicines.map((medicine, idx) => (
                        <li key={idx} className="flex items-center justify-between text-xs lg:text-[10px]">
                          <span className="text-slate-700 group-hover:text-slate-900 transition-colors flex items-center gap-1 line-clamp-1 lg:flex-1 lg:min-w-0">
                            <IoBagHandleOutline className="h-3 w-3 text-[#11496c] shrink-0 lg:h-2.5 lg:w-2.5" />
                            <span className="truncate">
                              {medicine.name}
                              {medicine.dosage && ` (${medicine.dosage})`}
                              {medicine.quantity && ` x${medicine.quantity}`}
                            </span>
                          </span>
                          {medicine.price > 0 && (
                            <span className="font-semibold text-slate-900 group-hover:text-[#11496c] transition-colors shrink-0 lg:ml-1 lg:text-[10px]">{formatCurrency(medicine.price * (medicine.quantity || 1))}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Address */}
                <div className="relative flex items-start gap-2 text-xs text-slate-600 group-hover:text-slate-700 transition-colors lg:text-[10px] lg:gap-1.5">
                  <IoLocationOutline className="mt-0.5 h-4 w-4 shrink-0 text-[#11496c] lg:h-3 lg:w-3 lg:mt-0" />
                  <span className="line-clamp-2 lg:line-clamp-1">{order.address}</span>
                </div>

                {/* Action Buttons */}
                <div className="relative flex gap-2 flex-wrap lg:mt-auto lg:pt-2 lg:border-t lg:border-slate-200">
                  {(() => {
                    // Pharmacy order status flow - exactly as per timeline
                    const statusFlowPharmacy = [
                      'pending',
                      'prescription_received',
                      'medicine_collected',
                      'packed',
                      'ready_to_be_picked',
                      'picked_up',
                      'delivered',
                      'completed'
                    ]

                    // Get actual order status
                    let currentStatus = (order.status || 'pending').toLowerCase().trim()

                    // Map legacy statuses to new flow statuses
                    const statusMapping = {
                      'accepted': 'pending',
                      'processing': 'prescription_received',
                      'ready': 'ready_to_be_picked',
                    }

                    // Apply mapping if needed
                    if (statusMapping[currentStatus]) {
                      currentStatus = statusMapping[currentStatus]
                    }

                    // Find current status index in flow
                    let currentIndex = statusFlowPharmacy.indexOf(currentStatus)

                    // If status not found in flow, default to first status (pending)
                    if (currentIndex === -1) {
                      currentIndex = 0
                      currentStatus = 'pending'
                    }

                    // Calculate next status - must be the immediate next step
                    const nextIndex = currentIndex + 1
                    const nextStatus = nextIndex < statusFlowPharmacy.length
                      ? statusFlowPharmacy[nextIndex]
                      : null

                    // Don't show button if:
                    // - Order is already completed
                    // - Order is cancelled
                    // - No next status available
                    if (!nextStatus || currentStatus === 'completed' || currentStatus === 'cancelled') {
                      return null
                    }

                    // Get next status config
                    const nextStatusConfig = statusConfig[nextStatus]
                    if (!nextStatusConfig) {
                      return null
                    }

                    // Return button for next status
                    return (
                      <button
                        onClick={() => handleStatusUpdate(orderId, nextStatus)}
                        className="flex-1 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-95 group-hover:scale-105 lg:px-2 lg:py-1.5 lg:text-[10px]"
                      >
                        <span className="lg:hidden">Next: {nextStatusConfig.label}</span>
                        <span className="hidden lg:inline">{nextStatusConfig.label}</span>
                      </button>
                    )
                  })()}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-[#11496c] hover:bg-[#11496c] hover:text-white active:scale-95 group-hover:scale-110 lg:h-8 lg:w-8"
                    aria-label="View Details"
                  >
                    <IoDocumentTextOutline className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  </button>
                  <a
                    href={`tel:${order.patientPhone}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-emerald-500 hover:bg-emerald-500 hover:text-white active:scale-95 group-hover:scale-110 lg:h-8 lg:w-8"
                    aria-label="Call Patient"
                  >
                    <IoCallOutline className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  </a>
                  <a
                    href={`mailto:${order.patientEmail}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-blue-500 hover:bg-blue-500 hover:text-white active:scale-95 group-hover:scale-110 lg:h-8 lg:w-8"
                    aria-label="Email Patient"
                  >
                    <IoMailOutline className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  </a>
                </div>
              </article>
            )
          })
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && totalPages > 1 && (
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
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-900">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseCircleOutline className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Patient Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedOrder.patientName}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.patientPhone}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.patientEmail}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Medicines</h3>
                <ul className="space-y-2">
                  {selectedOrder.medicines.map((medicine, idx) => (
                    <li key={idx} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                      <div>
                        <p className="font-medium">{medicine.name} {medicine.brand && `(${medicine.brand})`}</p>
                        <p className="text-xs text-slate-500">{medicine.dosage} x {medicine.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(medicine.price)}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-lg text-slate-900">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PharmacyOrders

