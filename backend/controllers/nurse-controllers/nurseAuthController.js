const Nurse = require('../../models/Nurse');
const asyncHandler = require('../../middleware/asyncHandler');
const { createAccessToken, createRefreshToken, verifyRefreshToken, blacklistToken, decodeToken } = require('../../utils/tokenService');
const { sendSignupAcknowledgementEmail } = require('../../services/emailService');
const { requestLoginOtp, verifyLoginOtp } = require('../../services/loginOtpService');
const { getProfileByRoleAndId, updateProfileByRoleAndId } = require('../../services/profileService');
const { notifyAdminsOfPendingSignup } = require('../../services/adminNotificationService');
const { ROLES, APPROVAL_STATUS } = require('../../utils/constants');
const { uploadFile } = require('../../services/fileUploadService');

const parseName = ({ fullName, firstName, lastName, name }) => {
  if (firstName) {
    return {
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : '',
    };
  }

  if (fullName || name) {
    const nameToParse = (fullName || name).trim();
    const parts = nameToParse.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    return {
      firstName: parts.shift(),
      lastName: parts.join(' '),
    };
  }

  return { firstName: undefined, lastName: undefined };
};

const buildAuthResponse = (user) => {
  const payload = { id: user._id, role: ROLES.NURSE };
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
};

