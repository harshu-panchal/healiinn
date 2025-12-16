import { useState, useEffect, useRef } from 'react'
import { getPatientProfile, updatePatientProfile, uploadProfileImage } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'
import { getAuthToken } from '../../../utils/apiClient'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoPulseOutline,
  IoMedicalOutline,
  IoWarningOutline,
  IoNotificationsOutline,
  IoShieldCheckmarkOutline,
  IoLogOutOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCameraOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoHelpCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5'

// Mock data removed - using real backend data now

const PatientProfile = () => {
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef(null)
  const [newAllergy, setNewAllergy] = useState('')
  
  // Initialize with empty/default data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    profileImage: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    emergencyContact: {
      name: '',
      phone: '',
      relation: '',
    },
    allergies: [],
  })

  // Fetch patient profile from backend
  useEffect(() => {
    const fetchPatientProfile = async () => {
      const token = getAuthToken('patient')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Try to load from cache first for faster initial render
        const storage = localStorage.getItem('patientAuthToken') ? localStorage : sessionStorage
        const cachedProfile = JSON.parse(storage.getItem('patientProfile') || '{}')
        if (Object.keys(cachedProfile).length > 0) {
          // Set initial form data from cache
          const cachedData = {
            firstName: cachedProfile.firstName || '',
            lastName: cachedProfile.lastName || '',
            email: cachedProfile.email || '',
            phone: cachedProfile.phone || '',
            dateOfBirth: cachedProfile.dateOfBirth 
              ? (cachedProfile.dateOfBirth.includes('T') 
                  ? cachedProfile.dateOfBirth.split('T')[0] 
                  : cachedProfile.dateOfBirth)
              : '',
            gender: cachedProfile.gender || '',
            bloodGroup: cachedProfile.bloodGroup || '',
            profileImage: cachedProfile.profileImage || '',
            address: cachedProfile.address || {
              line1: '',
              line2: '',
              city: '',
              state: '',
              postalCode: '',
              country: '',
            },
            emergencyContact: cachedProfile.emergencyContact || {
              name: '',
              phone: '',
              relation: '',
            },
            allergies: Array.isArray(cachedProfile.allergies) ? cachedProfile.allergies : [],
          }
          setFormData(cachedData)
        }

        // Then fetch fresh data from backend
        const response = await getPatientProfile()
        if (response.success && response.data) {
          const patient = response.data.patient || response.data
          
          // Transform backend data to frontend format
          const transformedData = {
            firstName: patient.firstName || '',
            lastName: patient.lastName || '',
            email: patient.email || '',
            phone: patient.phone || '',
            dateOfBirth: patient.dateOfBirth 
              ? (patient.dateOfBirth.includes('T') 
                  ? patient.dateOfBirth.split('T')[0] 
                  : patient.dateOfBirth)
              : '',
            gender: patient.gender || '',
            bloodGroup: patient.bloodGroup || '',
            profileImage: patient.profileImage || '',
            address: patient.address || {
              line1: '',
              line2: '',
              city: '',
              state: '',
              postalCode: '',
              country: '',
            },
            emergencyContact: patient.emergencyContact || {
              name: '',
              phone: '',
              relation: '',
            },
            allergies: Array.isArray(patient.allergies) ? patient.allergies : [],
          }
          
          setFormData(transformedData)
          
          // Update cache
          const storage = localStorage.getItem('patientAuthToken') ? localStorage : sessionStorage
          storage.setItem('patientProfile', JSON.stringify(patient))
        }
      } catch (error) {
        console.error('Error fetching patient profile:', error)
        toast.error('Failed to load profile data. Please refresh the page.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatientProfile()
  }, [toast])

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const formatAddress = (address) => {
    if (!address) return '—'
    const parts = [
      address.line1,
      address.line2,
      [address.city, address.state].filter(Boolean).join(', '),
      address.postalCode,
      address.country,
    ].filter(Boolean)
    return parts.join(', ') || '—'
  }

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleSave = async () => {
    const token = getAuthToken('patient')
    if (!token) {
      toast.error('Please login to save profile')
      return
    }

    try {
      setIsSaving(true)
      
      // Prepare data for backend (match backend expected format)
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        profileImage: formData.profileImage,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        allergies: formData.allergies,
      }

      const response = await updatePatientProfile(updateData)
      
      if (response.success) {
        // Update cache
        const storage = localStorage.getItem('patientAuthToken') ? localStorage : sessionStorage
        storage.setItem('patientProfile', JSON.stringify(response.data?.patient || response.data))
        
        toast.success('Profile updated successfully!')
        setNewAllergy('')
        setIsEditing(false)
        setActiveSection(null)
      } else {
        toast.error(response.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error(error.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    // Reload original data from backend
    try {
      const response = await getPatientProfile()
      if (response.success && response.data) {
        const patient = response.data.patient || response.data
        const transformedData = {
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          email: patient.email || '',
          phone: patient.phone || '',
          dateOfBirth: patient.dateOfBirth 
            ? (patient.dateOfBirth.includes('T') 
                ? patient.dateOfBirth.split('T')[0] 
                : patient.dateOfBirth)
            : '',
          gender: patient.gender || '',
          bloodGroup: patient.bloodGroup || '',
          profileImage: patient.profileImage || '',
          address: patient.address || {
            line1: '',
            line2: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          },
          emergencyContact: patient.emergencyContact || {
            name: '',
            phone: '',
            relation: '',
          },
          allergies: Array.isArray(patient.allergies) ? patient.allergies : [],
        }
        setFormData(transformedData)
      }
    } catch (error) {
      console.error('Error reloading profile:', error)
      toast.error('Failed to reload profile data')
    }
    setNewAllergy('')
    setIsEditing(false)
    setActiveSection(null)
  }

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size should be less than 5MB')
      return
    }

    try {
      toast.info('Uploading image...')
      const response = await uploadProfileImage(file)
      
      if (response.success && response.data?.url) {
        // Get base URL without /api for static file serving
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
        const baseUrl = apiBaseUrl.replace('/api', '').replace(/\/$/, '')
        const imageUrl = response.data.url.startsWith('http') 
          ? response.data.url 
          : `${baseUrl}${response.data.url.startsWith('/') ? response.data.url : `/${response.data.url}`}`
        
        setFormData((prev) => ({
          ...prev,
          profileImage: imageUrl,
        }))
        toast.success('Profile image uploaded successfully!')
      }
    } catch (error) {
      console.error('Error uploading profile image:', error)
      toast.error(error.message || 'Failed to upload profile image')
    } finally {
      // Reset input value to allow selecting the same file again
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleProfileImageClick = () => {
    fileInputRef.current?.click()
  }

  // Profile image loading is now handled in the main fetchPatientProfile useEffect

  // Show loading state
  if (isLoading) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#11496c] border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-600">Loading profile...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-[#11496c] via-[#11496c] to-[#0d3a52] px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
          
          <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-4">
            {/* Profile Image */}
            <div className="relative shrink-0">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                  aria-label="Upload profile picture"
                />
                <img
                  src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent((formData.firstName + ' ' + formData.lastName).trim() || 'Patient')}&background=11496c&color=fff&size=128&bold=true`}
                  alt={`${formData.firstName} ${formData.lastName}`}
                  className="h-full w-full rounded-full object-cover ring-4 ring-white/20 shadow-xl bg-white/10"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((formData.firstName + ' ' + formData.lastName).trim() || 'Patient')}&background=11496c&color=fff&size=128&bold=true`
                  }}
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleProfileImageClick}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-[#11496c] shadow-lg transition hover:scale-110"
                    aria-label="Change profile picture"
                  >
                    <IoCameraOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {formData.firstName || formData.lastName 
                  ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
                  : 'Patient'}
              </h1>
              <p className="text-sm sm:text-base text-white/90 mb-3">{formData.email}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white border border-white/30">
                  <IoPulseOutline className="h-3.5 w-3.5" />
                  {formData.bloodGroup || 'Not set'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white border border-white/30">
                  <IoPersonOutline className="h-3.5 w-3.5" />
                  {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not set'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 rounded-lg bg-white text-[#11496c] px-4 py-2.5 text-sm font-semibold shadow-lg transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#11496c] border-r-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <IoCheckmarkCircleOutline className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-4 py-2.5 text-sm font-semibold transition hover:bg-white/20 active:scale-95"
                  >
                    <IoCloseOutline className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true)
                      setActiveSection('personal')
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg bg-white text-[#11496c] px-4 py-2.5 text-sm font-semibold shadow-lg transition-all hover:bg-white/90 active:scale-95"
                  >
                    <IoCreateOutline className="h-4 w-4" />
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to sign out?')) {
                        try {
                          // Import logout function from patientService
                          const { logoutPatient } = await import('../patient-services/patientService')
                          await logoutPatient()
                          toast.success('Logged out successfully')
                        } catch (error) {
                          console.error('Error during logout:', error)
                          // Clear tokens manually if API call fails
                          const { clearPatientTokens } = await import('../patient-services/patientService')
                          clearPatientTokens()
                          toast.success('Logged out successfully')
                        }
                        // Navigate to login page
                        setTimeout(() => {
                          window.location.href = '/patient/login'
                        }, 500)
                      }
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-4 py-2.5 text-sm font-semibold transition hover:bg-white/20 active:scale-95"
                  >
                    <IoLogOutOutline className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Personal Information */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === 'personal' ? null : 'personal')}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                <IoPersonOutline className="h-5 w-5 text-[#11496c]" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Personal Information</h2>
            </div>
            {activeSection === 'personal' || isEditing ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {(activeSection === 'personal' || isEditing) && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-slate-100">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 py-2.5">{formData.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 py-2.5">{formData.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-slate-600 py-2.5">
                      <IoCalendarOutline className="h-4 w-4 text-slate-400" />
                      <span>{formatDate(formData.dateOfBirth)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-slate-900 py-2.5">
                      {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Blood Group
                </label>
                {isEditing ? (
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-600 py-2.5">
                    <IoPulseOutline className="h-4 w-4 text-slate-400" />
                    <span>{formData.bloodGroup || 'Not set'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === 'contact' ? null : 'contact')}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                <IoCallOutline className="h-5 w-5 text-[#11496c]" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Contact Information</h2>
            </div>
            {activeSection === 'contact' || isEditing ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {(activeSection === 'contact' || isEditing) && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-slate-100">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-600 py-2.5">
                    <IoMailOutline className="h-4 w-4 text-slate-400" />
                    <span>{formData.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-600 py-2.5">
                    <IoCallOutline className="h-4 w-4 text-slate-400" />
                    <span>{formData.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Address
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={formData.address?.line1 || ''}
                      onChange={(e) => handleInputChange('address.line1', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={formData.address?.line2 || ''}
                      onChange={(e) => handleInputChange('address.line2', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={formData.address?.city || ''}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={formData.address?.state || ''}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={formData.address?.postalCode || ''}
                        onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={formData.address?.country || ''}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm text-slate-600 py-2.5">
                    <IoLocationOutline className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                    <span>{formatAddress(formData.address)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Medical Information */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === 'medical' ? null : 'medical')}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                <IoMedicalOutline className="h-5 w-5 text-[#11496c]" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Medical Information</h2>
            </div>
            {activeSection === 'medical' || isEditing ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {(activeSection === 'medical' || isEditing) && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-slate-100">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Allergies
                </label>
                {formData.allergies && formData.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-100"
                      >
                        <IoWarningOutline className="h-3.5 w-3.5" />
                        {allergy}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedAllergies = formData.allergies.filter((_, i) => i !== index)
                              setFormData({ ...formData, allergies: updatedAllergies })
                            }}
                            className="ml-1.5 hover:bg-red-100 rounded-full p-0.5 transition-colors"
                            aria-label="Remove allergy"
                          >
                            <IoCloseOutline className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  !isEditing && <p className="text-sm text-slate-500 py-2.5 mb-3">No allergies recorded</p>
                )}
                
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newAllergy.trim()) {
                          e.preventDefault()
                          const trimmedAllergy = newAllergy.trim()
                          if (!formData.allergies.includes(trimmedAllergy)) {
                            setFormData({
                              ...formData,
                              allergies: [...formData.allergies, trimmedAllergy]
                            })
                            setNewAllergy('')
                          } else {
                            toast.error('This allergy is already added')
                            setNewAllergy('')
                          }
                        }
                      }}
                      placeholder="Add allergy (press Enter)"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-1 focus:ring-[#11496c]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newAllergy.trim()) {
                          const trimmedAllergy = newAllergy.trim()
                          if (!formData.allergies.includes(trimmedAllergy)) {
                            setFormData({
                              ...formData,
                              allergies: [...formData.allergies, trimmedAllergy]
                            })
                            setNewAllergy('')
                          } else {
                            toast.error('This allergy is already added')
                            setNewAllergy('')
                          }
                        }
                      }}
                      className="px-4 py-2 bg-[#11496c] text-white rounded-lg text-sm font-semibold hover:bg-[#0d3a52] transition-colors active:scale-95"
                    >
                      Add
                    </button>
                          </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === 'emergency' ? null : 'emergency')}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                <IoShieldCheckmarkOutline className="h-5 w-5 text-[#11496c]" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Emergency Contact</h2>
            </div>
            {activeSection === 'emergency' || isEditing ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {(activeSection === 'emergency' || isEditing) && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-slate-100">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.emergencyContact?.name || ''}
                      onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 py-2.5">
                      {formData.emergencyContact?.name || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Relation
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.emergencyContact?.relation || ''}
                      onChange={(e) => handleInputChange('emergencyContact.relation', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 py-2.5">
                      {formData.emergencyContact?.relation || 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.emergencyContact?.phone || ''}
                    onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-600 py-2.5">
                    <IoCallOutline className="h-4 w-4 text-slate-400" />
                    <span>{formData.emergencyContact?.phone || 'Not set'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Support History */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === 'support' ? null : 'support')}
            className="w-full flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#11496c]/10">
                <IoHelpCircleOutline className="h-5 w-5 text-[#11496c]" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Support History</h2>
            </div>
            {activeSection === 'support' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'support' && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 border-t border-slate-100 pt-4 sm:pt-5">
              <SupportHistory role="patient" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// Support History Component
const SupportHistory = ({ role }) => {
  const [supportRequests, setSupportRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const fetchSupportHistory = async () => {
      try {
        setLoading(true)
        const { getSupportHistory } = await import('../patient-services/patientService')
        const response = await getSupportHistory()
        
        if (response.success && response.data) {
          const items = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || []
          setSupportRequests(items)
        }
      } catch (error) {
        console.error('Error fetching support history:', error)
        setSupportRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchSupportHistory()
  }, [role])

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
      closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm font-medium text-slate-600">Loading support history...</p>
      </div>
    )
  }

  if (supportRequests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm font-medium text-slate-600">No support requests yet</p>
        <p className="mt-1 text-xs text-slate-500">Your support request history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {supportRequests.map((request) => (
        <div key={request._id || request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 mb-1">{request.subject || 'Support Request'}</p>
              <p className="text-sm font-medium text-slate-700">{request.message || request.note || ''}</p>
            </div>
            {getStatusBadge(request.status)}
          </div>
          {request.adminResponse && (
            <div className="mt-2 rounded bg-blue-50 p-2">
              <p className="text-xs font-semibold text-blue-900">Admin Response:</p>
              <p className="mt-1 text-xs text-blue-800">{request.adminResponse}</p>
            </div>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
            <span>Submitted: {formatDate(request.createdAt)}</span>
            {request.updatedAt && request.updatedAt !== request.createdAt && (
              <span>Updated: {formatDate(request.updatedAt)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default PatientProfile
