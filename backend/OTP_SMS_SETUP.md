# OTP SMS Service Setup Guide

## Overview
This guide explains how to set up and configure the OTP SMS service for signup and login flows in the Healiinn application.

## Current Implementation

### Who Gets OTP?

#### Signup (Registration):
- ✅ **Patient**: Gets OTP during signup
- ❌ **Doctor**: No OTP (only email acknowledgment)
- ❌ **Pharmacy**: No OTP (only email acknowledgment)
- ❌ **Laboratory**: No OTP (only email acknowledgment)

#### Login:
- ✅ **Patient**: Gets OTP for login
- ✅ **Doctor**: Gets OTP for login
- ✅ **Pharmacy**: Gets OTP for login
- ✅ **Laboratory**: Gets OTP for login

## SMS Provider Configuration

The system supports multiple SMS providers. Choose one based on your needs:

### Supported Providers:
1. **MSG91** (Recommended for India)
2. **Twilio** (International)
3. **TextLocal** (India)
4. **AWS SNS** (International)
5. **NONE** (Development/Testing - only logs OTP)

## Environment Variables Setup

Add these variables to your `.env` file:

### Basic Configuration
```env
# Login OTP Configuration
LOGIN_OTP_EXPIRY_MINUTES=10

# SMS Provider Selection
# Options: MSG91, TWILIO, TEXTLOCAL, AWS_SNS, NONE
SMS_PROVIDER=MSG91
```

### MSG91 Configuration (Recommended for India)
```env
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_SENDER_ID=HEALIN
MSG91_OTP_TEMPLATE_ID=your-msg91-otp-template-id
MSG91_ROUTE=4
```

**How to get MSG91 credentials:**
1. Sign up at https://msg91.com
2. Get your Auth Key from dashboard
3. Create an OTP template (or use direct SMS)
4. Get your Sender ID approved

### Twilio Configuration (Alternative)
```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** Requires `twilio` package: `npm install twilio`

### TextLocal Configuration (Alternative for India)
```env
TEXTLOCAL_API_KEY=your-textlocal-api-key
TEXTLOCAL_SENDER_ID=HEALIN
```

### AWS SNS Configuration (Alternative)
```env
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
```

**Note:** Requires `aws-sdk` package: `npm install aws-sdk`

## Development/Testing Mode

For development, you can set:
```env
SMS_PROVIDER=NONE
```

This will log OTPs to console instead of sending actual SMS. Useful for testing without spending SMS credits.

## How It Works

### Signup Flow (Patient Only):
1. User fills signup form
2. Account is created in database
3. OTP is generated and sent to mobile number
4. User enters OTP to verify and complete registration
5. User is logged in after successful verification

### Login Flow (All Roles):
1. User enters phone number
2. System checks if account exists and is active/approved
3. OTP is generated and sent to mobile number
4. User enters OTP
5. User is logged in after successful verification

## Phone Number Format

The system automatically formats phone numbers:
- Removes non-digit characters
- Adds +91 for Indian numbers (10 digits)
- Handles numbers with/without country code

## Error Handling

- If SMS provider fails, error is logged
- In development mode, errors don't block OTP generation
- In production, SMS errors are thrown and handled upstream
- OTP is always generated and stored even if SMS fails (for testing)

## Frontend Connection

All frontend services are properly connected:

- ✅ Patient: `frontend/src/modules/patient/patient-services/patientService.js`
- ✅ Doctor: `frontend/src/modules/doctor/doctor-services/doctorService.js`
- ✅ Pharmacy: `frontend/src/modules/pharmacy/pharmacy-services/pharmacyService.js`
- ✅ Laboratory: `frontend/src/modules/laboratory/laboratory-services/laboratoryService.js`

## API Endpoints

### Patient
- `POST /api/patients/auth/signup` - Signup (sends OTP)
- `POST /api/patients/auth/login/otp` - Request login OTP
- `POST /api/patients/auth/login` - Verify OTP and login

### Doctor
- `POST /api/doctors/auth/login/otp` - Request login OTP
- `POST /api/doctors/auth/login` - Verify OTP and login

### Pharmacy
- `POST /api/pharmacies/auth/login/otp` - Request login OTP
- `POST /api/pharmacies/auth/login` - Verify OTP and login

### Laboratory
- `POST /api/laboratories/auth/login/otp` - Request login OTP
- `POST /api/laboratories/auth/login` - Verify OTP and login

## Testing

1. Set `SMS_PROVIDER=NONE` in `.env`
2. Check console logs for OTP values
3. Use the logged OTP to test verification
4. Once working, switch to actual SMS provider

## Troubleshooting

### OTP Not Received
1. Check SMS provider credentials in `.env`
2. Verify phone number format
3. Check SMS provider dashboard for delivery status
4. Review server logs for errors

### SMS Provider Errors
- Check API credentials
- Verify sender ID is approved
- Check account balance (for paid providers)
- Review provider-specific error messages in logs

## Rate Limiting

OTP requests are rate-limited:
- Window: 5 minutes (300000ms)
- Max requests: 3 per window
- Configured in: `backend/middleware/rateLimiter.js`

## Security Notes

- OTPs are hashed before storage
- OTPs expire after 10 minutes (configurable)
- Maximum 5 verification attempts
- OTP records are deleted after successful verification
- Phone numbers are normalized and validated

