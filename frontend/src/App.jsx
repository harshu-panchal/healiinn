import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getAuthToken } from './utils/apiClient'
import { NotificationProvider } from './contexts/NotificationContext'
import { CallProvider } from './contexts/CallContext'
import PatientNavbar from './modules/patient/patient-components/PatientNavbar'
import PatientDashboard from './modules/patient/patient-pages/PatientDashboard'
import PatientDoctors from './modules/patient/patient-pages/PatientDoctors'
import PatientDoctorDetails from './modules/patient/patient-pages/PatientDoctorDetails'
import PatientProfile from './modules/patient/patient-pages/PatientProfile'
import PatientLocations from './modules/patient/patient-pages/PatientLocations'
import PatientPrescriptions from './modules/patient/patient-pages/PatientPrescriptions'
import PatientReports from './modules/patient/patient-pages/PatientReports'
import PatientRequests from './modules/patient/patient-pages/PatientRequests'
import PatientSpecialties from './modules/patient/patient-pages/PatientSpecialties'
import PatientSpecialtyDoctors from './modules/patient/patient-pages/PatientSpecialtyDoctors'
import PatientUpcomingSchedules from './modules/patient/patient-pages/PatientUpcomingSchedules'
import PatientLogin from './modules/patient/patient-pages/PatientLogin'
import PatientTransactions from './modules/patient/patient-pages/PatientTransactions'
import PatientAppointments from './modules/patient/patient-pages/PatientAppointments'
import PatientOrders from './modules/patient/patient-pages/PatientOrders'
import PatientOrderDetails from './modules/patient/patient-pages/PatientOrderDetails'
import PatientSupport from './modules/patient/patient-pages/PatientSupport'
import PatientHistory from './modules/patient/patient-pages/PatientHistory'
import NotificationsPage from './modules/shared/NotificationsPage'
import CallPopup from './modules/shared/CallPopup'
import IncomingCallNotification from './modules/shared/IncomingCallNotification'
import DoctorCallStatus from './modules/shared/DoctorCallStatus'
import DoctorNavbar from './modules/doctor/doctor-components/DoctorNavbar'
import DoctorHeader from './modules/doctor/doctor-components/DoctorHeader'
import DoctorFooter from './modules/doctor/doctor-components/DoctorFooter'
import DoctorLogin from './modules/doctor/doctor-pages/DoctorLogin'
import DoctorDashboard from './modules/doctor/doctor-pages/DoctorDashboard'
import DoctorProfile from './modules/doctor/doctor-pages/DoctorProfile'
import DoctorWallet from './modules/doctor/doctor-pages/DoctorWallet'
import WalletBalance from './modules/doctor/doctor-pages/WalletBalance'
import WalletEarning from './modules/doctor/doctor-pages/WalletEarning'
import WalletWithdraw from './modules/doctor/doctor-pages/WalletWithdraw'
import WalletTransaction from './modules/doctor/doctor-pages/WalletTransaction'
import DoctorConsultations from './modules/doctor/doctor-pages/DoctorConsultations'
import DoctorPatients from './modules/doctor/doctor-pages/DoctorPatients'
import DoctorAllPatients from './modules/doctor/doctor-pages/DoctorAllPatients'
import DoctorAppointments from './modules/doctor/doctor-pages/DoctorAppointments'
import DoctorAllConsultations from './modules/doctor/doctor-pages/DoctorAllConsultations'
import DoctorSupport from './modules/doctor/doctor-pages/DoctorSupport'
import PrivacyPolicy from './modules/doctor/doctor-pages/PrivacyPolicy'
import TermsOfService from './modules/doctor/doctor-pages/TermsOfService'
import MedicalGuidelines from './modules/doctor/doctor-pages/MedicalGuidelines'
import DoctorFAQ from './modules/doctor/doctor-pages/DoctorFAQ'
import HIPAACompliance from './modules/doctor/doctor-pages/HIPAACompliance'
import DataProtection from './modules/doctor/doctor-pages/DataProtection'
import PharmacyNavbar from './modules/pharmacy/pharmacy-components/PharmacyNavbar'
import { PharmacySidebarProvider } from './modules/pharmacy/pharmacy-components/PharmacySidebarContext'
import PharmacyDashboard from './modules/pharmacy/pharmacy-pages/PharmacyDashboard'
import PharmacyList from './modules/pharmacy/pharmacy-pages/PharmacyList'
import PharmacyOrders from './modules/pharmacy/pharmacy-pages/PharmacyOrders'
import PharmacyPatients from './modules/pharmacy/pharmacy-pages/PharmacyPatients'
import PharmacyMedicines from './modules/pharmacy/pharmacy-pages/PharmacyMedicines'
import PharmacyPatientStatistics from './modules/pharmacy/pharmacy-pages/PharmacyPatientStatistics'
import PharmacyProfile from './modules/pharmacy/pharmacy-pages/PharmacyProfile'
import PharmacyWallet from './modules/pharmacy/pharmacy-pages/PharmacyWallet'
import PharmacyWalletBalance from './modules/pharmacy/pharmacy-pages/WalletBalance'
import PharmacyWalletEarning from './modules/pharmacy/pharmacy-pages/WalletEarning'
import PharmacyWalletWithdraw from './modules/pharmacy/pharmacy-pages/WalletWithdraw'
import PharmacyWalletTransaction from './modules/pharmacy/pharmacy-pages/WalletTransaction'
import PharmacySupport from './modules/pharmacy/pharmacy-pages/PharmacySupport'
import PharmacyRequestOrders from './modules/pharmacy/pharmacy-pages/PharmacyRequestOrders'
import LaboratoryNavbar from './modules/laboratory/laboratory-components/LaboratoryNavbar'
import LaboratoryHeader from './modules/laboratory/laboratory-components/LaboratoryHeader'
import LaboratoryFooter from './modules/laboratory/laboratory-components/LaboratoryFooter'
import LaboratoryDashboard from './modules/laboratory/laboratory-pages/LaboratoryDashboard'
import LaboratoryOrders from './modules/laboratory/laboratory-pages/LaboratoryOrders'
import LaboratoryPatients from './modules/laboratory/laboratory-pages/LaboratoryPatients'
import LaboratoryPatientOrders from './modules/laboratory/laboratory-pages/LaboratoryPatientOrders'
import LaboratoryProfile from './modules/laboratory/laboratory-pages/LaboratoryProfile'
import LaboratoryWallet from './modules/laboratory/laboratory-pages/LaboratoryWallet'
import LaboratoryRequests from './modules/laboratory/laboratory-pages/LaboratoryRequests'
import LaboratoryReports from './modules/laboratory/laboratory-pages/LaboratoryReports'
import LaboratoryTestReports from './modules/laboratory/laboratory-pages/LaboratoryTestReports'
import LaboratoryAddReport from './modules/laboratory/laboratory-pages/LaboratoryAddReport'
import LaboratoryPatientStatistics from './modules/laboratory/laboratory-pages/LaboratoryPatientStatistics'
import LaboratoryPatientDetails from './modules/laboratory/laboratory-pages/LaboratoryPatientDetails'
import LaboratoryRequestOrders from './modules/laboratory/laboratory-pages/LaboratoryRequestOrders'
import LaboratoryAvailableTests from './modules/laboratory/laboratory-pages/LaboratoryAvailableTests'
import LaboratoryAddTest from './modules/laboratory/laboratory-pages/LaboratoryAddTest'
import LaboratoryWalletBalance from './modules/laboratory/laboratory-pages/WalletBalance'
import LaboratoryWalletEarning from './modules/laboratory/laboratory-pages/WalletEarning'
import LaboratoryWalletWithdraw from './modules/laboratory/laboratory-pages/WalletWithdraw'
import LaboratoryWalletTransaction from './modules/laboratory/laboratory-pages/WalletTransaction'
import LaboratorySupport from './modules/laboratory/laboratory-pages/LaboratorySupport'
import LaboratoryPrivacyPolicy from './modules/laboratory/laboratory-pages/LaboratoryPrivacyPolicy'
import LaboratoryTermsOfService from './modules/laboratory/laboratory-pages/LaboratoryTermsOfService'
import LaboratoryLabGuidelines from './modules/laboratory/laboratory-pages/LaboratoryLabGuidelines'
import LaboratoryFAQ from './modules/laboratory/laboratory-pages/LaboratoryFAQ'
import LaboratoryHIPAACompliance from './modules/laboratory/laboratory-pages/LaboratoryHIPAACompliance'
import LaboratoryDataProtection from './modules/laboratory/laboratory-pages/LaboratoryDataProtection'
import LaboratoryLabAccreditation from './modules/laboratory/laboratory-pages/LaboratoryLabAccreditation'
import NurseNavbar from './modules/nurse/nurse-components/NurseNavbar'
import NurseHeader from './modules/nurse/nurse-components/NurseHeader'
import NurseFooter from './modules/nurse/nurse-components/NurseFooter'
import NurseDashboard from './modules/nurse/nurse-pages/NurseDashboard'
import NurseBookings from './modules/nurse/nurse-pages/NurseBookings'
import NurseTransactions from './modules/nurse/nurse-pages/NurseTransactions'
import NurseWallet from './modules/nurse/nurse-pages/NurseWallet'
import NurseWalletBalance from './modules/nurse/nurse-pages/NurseWalletBalance'
import NurseWalletEarning from './modules/nurse/nurse-pages/NurseWalletEarning'
import NurseWalletWithdraw from './modules/nurse/nurse-pages/NurseWalletWithdraw'
import NurseWalletTransaction from './modules/nurse/nurse-pages/NurseWalletTransaction'
import NurseSupport from './modules/nurse/nurse-pages/NurseSupport'
import NurseProfile from './modules/nurse/nurse-pages/NurseProfile'
import AdminNavbar from './modules/admin/admin-components/AdminNavbar'
import AdminLogin from './modules/admin/admin-pages/AdminLogin'
import AdminDashboard from './modules/admin/admin-pages/AdminDashboard'
import AdminUsers from './modules/admin/admin-pages/AdminUsers'
import AdminDoctors from './modules/admin/admin-pages/AdminDoctors'
import AdminPharmacies from './modules/admin/admin-pages/AdminPharmacies'
import AdminNurses from './modules/admin/admin-pages/AdminNurses'
import AdminLaboratories from './modules/admin/admin-pages/AdminLaboratories'
import AdminPharmacyMedicines from './modules/admin/admin-pages/AdminPharmacyMedicines'
import AdminInventory from './modules/admin/admin-pages/AdminInventory'
import AdminVerification from './modules/admin/admin-pages/AdminVerification'
import AdminProfile from './modules/admin/admin-pages/AdminProfile'
import AdminWallet from './modules/admin/admin-pages/AdminWallet'
import AdminRevenue from './modules/admin/admin-pages/AdminRevenue'
import AdminProviderRevenue from './modules/admin/admin-pages/AdminProviderRevenue'
import AdminSupport from './modules/admin/admin-pages/AdminSupport'
import AdminAppointments from './modules/admin/admin-pages/AdminAppointments'
import AdminOrders from './modules/admin/admin-pages/AdminOrders'
import AdminRequests from './modules/admin/admin-pages/AdminRequests'
import ProtectedRoute from './components/ProtectedRoute'
import WebNavbar from './modules/website/web-components/WebNavbar'
import Home from './modules/website/web-pages/Home'
import WebOnBoarding from './modules/website/web-pages/WebOnBoarding'

function PatientRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/patient/login'
  const token = getAuthToken('patient')
  
  // If not authenticated and not on login page, force redirect to login
  if (!token && !isLoginPage) {
    return <Navigate to="/patient/login" replace />
  }
  
  return (
    <NotificationProvider module="patient">
      {!isLoginPage && <PatientNavbar />}
      {!isLoginPage && <IncomingCallNotification />}
      <main className={isLoginPage ? '' : 'px-4 pb-24 pt-20 sm:px-6'}>
        <Routes>
          <Route path="/" element={
            token ? <ProtectedRoute module="patient"><Navigate to="/patient/dashboard" replace /></ProtectedRoute> : <Navigate to="/patient/login" replace />
          } />
          <Route path="/login" element={<PatientLogin />} />
          <Route path="/dashboard" element={<ProtectedRoute module="patient"><PatientDashboard /></ProtectedRoute>} />
                    <Route path="/doctors" element={<ProtectedRoute module="patient"><PatientDoctors /></ProtectedRoute>} />
                    <Route path="/doctors/:id" element={<ProtectedRoute module="patient"><PatientDoctorDetails /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute module="patient"><PatientProfile /></ProtectedRoute>} />
                    <Route path="/locations" element={<ProtectedRoute module="patient"><PatientLocations /></ProtectedRoute>} />
                    <Route path="/prescriptions" element={<ProtectedRoute module="patient"><PatientPrescriptions /></ProtectedRoute>} />
                    <Route path="/specialties" element={<ProtectedRoute module="patient"><PatientSpecialties /></ProtectedRoute>} />
                    <Route path="/specialties/:specialtyId/doctors" element={<ProtectedRoute module="patient"><PatientSpecialtyDoctors /></ProtectedRoute>} />
                    <Route path="/upcoming-schedules" element={<ProtectedRoute module="patient"><PatientUpcomingSchedules /></ProtectedRoute>} />
                    <Route path="/reports" element={<Navigate to="/patient/prescriptions?tab=lab-reports" replace />} />
                    <Route path="/requests" element={<ProtectedRoute module="patient"><PatientRequests /></ProtectedRoute>} />
                    <Route path="/transactions" element={<ProtectedRoute module="patient"><PatientTransactions /></ProtectedRoute>} />
                    <Route path="/appointments" element={<ProtectedRoute module="patient"><PatientAppointments /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute module="patient"><PatientOrders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute module="patient"><PatientOrderDetails /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute module="patient"><PatientHistory /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute module="patient"><PatientSupport /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute module="patient"><NotificationsPage /></ProtectedRoute>} />
          <Route path="*" element={
            token ? <ProtectedRoute module="patient"><Navigate to="/patient/dashboard" replace /></ProtectedRoute> : <Navigate to="/patient/login" replace />
          } />
        </Routes>
        {/* Call Popup - Only for patients */}
        <CallPopup />
      </main>
    </NotificationProvider>
  )
}

function AdminRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/admin/login'
  const token = getAuthToken('admin')
  const isAuthenticated = !!token && !isLoginPage

  // If not authenticated and not on login page, force redirect to login
  if (!token && !isLoginPage) {
    return <Navigate to="/admin/login" replace />
  }
  
  return (
    <NotificationProvider module="admin">
      {isAuthenticated && <AdminNavbar />}
      <main className={isLoginPage ? '' : 'px-4 pb-24 pt-28 sm:px-6 lg:ml-64 transition-all duration-300'}>
        <Routes>
          {/* Public route - Login page */}
          <Route path="/login" element={<AdminLogin />} />
          
          {/* Protected routes - All require authentication */}
          <Route path="/" element={
            token ? <ProtectedRoute module="admin"><Navigate to="/admin/dashboard" replace /></ProtectedRoute> : <Navigate to="/admin/login" replace />
          } />
          <Route path="/dashboard" element={<ProtectedRoute module="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute module="admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/doctors" element={<ProtectedRoute module="admin"><AdminDoctors /></ProtectedRoute>} />
          <Route path="/pharmacies" element={<ProtectedRoute module="admin"><AdminPharmacies /></ProtectedRoute>} />
          <Route path="/nurses" element={<ProtectedRoute module="admin"><AdminNurses /></ProtectedRoute>} />
          <Route path="/pharmacy-medicines" element={<ProtectedRoute module="admin"><AdminPharmacyMedicines /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute module="admin"><AdminInventory /></ProtectedRoute>} />
          <Route path="/laboratories" element={<ProtectedRoute module="admin"><AdminLaboratories /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute module="admin"><AdminWallet /></ProtectedRoute>} />
          <Route path="/revenue" element={<ProtectedRoute module="admin"><AdminRevenue /></ProtectedRoute>} />
          <Route path="/revenue/:type" element={<ProtectedRoute module="admin"><AdminProviderRevenue /></ProtectedRoute>} />
          <Route path="/verification" element={<ProtectedRoute module="admin"><AdminVerification /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute module="admin"><AdminAppointments /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute module="admin"><AdminOrders /></ProtectedRoute>} />
          <Route path="/request" element={<ProtectedRoute module="admin"><AdminRequests /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute module="admin"><AdminProfile /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute module="admin"><AdminSupport /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute module="admin"><NotificationsPage /></ProtectedRoute>} />
          
          {/* Catch-all - redirect to login if not authenticated */}
          <Route path="*" element={
            token ? <ProtectedRoute module="admin"><Navigate to="/admin/dashboard" replace /></ProtectedRoute> : <Navigate to="/admin/login" replace />
          } />
        </Routes>
      </main>
    </NotificationProvider>
  )
}

function DoctorRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/doctor/login' || location.pathname === '/doctor/signup'
  const token = getAuthToken('doctor')
  
  // If authenticated and on login/signup page, redirect to dashboard
  if (token && isLoginPage) {
    return <Navigate to="/doctor/dashboard" replace />
  }
  
  // If not authenticated and trying to access protected routes, force redirect to login
  if (!token && !isLoginPage) {
    // Clear any stale tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('doctorAuthToken')
      localStorage.removeItem('doctorAccessToken')
      localStorage.removeItem('doctorRefreshToken')
      sessionStorage.removeItem('doctorAuthToken')
      sessionStorage.removeItem('doctorAccessToken')
      sessionStorage.removeItem('doctorRefreshToken')
    }
    return <Navigate to="/doctor/login" replace />
  }
  
  return (
    <NotificationProvider module="doctor">
      {/* Mobile Navbar - Only visible on mobile/tablet */}
      {!isLoginPage && <DoctorNavbar />}
      
      {/* Desktop Header - Only visible on desktop */}
      {!isLoginPage && <DoctorHeader />}
      
      {/* Doctor Call Status Indicator */}
      {!isLoginPage && <DoctorCallStatus />}
      
      {/* Call Popup - For doctors to join WebRTC */}
      {!isLoginPage && <CallPopup />}
      
      <main className={isLoginPage ? '' : 'px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-8 lg:min-h-screen lg:flex lg:flex-col'}>
        <div className="max-w-7xl mx-auto w-full lg:flex-1">
          <Routes>
            <Route
              path="/"
              element={
                token ? (
                  <ProtectedRoute module="doctor">
                    <Navigate to="/doctor/dashboard" replace />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/doctor/login" replace />
                )
              }
            />
            <Route path="/login" element={<DoctorLogin />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute module="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute module="doctor">
                  <DoctorWallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet/balance"
              element={
                <ProtectedRoute module="doctor">
                  <WalletBalance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet/earning"
              element={
                <ProtectedRoute module="doctor">
                  <WalletEarning />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet/withdraw"
              element={
                <ProtectedRoute module="doctor">
                  <WalletWithdraw />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet/transaction"
              element={
                <ProtectedRoute module="doctor">
                  <WalletTransaction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute module="doctor">
                  <DoctorPatients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/all-patients"
              element={
                <ProtectedRoute module="doctor">
                  <DoctorAllPatients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute module="doctor">
                  <DoctorAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/all-consultations"
              element={
                <ProtectedRoute module="doctor">
                  <DoctorAllConsultations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultations"
              element={
                <ProtectedRoute module="doctor">
                  <DoctorConsultations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute module="doctor">
                  <DoctorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute module="doctor">
                  <DoctorSupport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute module="doctor">
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faq"
              element={
                <ProtectedRoute module="doctor">
                  <DoctorFAQ />
                </ProtectedRoute>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <ProtectedRoute module="doctor">
                  <PrivacyPolicy />
                </ProtectedRoute>
              }
            />
            <Route
              path="/terms-of-service"
              element={
                <ProtectedRoute module="doctor">
                  <TermsOfService />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-guidelines"
              element={
                <ProtectedRoute module="doctor">
                  <MedicalGuidelines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hipaa-compliance"
              element={
                <ProtectedRoute module="doctor">
                  <HIPAACompliance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-protection"
              element={
                <ProtectedRoute module="doctor">
                  <DataProtection />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <Navigate to={token ? "/doctor/dashboard" : "/doctor/login"} replace />
              }
            />
          </Routes>
        </div>
      </main>
      
      {/* Desktop Footer - Only visible on desktop */}
      {!isLoginPage && <DoctorFooter />}
    </NotificationProvider>
  )
}

function PharmacyRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/pharmacy/login' || location.pathname === '/pharmacy/signup'
  const token = getAuthToken('pharmacy')
  
  // If authenticated and on login/signup page, redirect to dashboard
  if (token && isLoginPage) {
    return <Navigate to="/pharmacy/dashboard" replace />
  }
  
  // If not authenticated and trying to access protected routes, force redirect to login
  if (!token && !isLoginPage) {
    // Clear any stale tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pharmacyAuthToken')
      localStorage.removeItem('pharmacyAccessToken')
      localStorage.removeItem('pharmacyRefreshToken')
      sessionStorage.removeItem('pharmacyAuthToken')
      sessionStorage.removeItem('pharmacyAccessToken')
      sessionStorage.removeItem('pharmacyRefreshToken')
    }
    return <Navigate to="/pharmacy/login" replace />
  }
  
  return (
    <NotificationProvider module="pharmacy">
      {!isLoginPage && <PharmacyNavbar />}
      <main className={isLoginPage ? '' : 'px-4 pb-24 pt-20 sm:px-6'}>
        <Routes>
          <Route
            path="/"
            element={
              token ? (
                <ProtectedRoute module="pharmacy">
                  <Navigate to="/pharmacy/dashboard" replace />
                </ProtectedRoute>
              ) : (
                <Navigate to="/pharmacy/login" replace />
              )
            }
          />
          <Route path="/login" element={<DoctorLogin />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-orders"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyRequestOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyWallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicines"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyMedicines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient-statistics"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyPatientStatistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyWallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/balance"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyWalletBalance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/earning"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyWalletEarning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/withdraw"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyWalletWithdraw />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/transaction"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacyWalletTransaction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute module="pharmacy">
                <PharmacySupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute module="pharmacy">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <Navigate to={token ? "/pharmacy/dashboard" : "/pharmacy/login"} replace />
            }
          />
        </Routes>
      </main>
    </NotificationProvider>
  )
}

function LaboratoryRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/laboratory/login' || location.pathname === '/laboratory/signup'
  const token = getAuthToken('laboratory')
  
  // If authenticated and on login/signup page, redirect to dashboard
  if (token && isLoginPage) {
    return <Navigate to="/laboratory/dashboard" replace />
  }
  
  // If not authenticated and trying to access protected routes, force redirect to login
  if (!token && !isLoginPage) {
    // Clear any stale tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('laboratoryAuthToken')
      localStorage.removeItem('laboratoryAccessToken')
      localStorage.removeItem('laboratoryRefreshToken')
      sessionStorage.removeItem('laboratoryAuthToken')
      sessionStorage.removeItem('laboratoryAccessToken')
      sessionStorage.removeItem('laboratoryRefreshToken')
    }
    return <Navigate to="/laboratory/login" replace />
  }
  
  return (
    <NotificationProvider module="laboratory">
      {/* Mobile Navbar - Only visible on mobile/tablet */}
      {!isLoginPage && <LaboratoryNavbar />}
      
      {/* Desktop Header - Only visible on desktop */}
      {!isLoginPage && <LaboratoryHeader />}
      
      <main className={isLoginPage ? '' : 'px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-8 lg:min-h-screen lg:flex lg:flex-col'}>
        <div className="max-w-7xl mx-auto w-full lg:flex-1">
          <Routes>
            <Route
              path="/"
              element={
                token ? (
                  <ProtectedRoute module="laboratory">
                    <Navigate to="/laboratory/dashboard" replace />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/laboratory/login" replace />
                )
              }
            />
            <Route path="/login" element={<DoctorLogin />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/request-orders"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryRequestOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/available-tests"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryAvailableTests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/available-tests/add"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryAddTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/available-tests/edit/:testId"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryAddTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-reports"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryTestReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-reports/add/:orderId"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryAddReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryPatients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/orders"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryPatientOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-statistics"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryPatientStatistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-details"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryPatientDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryWallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet/balance"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryWalletBalance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet/earning"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryWalletEarning />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet/withdraw"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryWalletWithdraw />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet/transaction"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryWalletTransaction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratorySupport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute module="laboratory">
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryPrivacyPolicy />
                </ProtectedRoute>
              }
            />
            <Route
              path="/terms-of-service"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryTermsOfService />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab-guidelines"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryLabGuidelines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faq"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryFAQ />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hipaa-compliance"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryHIPAACompliance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-protection"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryDataProtection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab-accreditation"
              element={
                <ProtectedRoute module="laboratory">
                  <LaboratoryLabAccreditation />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <Navigate to={token ? "/laboratory/dashboard" : "/laboratory/login"} replace />
              }
            />
          </Routes>
        </div>
      </main>
      
      {/* Desktop Footer - Only visible on desktop */}
      {!isLoginPage && <LaboratoryFooter />}
    </NotificationProvider>
  )
}

function NurseRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/nurse/login' || location.pathname === '/nurse/signup'
  
  return (
    <NotificationProvider module="nurse">
      {/* Mobile Navbar - Only visible on mobile/tablet */}
      {!isLoginPage && <NurseNavbar />}
      
      {/* Desktop Header - Only visible on desktop */}
      {!isLoginPage && <NurseHeader />}
      
      <main className={isLoginPage ? '' : 'px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-8 lg:min-h-screen lg:flex lg:flex-col'}>
        <div className="max-w-7xl mx-auto w-full lg:flex-1">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/nurse/dashboard" replace />}
            />
            <Route
              path="/dashboard"
              element={<NurseDashboard />}
            />
            <Route
              path="/booking"
              element={<NurseBookings />}
            />
            <Route
              path="/transactions"
              element={<NurseTransactions />}
            />
            <Route
              path="/wallet"
              element={<NurseWallet />}
            />
            <Route
              path="/wallet/balance"
              element={<NurseWalletBalance />}
            />
            <Route
              path="/wallet/earning"
              element={<NurseWalletEarning />}
            />
            <Route
              path="/wallet/withdraw"
              element={<NurseWalletWithdraw />}
            />
            <Route
              path="/wallet/transaction"
              element={<NurseWalletTransaction />}
            />
            <Route
              path="/support"
              element={<NurseSupport />}
            />
            <Route
              path="/profile"
              element={<NurseProfile />}
            />
            <Route
              path="/notifications"
              element={<NotificationsPage />}
            />
            <Route
              path="/login"
              element={
                <div className="flex items-center justify-center min-h-screen">
                  <p className="text-slate-600">Nurse Login - Coming Soon</p>
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/nurse/dashboard" replace />} />
          </Routes>
        </div>
      </main>
      
      {/* Desktop Footer - Only visible on desktop */}
      {!isLoginPage && <NurseFooter />}
    </NotificationProvider>
  )
}

function WebsiteRoutes() {
  return (
    <>
      <WebNavbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </>
  )
}

function DefaultRedirect() {
  const patientToken = getAuthToken('patient')
  const doctorToken = getAuthToken('doctor')
  const pharmacyToken = getAuthToken('pharmacy')
  const laboratoryToken = getAuthToken('laboratory')
  const adminToken = getAuthToken('admin')
  
  // If authenticated, redirect to respective dashboard
  if (patientToken) {
    return <Navigate to="/patient/dashboard" replace />
  }
  if (doctorToken) {
    return <Navigate to="/doctor/dashboard" replace />
  }
  if (pharmacyToken) {
    return <Navigate to="/pharmacy/dashboard" replace />
  }
  if (laboratoryToken) {
    return <Navigate to="/laboratory/dashboard" replace />
  }
  if (adminToken) {
    return <Navigate to="/admin/dashboard" replace />
  }
  
  // Default to landing page for unauthenticated users
  return (
    <>
      <WebNavbar />
      <main>
        <Home />
      </main>
    </>
  )
}

function App() {
  return (
    <CallProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Routes>
            {/* Patient Routes */}
            <Route path="/patient/*" element={<PatientRoutes />} />

            {/* Doctor Routes */}
            <Route path="/doctor/*" element={<DoctorRoutes />} />
            <Route path="/nurse/*" element={<NurseRoutes />} />

            {/* Pharmacy Routes */}
            <Route
              path="/pharmacy/*"
              element={
                <PharmacySidebarProvider>
                  <PharmacyRoutes />
                </PharmacySidebarProvider>
              }
            />

            {/* Laboratory Routes */}
            <Route path="/laboratory/*" element={<LaboratoryRoutes />} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={<AdminRoutes />} />

            {/* Website Routes - Landing Page */}
            <Route path="/website/*" element={<WebsiteRoutes />} />

            {/* Onboarding Route - No Navbar */}
            <Route path="/onboarding" element={<WebOnBoarding />} />

            {/* Default route - show landing page or redirect if authenticated */}
            <Route path="/" element={<DefaultRedirect />} />
          </Routes>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </CallProvider>
  )
}

export default App