exports.registerNurse = asyncHandler(async (req, res) => {
  const {
    fullName,
    name,
    firstName,
    lastName,
    email,
    phone,
    gender,
    address,
    qualification,
    experienceYears,
    specialization,
    fees,
    registrationNumber,
    registrationCouncilName,
    bio,
    nursingCertificate,
    registrationCertificate,
    profileImage,
  } = req.body;

  const resolvedName = parseName({ fullName, name, firstName, lastName });

  // Validate required fields
  if (!resolvedName.firstName || !email || !phone || !qualification || !registrationNumber || !registrationCouncilName) {
    return res.status(400).json({
      success: false,
      message: 'Required fields missing. Provide name/fullName/firstName, email, phone, qualification, registrationNumber, and registrationCouncilName.',
    });
  }

  // Validate address
  if (!address || !address.line1 || !address.city || !address.state || !address.postalCode) {
    return res.status(400).json({
      success: false,
      message: 'Complete address is required (line1, city, state, postalCode).',
    });
  }

  // Check for existing email
  const existingEmail = await Nurse.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  // Check for existing phone
  const existingPhone = await Nurse.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({ success: false, message: 'Phone number already registered.' });
  }

  // Check for existing registration number
  const existingRegistration = await Nurse.findOne({ registrationNumber });
  if (existingRegistration) {
    return res.status(400).json({ success: false, message: 'Registration number already registered.' });
  }

  // Handle file uploads if provided
  let nursingCertificateUrl = null;
  let registrationCertificateUrl = null;
  let profileImageUrl = null;

  // Handle multipart form data file uploads
  if (req.files) {
    if (req.files.nursingCertificate) {
      try {
        const uploadResult = await uploadFile(req.files.nursingCertificate, 'documents', 'nurse');
        nursingCertificateUrl = uploadResult.url;
      } catch (error) {
        console.error('Error uploading nursing certificate:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload nursing certificate.',
        });
      }
    }

    if (req.files.registrationCertificate) {
      try {
        const uploadResult = await uploadFile(req.files.registrationCertificate, 'documents', 'nurse');
        registrationCertificateUrl = uploadResult.url;
      } catch (error) {
        console.error('Error uploading registration certificate:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload registration certificate.',
        });
      }
    }

    if (req.files.profileImage) {
      try {
        const uploadResult = await uploadFile(req.files.profileImage, 'profiles', 'nurse');
        profileImageUrl = uploadResult.url;
      } catch (error) {
        console.error('Error uploading profile image:', error);
        // Don't fail registration if profile image fails
      }
    }
  }

  // Handle base64 or URL strings if provided in body
  if (nursingCertificate && !nursingCertificateUrl) {
    if (typeof nursingCertificate === 'string' && nursingCertificate.startsWith('http')) {
      nursingCertificateUrl = nursingCertificate;
    }
  }

  if (registrationCertificate && !registrationCertificateUrl) {
    if (typeof registrationCertificate === 'string' && registrationCertificate.startsWith('http')) {
      registrationCertificateUrl = registrationCertificate;
    }
  }

  if (profileImage && !profileImageUrl) {
    if (typeof profileImage === 'string' && profileImage.startsWith('http')) {
      profileImageUrl = profileImage;
    }
  }

  // Parse fees
  let feesValue = undefined;
  if (fees !== undefined && fees !== null && fees !== '') {
    const parsedFees = parseFloat(String(fees));
    if (!isNaN(parsedFees) && isFinite(parsedFees)) {
      feesValue = parsedFees;
    }
  }

  // Create nurse document
  const nurseData = {
    firstName: resolvedName.firstName,
    lastName: resolvedName.lastName || '',
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    gender: gender || undefined,
    qualification: qualification.trim(),
    experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
    specialization: specialization ? specialization.trim() : undefined,
    fees: feesValue,
    registrationNumber: registrationNumber.trim(),
    registrationCouncilName: registrationCouncilName.trim(),
    address: {
      line1: address.line1.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      postalCode: address.postalCode.trim(),
      country: address.country || 'India',
    },
    bio: bio ? bio.trim() : undefined,
    profileImage: profileImageUrl,
    documents: {
      nursingCertificate: nursingCertificateUrl ? {
        imageUrl: nursingCertificateUrl,
        uploadedAt: new Date(),
      } : undefined,
      registrationCertificate: registrationCertificateUrl ? {
        imageUrl: registrationCertificateUrl,
        uploadedAt: new Date(),
      } : undefined,
      profileImage: profileImageUrl,
    },
    status: APPROVAL_STATUS.PENDING,
  };

  const nurse = await Nurse.create(nurseData);

  // Send acknowledgement email
  try {
    await sendSignupAcknowledgementEmail({
      email: nurse.email,
      name: `${nurse.firstName} ${nurse.lastName}`.trim(),
      role: 'Nurse',
    });
  } catch (error) {
    console.error('Error sending signup acknowledgement email:', error);
    // Don't fail registration if email fails
  }

  // Notify admins
  try {
    await notifyAdminsOfPendingSignup({
      role: ROLES.NURSE,
      entity: nurse,
    });
  } catch (error) {
    console.error('Error notifying admins:', error);
    // Don't fail registration if notification fails
  }

  return res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. Please wait for admin approval.',
    data: {
      nurse: {
        id: nurse._id,
        firstName: nurse.firstName,
        lastName: nurse.lastName,
        email: nurse.email,
        phone: nurse.phone,
        status: nurse.status,
      },
    },
  });
});

// Request OTP for login
exports.requestLoginOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required.',
    });
  }

  const result = await requestLoginOtp({ role: ROLES.NURSE, phone });

  return res.status(200).json({
    success: true,
    message: result.message,
    data: {
      phone: result.phone,
    },
  });
});

// Verify OTP and login
exports.loginNurse = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required.',
    });
  }

  const result = await verifyLoginOtp({ role: ROLES.NURSE, phone, otp });
  const { user } = result;

  // Check approval status
  if (user.status && user.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(403).json({
      success: false,
      message: user.status === APPROVAL_STATUS.PENDING
        ? 'Your account is pending admin approval. Please wait for approval before logging in.'
        : 'Your account has been rejected. Please contact support for assistance.',
      data: {
        status: user.status,
      },
    });
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  const tokens = buildAuthResponse(user);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      nurse: user,
      tokens,
    },
  });
});

exports.getNurseProfile = asyncHandler(async (req, res) => {
  const nurse = await getProfileByRoleAndId(ROLES.NURSE, req.auth.id);

  return res.status(200).json({ success: true, data: nurse });
});

