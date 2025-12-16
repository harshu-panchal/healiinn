import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { signupAdmin, loginAdmin, storeAdminTokens, checkAdminExists } from '../admin-services/adminService'
import { useToast } from '../../../contexts/ToastContext'
import { getAuthToken } from '../../../utils/apiClient'
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
  IoPersonOutline,
  IoCallOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'

const AdminLogin = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const isLogin = mode === 'login'
  
  // Admin existence check
  const [adminExists, setAdminExists] = useState(false)

  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '', remember: true })
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginErrors, setLoginErrors] = useState({})

  // Signup state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    registrationCode: '',
    isSuperAdmin: false,
  })
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirm, setShowSignupConfirm] = useState(false)
  const [showRegistrationCode, setShowRegistrationCode] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [signupErrors, setSignupErrors] = useState({})

  // Check if admin exists on component mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const result = await checkAdminExists()
        if (result.success) {
          const exists = result.data.adminExists
          setAdminExists(exists)
          // If admin exists, force login mode
          if (exists) {
            setMode('login')
          }
        }
      } catch (error) {
        console.error('Error checking admin:', error)
        // On error, assume admin exists to be safe
        setAdminExists(true)
        setMode('login')
      }
    }
    checkAdmin()
  }, [])

  // Check if user is already authenticated - redirect to dashboard
  // This check must be AFTER all hooks are called
  const token = getAuthToken('admin')
  if (token) {
    return <Navigate to="/admin/dashboard" replace />
  }

  const handleModeChange = (nextMode) => {
    // Prevent switching to signup if admin already exists
    if (nextMode === 'signup' && adminExists) {
      toast.warning('Admin account already exists. Please use login instead.')
      return
    }
    setMode(nextMode)
    setIsLoggingIn(false)
    setIsSigningUp(false)
    setLoginErrors({})
    setSignupErrors({})
    setShowLoginPassword(false)
    setShowSignupPassword(false)
    setShowSignupConfirm(false)
    setShowRegistrationCode(false)
  }

  // Login handlers
  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (loginErrors[name]) {
      setLoginErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateLogin = () => {
    const newErrors = {}
    if (!loginData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!loginData.password) {
      newErrors.password = 'Password is required'
    } else if (loginData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    setLoginErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    if (!validateLogin()) return

    setIsLoggingIn(true)
    try {
      const data = await loginAdmin({
        email: loginData.email,
        password: loginData.password,
      })

      // Store tokens and profile
      if (data.success && data.data?.tokens) {
        storeAdminTokens(data.data.tokens, loginData.remember)
        
        // Store admin profile
        if (data.data.admin) {
          const storage = loginData.remember ? localStorage : sessionStorage
          storage.setItem('adminProfile', JSON.stringify(data.data.admin))
        }
      }

      toast.success('Login successful! Redirecting to dashboard...')
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true })
      }, 500)
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.message || 'An error occurred. Please try again.'
      toast.error(errorMessage)
      setLoginErrors({ submit: errorMessage })
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Signup handlers
  const handleSignupChange = (event) => {
    const { name, value, type, checked } = event.target
    setSignupData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (signupErrors[name]) {
      setSignupErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // Restrict phone to 10 digits only
  const handlePhoneChange = (event) => {
    const numericValue = event.target.value.replace(/\D/g, '').slice(0, 10)
    setSignupData((prev) => ({
      ...prev,
      phone: numericValue,
    }))
    if (signupErrors.phone) {
      setSignupErrors((prev) => ({ ...prev, phone: '' }))
    }
  }

  const validateSignup = () => {
    const newErrors = {}
    if (!signupData.name || signupData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    if (!signupData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (signupData.phone && signupData.phone.length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits'
    }
    if (!signupData.password) {
      newErrors.password = 'Password is required'
    } else if (signupData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!signupData.registrationCode) {
      newErrors.registrationCode = 'Registration code is required'
    }
    setSignupErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()
    if (!validateSignup()) return

    setIsSigningUp(true)
    try {
      const payload = {
        name: signupData.name.trim(),
        email: signupData.email.trim(),
        password: signupData.password,
        registrationCode: signupData.registrationCode.trim(),
        ...(signupData.phone && { phone: signupData.phone }),
        ...(signupData.isSuperAdmin && { isSuperAdmin: true }),
      }

      const data = await signupAdmin(payload)

      // Store tokens and profile
      if (data.success && data.data?.tokens) {
        // Use remember from loginData (default true)
        storeAdminTokens(data.data.tokens, loginData.remember)
        
        // Store admin profile
        if (data.data.admin) {
          const storage = loginData.remember ? localStorage : sessionStorage
          storage.setItem('adminProfile', JSON.stringify(data.data.admin))
        }
      }

      toast.success('Admin account created successfully! Redirecting to dashboard...')
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true })
      }, 500)
    } catch (error) {
      console.error('Signup error:', error)
      const errorMessage = error.message || 'An error occurred. Please try again.'
      toast.error(errorMessage)
      setSignupErrors({ submit: errorMessage })
    } finally {
      setIsSigningUp(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-y-auto">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[rgba(17,73,108,0.08)] blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[rgba(17,73,108,0.06)] blur-3xl" />
      </div>

      {/* Main Content - Centered on mobile */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-4 sm:px-6 sm:py-6 min-h-screen">
        {/* Form Section - Centered with max width */}
        <div className="w-full max-w-md mx-auto">
          {/* Logo and Title */}
          <div className="mb-4 text-center">
            <div className="mb-2 flex justify-center">
              <img
                src={healinnLogo}
                alt="Healiinn"
                className="h-10 w-auto object-contain"
                loading="lazy"
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {isLogin ? 'Welcome Back' : 'Create Admin Account'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isLogin
                ? 'Sign in to your admin account to continue.'
                : 'Join Healiinn as an administrator to get started.'}
            </p>
          </div>

          {/* Login/Signup Mode Toggle */}
          <div className="mb-4 flex items-center justify-center">
            <div className="relative flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner w-full max-w-xs">
              {/* Sliding background indicator */}
              <motion.div
                layoutId="adminLoginSignupToggle"
                className="absolute rounded-xl bg-[#11496c] shadow-md shadow-[#11496c]/15"
                style={{
                  left: isLogin ? '0.375rem' : 'calc(50% + 0.1875rem)',
                  width: 'calc(50% - 0.5625rem)',
                  height: 'calc(100% - 0.75rem)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              />
              <motion.button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold text-center sm:py-3 sm:text-base ${
                  isLogin
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Sign In
              </motion.button>
              <motion.button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold text-center sm:py-3 sm:text-base ${
                  !isLogin
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Sign Up
              </motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="admin-login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-3 sm:gap-4"
                onSubmit={handleLoginSubmit}
              >
            {/* Email Field */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="login-email" className="text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoMailOutline className="h-4 w-4" aria-hidden="true" />
                    </span>
                <input
                      id="login-email"
                  name="email"
                  type="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                  autoComplete="email"
                  required
                      placeholder="admin@healiinn.com"
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 ${
                        loginErrors.email
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                      style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                />
              </div>
                  {loginErrors.email && (
                    <p className="text-xs text-red-600">{loginErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="login-password" className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoLockClosedOutline className="h-4 w-4" aria-hidden="true" />
                    </span>
                <input
                      id="login-password"
                  name="password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={handleLoginChange}
                  autoComplete="current-password"
                  required
                      placeholder="Enter your password"
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 ${
                        loginErrors.password
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                      style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                />
                <button
                  type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                      {showLoginPassword ? (
                    <IoEyeOffOutline className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <IoEyeOutline className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
                  {loginErrors.password && (
                    <p className="text-xs text-red-600">{loginErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600">
                <input
                      type="checkbox"
                  name="remember"
                  checked={loginData.remember}
                      onChange={handleLoginChange}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                />
                  Remember me
                </label>
              <button
                type="button"
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition text-xs"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Error */}
                {loginErrors.submit && (
                  <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                    {loginErrors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
                  disabled={isLoggingIn}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0d3a52] focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                  {isLoggingIn ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <IoArrowForwardOutline className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
              </motion.form>
            ) : (
              <motion.form
                key="admin-signup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-2.5 sm:gap-3"
                onSubmit={handleSignupSubmit}
              >
                {/* Name Field */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="signup-name" className="text-xs font-semibold text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoPersonOutline className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      value={signupData.name}
                      onChange={handleSignupChange}
                      autoComplete="name"
                      required
                      placeholder="John Doe"
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 ${
                        signupErrors.name
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                      style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                    />
                  </div>
                  {signupErrors.name && (
                    <p className="text-xs text-red-600">{signupErrors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="signup-email" className="text-xs font-semibold text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoMailOutline className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      autoComplete="email"
                      required
                      placeholder="admin@healiinn.com"
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 ${
                        signupErrors.email
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                      style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                    />
                  </div>
                  {signupErrors.email && (
                    <p className="text-xs text-red-600">{signupErrors.email}</p>
                  )}
                </div>

                {/* Phone Field (Optional) */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="signup-phone" className="text-xs font-semibold text-slate-700">
                    Phone Number <span className="text-slate-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoCallOutline className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      value={signupData.phone}
                      onChange={handlePhoneChange}
                      autoComplete="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      inputMode="numeric"
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 ${
                        signupErrors.phone
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                      style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                    />
                  </div>
                  {signupErrors.phone && (
                    <p className="text-xs text-red-600">{signupErrors.phone}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="signup-password" className="text-xs font-semibold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoLockClosedOutline className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      id="signup-password"
                      name="password"
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupData.password}
                      onChange={handleSignupChange}
                      autoComplete="new-password"
                      required
                      placeholder="At least 8 characters"
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 ${
                        signupErrors.password
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                      style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? (
                        <IoEyeOffOutline className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <IoEyeOutline className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {signupErrors.password && (
                    <p className="text-xs text-red-600">{signupErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="signup-confirm-password" className="text-xs font-semibold text-slate-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoLockClosedOutline className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showSignupConfirm ? 'text' : 'password'}
                      value={signupData.confirmPassword}
                      onChange={handleSignupChange}
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter your password"
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 ${
                        signupErrors.confirmPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                      style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirm(!showSignupConfirm)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showSignupConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showSignupConfirm ? (
                        <IoEyeOffOutline className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <IoEyeOutline className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {signupErrors.confirmPassword && (
                    <p className="text-xs text-red-600">{signupErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Registration Code Field */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="signup-registration-code" className="text-xs font-semibold text-slate-700">
                    Registration Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoShieldCheckmarkOutline className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      id="signup-registration-code"
                      name="registrationCode"
                      type={showRegistrationCode ? 'text' : 'password'}
                      value={signupData.registrationCode}
                      onChange={handleSignupChange}
                      required
                      placeholder="Enter admin registration code"
                      autoComplete="off"
                      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 ${
                        signupErrors.registrationCode
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : ''
                      }`}
                      style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegistrationCode(!showRegistrationCode)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showRegistrationCode ? 'Hide registration code' : 'Show registration code'}
                    >
                      {showRegistrationCode ? (
                        <IoEyeOffOutline className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <IoEyeOutline className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {signupErrors.registrationCode && (
                    <p className="text-xs text-red-600">{signupErrors.registrationCode}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Contact system administrator to obtain the registration code.
                  </p>
                </div>

                {/* Super Admin Checkbox */}
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      name="isSuperAdmin"
                      checked={signupData.isSuperAdmin}
                      onChange={handleSignupChange}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                    />
                    Create as Super Admin
                  </label>
                </div>

                {/* Submit Error */}
                {signupErrors.submit && (
                  <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                    {signupErrors.submit}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSigningUp}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0d3a52] focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSigningUp ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <IoArrowForwardOutline className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Security Notice */}
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-2.5">
            <IoShieldCheckmarkOutline className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-blue-800 leading-relaxed">
              This is a secure admin area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminLogin
