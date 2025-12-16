import apiClient from '../../../utils/apiClient'

/**
 * Request OTP for nurse login
 * @param {string} phone - Phone number
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
export const requestLoginOtp = async (phone) => {
  try {
    const response = await apiClient.post('/nurses/auth/request-otp', { phone })
    return response.data
  } catch (error) {
    console.error('Error requesting OTP:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send OTP. Please try again.',
    }
  }
}

/**
 * Login nurse with OTP
 * @param {Object} credentials - { phone, otp }
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
export const loginNurse = async (credentials) => {
  try {
    const response = await apiClient.post('/nurses/auth/login', credentials)
    return response.data
  } catch (error) {
    console.error('Error logging in:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed. Please check your credentials.',
    }
  }
}

/**
 * Signup new nurse
 * @param {Object} signupData - Nurse signup data
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
export const signupNurse = async (signupData) => {
  try {
    const response = await apiClient.post('/nurses/auth/signup', signupData)
    return response.data
  } catch (error) {
    console.error('Error signing up:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Signup failed. Please try again.',
    }
  }
}

/**
 * Store nurse tokens in storage
 * @param {Object} tokens - { accessToken, refreshToken }
 * @param {boolean} remember - Whether to use localStorage or sessionStorage
 */
export const storeNurseTokens = (tokens, remember = true) => {
  const storage = remember ? localStorage : sessionStorage
  if (tokens.accessToken) {
    storage.setItem('nurseAccessToken', tokens.accessToken)
  }
  if (tokens.refreshToken) {
    storage.setItem('nurseRefreshToken', tokens.refreshToken)
  }
  if (tokens.token) {
    storage.setItem('nurseAuthToken', tokens.token)
  }
}

/**
 * Clear nurse tokens from storage
 */
export const clearNurseTokens = () => {
  localStorage.removeItem('nurseAuthToken')
  localStorage.removeItem('nurseAccessToken')
  localStorage.removeItem('nurseRefreshToken')
  sessionStorage.removeItem('nurseAuthToken')
  sessionStorage.removeItem('nurseAccessToken')
  sessionStorage.removeItem('nurseRefreshToken')
}

/**
 * Logout nurse
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const logoutNurse = async () => {
  try {
    await apiClient.post('/nurses/auth/logout')
    clearNurseTokens()
    return { success: true, message: 'Logged out successfully' }
  } catch (error) {
    console.error('Error logging out:', error)
    clearNurseTokens()
    return { success: true, message: 'Logged out successfully' }
  }
}

