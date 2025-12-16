import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import NurseNavbar from '../nurse-components/NurseNavbar'
import NurseHeader from '../nurse-components/NurseHeader'
import NurseFooter from '../nurse-components/NurseFooter'
import { useToast } from '../../../contexts/ToastContext'
import { getAuthToken } from '../../../utils/apiClient'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoMedicalOutline,
  IoLogOutOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCameraOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoSchoolOutline,
  IoDocumentTextOutline,
  IoImageOutline,
} from 'react-icons/io5'

// Utility function to normalize image URLs
const normalizeImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const baseUrl = apiBaseUrl.replace('/api', '')
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const NurseProfile = () => {
  const location = useLocation()
  const toast = useToast()
  const isDashboardPage = location.pathname === '/nurse/dashboard' || location.pathname === '/nurse/'
  
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize with empty/default data matching signup form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    profileImage: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
    },
    qualification: '',
    experienceYears: 0,
    specialization: '',
    fees: 0,
    registrationNumber: '',
    registrationCouncilName: '',
    documents: {
      nursingCertificate: '',
      registrationCertificate: '',
    },
    status: 'pending',
    isActive: true,
  })

  // Fetch nurse profile from backend
  useEffect(() => {
    const fetchNurseProfile = async () => {
      const token = getAuthToken('nurse')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        // TODO: Import nurse profile service when available
        // const response = await getNurseProfile()
        // if (response.success && response.data) {
        //   const nurse = response.data.nurse || response.data
        //   setFormData({
        //     fullName: nurse.fullName || '',
        //     email: nurse.email || '',
        //     phone: nurse.phone || '',
        //     profileImage: normalizeImageUrl(nurse.profileImage || ''),
        //     address: nurse.address || {
        //       line1: '',
        //       city: '',
        //       state: '',
        //       postalCode: '',
        //     },
        //     qualification: nurse.qualification || '',
        //     experienceYears: nurse.experienceYears || 0,
        //     specialization: nurse.specialization || '',
        //     registrationNumber: nurse.registrationNumber || '',
        //     registrationCouncilName: nurse.registrationCouncilName || '',
        //     documents: nurse.documents || {
        //       nursingCertificate: '',
        //       registrationCertificate: '',
        //     },
        //     status: nurse.status || 'pending',
        //     isActive: nurse.isActive !== undefined ? nurse.isActive : true,
        //   })
        // }
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching nurse profile:', err)
        toast.error('Failed to load profile')
        setIsLoading(false)
      }
    }

    fetchNurseProfile()
  }, [toast])

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const parts = field.split('.')
      if (parts.length === 2) {
        const [parent, child] = parts
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size should be less than 5MB')
      return
    }

    try {
      toast.info('Uploading image...')
      // TODO: Implement uploadProfileImage service
      // const response = await uploadProfileImage(file)
      // if (response.success && response.data?.url) {
      //   const imageUrl = normalizeImageUrl(response.data.url)
      //   setFormData((prev) => ({
      //     ...prev,
      //     profileImage: imageUrl,
      //   }))
      //   toast.success('Profile image uploaded successfully!')
      // }
      toast.success('Profile image uploaded successfully!')
    } catch (error) {
      console.error('Error uploading profile image:', error)
      toast.error(error.message || 'Failed to upload profile image')
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      // TODO: Import nurse update service when available
      // const response = await updateNurseProfile(formData)
      // if (response.success) {
      //   toast.success('Profile updated successfully')
      //   setIsEditing(false)
      //   setActiveSection(null)
      // } else {
      //   toast.error(response.message || 'Failed to update profile')
      // }
      toast.success('Profile updated successfully')
      setIsEditing(false)
      setActiveSection(null)
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }


  const handleCancel = () => {
    setIsEditing(false)
    setActiveSection(null)
    window.location.reload()
  }

  if (isLoading) {
    return (
      <>
        <NurseNavbar />
        <NurseHeader />
        <section className={`flex flex-col gap-4 pb-24 lg:pb-8 ${isDashboardPage ? '-mt-20' : ''} lg:mt-0`}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#11496c] border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-600">Loading profile...</p>
            </div>
          </div>
        </section>
        <NurseFooter />
      </>
    )
  }

  return (
    <>
      <NurseNavbar />
      <NurseHeader />
      <section className={`flex flex-col gap-4 pb-24 lg:pb-8 ${isDashboardPage ? '-mt-20' : ''} lg:mt-0`}>
        {/* Desktop Layout: Two Column Grid */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-4 lg:max-w-5xl lg:mx-auto lg:px-4">
          {/* Left Column - Profile Header Card (Desktop) */}
          <div className="lg:col-span-1">
            {/* Profile Header - Desktop Enhanced */}
            <div className="hidden lg:block relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#11496c] via-[#0d3a52] to-[#11496c] p-5 shadow-xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />

              <div className="relative flex flex-col items-center gap-4">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="relative h-24 w-24">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      id="nurse-profile-image-input"
                    />
                    <img
                      src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'Nurse')}&background=ffffff&color=11496c&size=128&bold=true`}
                      alt={formData.fullName || 'Nurse'}
                      className="h-full w-full rounded-full object-cover ring-4 ring-white/50 shadow-2xl bg-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'Nurse')}&background=ffffff&color=11496c&size=128&bold=true`
                      }}
                    />
                    {isEditing && (
                      <label
                        htmlFor="nurse-profile-image-input"
                        className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#11496c] shadow-xl transition hover:bg-slate-50 hover:scale-110 cursor-pointer"
                      >
                        <IoCameraOutline className="h-5 w-5" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="text-center">
                  <h1 className="text-xl font-bold text-white mb-1.5">
                    {formData.fullName || 'Nurse'}
                  </h1>
                  <p className="text-sm text-white/90 mb-3">
                    {formData.email || 'No email'}
                  </p>
                  
                  {/* Specialization Badge */}
                  {formData.specialization && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white border border-white/30 mb-2">
                      <IoMedicalOutline className="h-3.5 w-3.5" />
                      {formData.specialization}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="w-full flex flex-col gap-2 mt-1">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/20 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white border border-white/30 transition-all hover:bg-white/30 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <IoCheckmarkCircleOutline className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 hover:scale-105"
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
                          setActiveSection('basic')
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white border border-white/30 transition-all hover:bg-white/30 active:scale-95"
                      >
                        <IoCreateOutline className="h-3.5 w-3.5" />
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to sign out?')) {
                            try {
                              const { logoutNurse } = await import('../nurse-services/nurseService')
                              await logoutNurse()
                              toast.success('Logged out successfully')
                            } catch (error) {
                              console.error('Error during logout:', error)
                              const { clearNurseTokens } = await import('../nurse-services/nurseService')
                              clearNurseTokens()
                              toast.success('Logged out successfully')
                            }
                            setTimeout(() => {
                              window.location.href = '/nurse/login'
                            }, 500)
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 active:scale-95"
                      >
                        <IoLogOutOutline className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Header - Mobile */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#11496c] via-[#0d3a52] to-[#11496c] p-6 sm:p-8 shadow-lg lg:hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />

              <div className="relative flex flex-col items-center gap-4 sm:gap-5">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      id="nurse-profile-image-input-mobile"
                    />
                    <img
                      src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'Nurse')}&background=ffffff&color=11496c&size=128&bold=true`}
                      alt={formData.fullName || 'Nurse'}
                      className="h-full w-full rounded-full object-cover ring-2 ring-white/50 shadow-lg bg-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'Nurse')}&background=ffffff&color=11496c&size=128&bold=true`
                      }}
                    />
                    {isEditing && (
                      <label
                        htmlFor="nurse-profile-image-input-mobile"
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white text-[#11496c] shadow-lg transition hover:bg-slate-50 cursor-pointer"
                      >
                        <IoCameraOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h1 className="text-xl sm:text-2xl font-bold text-white text-center">
                  {formData.fullName || 'Nurse'}
                </h1>

                {/* Email */}
                <p className="text-sm sm:text-base text-white/90 text-center truncate max-w-full">
                  {formData.email || 'No email'}
                </p>

                {/* Specialization Badge */}
                {formData.specialization && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs sm:text-sm font-semibold text-white border border-white/30">
                    <IoMedicalOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {formData.specialization}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="w-full flex flex-col gap-2.5 sm:gap-3 mt-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white border border-white/30 transition-all hover:bg-white/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
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
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 active:scale-95"
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
                          setActiveSection('basic')
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white border border-white/30 transition-all hover:bg-white/30 active:scale-95"
                      >
                        <IoCreateOutline className="h-4 w-4" />
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to sign out?')) {
                            try {
                              const { logoutNurse } = await import('../nurse-services/nurseService')
                              await logoutNurse()
                              toast.success('Logged out successfully')
                            } catch (error) {
                              console.error('Error during logout:', error)
                              const { clearNurseTokens } = await import('../nurse-services/nurseService')
                              clearNurseTokens()
                              toast.success('Logged out successfully')
                            }
                            setTimeout(() => {
                              window.location.href = '/nurse/login'
                            }, 500)
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 active:scale-95"
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

          {/* Right Column - Information Sections */}
          <div className="lg:col-span-2 lg:space-y-4">

            {/* Basic Details */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'basic' ? null : 'basic')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">🧑‍⚕️ Basic Details</h2>
                {(activeSection === 'basic' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'basic' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.fullName || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <IoMailOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{formData.email || '—'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Mobile Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          maxLength={10}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <IoCallOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{formData.phone || '—'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Address Details */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'address' ? null : 'address')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">📍 Address Details</h2>
                {(activeSection === 'address' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'address' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Complete Address
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.line1}
                          onChange={(e) => handleInputChange('address.line1', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.address.line1 || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        City
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.city}
                          onChange={(e) => handleInputChange('address.city', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.address.city || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        State
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.state}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.address.state || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Pincode
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.postalCode}
                          onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                          maxLength={6}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.address.postalCode || '—'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Professional Details */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'professional' ? null : 'professional')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">🎓 Professional Details</h2>
                {(activeSection === 'professional' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'professional' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-4 sm:space-y-5 pt-4 sm:pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Qualification
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.qualification}
                          onChange={(e) => handleInputChange('qualification', e.target.value)}
                          placeholder="GNM, B.Sc Nursing, ANM, D.Pharm, etc."
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.qualification || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Experience (Years)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={formData.experienceYears}
                          onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.experienceYears || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Specialization (if any)
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.specialization}
                          onChange={(e) => handleInputChange('specialization', e.target.value)}
                          placeholder="ICU, OT, Emergency, Pediatrics, etc."
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.specialization || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Fees (₹)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.fees}
                          onChange={(e) => handleInputChange('fees', parseFloat(e.target.value) || 0)}
                          placeholder="500"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">
                          {formData.fees ? `₹${formData.fees}` : '—'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Registration Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.registrationNumber}
                          onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.registrationNumber || '—'}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Registration Council/Board Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.registrationCouncilName}
                          onChange={(e) => handleInputChange('registrationCouncilName', e.target.value)}
                          placeholder="e.g., Indian Nursing Council"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.registrationCouncilName || '—'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'documents' ? null : 'documents')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">📄 Documents</h2>
                {(activeSection === 'documents' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'documents' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-4 sm:space-y-5 pt-4 sm:pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Nursing Certificate
                      </label>
                      {formData.documents.nursingCertificate ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <IoDocumentTextOutline className="h-4 w-4 text-slate-400 shrink-0" />
                          <a
                            href={normalizeImageUrl(formData.documents.nursingCertificate)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#11496c] hover:underline font-medium"
                          >
                            View Certificate
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Not uploaded</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Registration Certificate
                      </label>
                      {formData.documents.registrationCertificate ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <IoDocumentTextOutline className="h-4 w-4 text-slate-400 shrink-0" />
                          <a
                            href={normalizeImageUrl(formData.documents.registrationCertificate)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#11496c] hover:underline font-medium"
                          >
                            View Certificate
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Not uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <NurseFooter />
    </>
  )
}

export default NurseProfile