exports.updateNurseProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  // Handle name parsing
  if (updates.fullName && !updates.firstName) {
    const resolvedName = parseName({ fullName: updates.fullName });
    updates.firstName = resolvedName.firstName;
    updates.lastName = resolvedName.lastName;
  }

  if (updates.name && !updates.firstName) {
    const resolvedName = parseName({ name: updates.name });
    updates.firstName = resolvedName.firstName;
    updates.lastName = resolvedName.lastName;
  }

  // Handle fees
  if (updates.fees !== undefined && updates.fees !== null && updates.fees !== '') {
    const feeValue = parseFloat(String(updates.fees));
    if (!isNaN(feeValue) && isFinite(feeValue)) {
      updates.fees = feeValue;
    } else {
      updates.fees = undefined;
    }
  }

  // Handle file uploads if provided
  if (req.files) {
    if (req.files.nursingCertificate) {
      try {
        const uploadResult = await uploadFile(req.files.nursingCertificate, 'documents', 'nurse');
        updates.documents = updates.documents || {};
        updates.documents.nursingCertificate = {
          imageUrl: uploadResult.url,
          uploadedAt: new Date(),
        };
      } catch (error) {
        console.error('Error uploading nursing certificate:', error);
      }
    }

    if (req.files.registrationCertificate) {
      try {
        const uploadResult = await uploadFile(req.files.registrationCertificate, 'documents', 'nurse');
        updates.documents = updates.documents || {};
        updates.documents.registrationCertificate = {
          imageUrl: uploadResult.url,
          uploadedAt: new Date(),
        };
      } catch (error) {
        console.error('Error uploading registration certificate:', error);
      }
    }

    if (req.files.profileImage) {
      try {
        const uploadResult = await uploadFile(req.files.profileImage, 'profiles', 'nurse');
        updates.profileImage = uploadResult.url;
        updates.documents = updates.documents || {};
        updates.documents.profileImage = uploadResult.url;
      } catch (error) {
        console.error('Error uploading profile image:', error);
      }
    }
  }

  // Clean up name fields
  delete updates.fullName;
  delete updates.name;

  const nurse = await updateProfileByRoleAndId(ROLES.NURSE, req.auth.id, updates);

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: nurse,
  });
});

exports.logoutNurse = asyncHandler(async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  // Blacklist access token if provided
  if (accessToken) {
    try {
      const decoded = decodeToken(accessToken);
      if (decoded && decoded.id && decoded.role) {
        await blacklistToken(accessToken, 'access', decoded.id, decoded.role, 'logout');
      }
    } catch (error) {
      console.log('Error blacklisting access token:', error.message);
    }
  }

  // Blacklist refresh token if provided
  if (refreshToken) {
    try {
      const decoded = decodeToken(refreshToken);
      if (decoded && decoded.id && decoded.role) {
        await blacklistToken(refreshToken, 'refresh', decoded.id, decoded.role, 'logout');
      }
    } catch (error) {
      console.log('Error blacklisting refresh token:', error.message);
    }
  }

  res.clearCookie('token');
  res.clearCookie('refreshToken');
  return res.status(200).json({ success: true, message: 'Logout successful. All tokens have been revoked.' });
});

// Refresh token endpoint
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required.',
    });
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);
    const nurse = await Nurse.findById(decoded.id);

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (Object.prototype.hasOwnProperty.call(nurse, 'isActive') && nurse.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive.',
      });
    }

    // Token rotation - blacklist old refresh token
    try {
      await blacklistToken(refreshToken, 'refresh', decoded.id, decoded.role, 'refresh');
    } catch (error) {
      console.log('Error blacklisting old refresh token:', error.message);
    }

    const payload = { id: nurse._id, role: ROLES.NURSE };
    const newAccessToken = createAccessToken(payload);
    const newRefreshToken = createRefreshToken(payload);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token.',
    });
  }
});

// Get nurse by ID (for admin or self)
exports.getNurseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const nurse = await Nurse.findById(id).select('-password');

  if (!nurse) {
    return res.status(404).json({
      success: false,
      message: 'Nurse not found.',
    });
  }

  return res.status(200).json({
    success: true,
    data: nurse,
  });
});

