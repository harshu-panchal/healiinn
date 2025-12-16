# Audio Call Feature - Test Guide

## Automated Test Script

### Prerequisites

1. Backend server must be running
2. MongoDB must be connected
3. At least one doctor and one patient must exist in the database with phone numbers
   - The script will use the first available doctor/patient if not specified
   - Or specify existing users via phone number or ID (see below)
4. At least one appointment with `consultationMode='call'` (script will create/update if needed)
5. OTP authentication: Default test OTP is `123456` (works unless `USE_RANDOM_OTP=true`)

### Running the Test Script

```bash
cd backend
node scripts/testAudioCall.js
```

### Test Script Output

The script will test:
1. ✅ Doctor login and socket connection
2. ✅ Patient login and socket connection
3. ✅ Doctor initiates call (`call:initiate` event)
4. ✅ Patient receives invite (`call:invite` event)
5. ✅ Patient accepts call (`call:accept` event)
6. ✅ Call record created in database with status='accepted'
7. ✅ Call end (`call:end` event)
8. ✅ Call record updated with endTime and durationSeconds

### Environment Variables for Test

The script works with existing users in your database. You can optionally specify which users to use:

**Option 1: Use first available users (default)**
```bash
node scripts/testAudioCall.js
```

**Option 2: Specify users by phone number**
```bash
TEST_DOCTOR_PHONE=9876543201 \
TEST_PATIENT_PHONE=9876544001 \
node scripts/testAudioCall.js
```

**Option 3: Specify users by MongoDB ID**
```bash
TEST_DOCTOR_ID=507f1f77bcf86cd799439011 \
TEST_PATIENT_ID=507f1f77bcf86cd799439012 \
node scripts/testAudioCall.js
```

**Add to `.env` (optional):**
```env
TEST_DOCTOR_PHONE=9876543201
TEST_PATIENT_PHONE=9876544001
TEST_OTP=123456
```

**Note:** 
- The script uses OTP-based authentication (phone number + OTP)
- Default test OTP is `123456` (unless `USE_RANDOM_OTP=true` is set)
- If `USE_RANDOM_OTP=true`, you must provide the received OTP via `TEST_OTP` environment variable
- The script automatically requests OTP for both doctor and patient before login

## Manual Test Checklist

### Pre-Test Setup

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000 (or configured port)
- [ ] MongoDB connected
- [ ] Doctor account exists and is logged in
- [ ] Patient account exists and is logged in
- [ ] At least one appointment with:
  - `consultationMode='call'`
  - Status: `'called'`, `'in-consultation'`, or `'in_progress'`
  - Belongs to the test doctor and patient

### Test Flow

#### 1. Doctor Initiates Call

**Doctor Browser:**
- [ ] Navigate to `/doctor/patients`
- [ ] Find appointment with `consultationMode='call'` and status `'called'` or `'in-consultation'`
- [ ] Verify "Audio Call" button is visible
- [ ] Click "Audio Call" button
- [ ] Check browser console for:
  - `📞 Audio Call button clicked for appointmentId: ...`
  - `📞 [handleAudioCall] Emitting call:initiate event...`
- [ ] Verify toast message: "Initiating audio call..."

**Backend Console:**
- [ ] Should see: `📞 [call:initiate] Received from doctor...`
- [ ] Should see: `📞 Sending call invite to patient room: patient-<id>`
- [ ] Should see: `📞 Patient room has X socket(s) connected`
- [ ] Should see: `📞 Call invite emitted to patient room: patient-<id>`

**Database Check:**
```javascript
// In MongoDB shell or Compass
db.calls.findOne({ status: 'initiated' })
// Should return a call record with:
// - callId (UUID)
// - appointmentId
// - doctorId
// - patientId
// - status: 'initiated'
```

#### 2. Patient Receives Invite

**Patient Browser:**
- [ ] Should see incoming call modal (on any page)
- [ ] Modal shows:
  - Doctor's name
  - "Incoming Audio Call" title
  - "Join" and "Decline" buttons
- [ ] Check browser console for:
  - `📞 [NotificationContext] Received call invite:`
  - `📞 [PatientAppointments] Received call invite via event:`

**Backend Console:**
- [ ] Should see patient socket connection logs (if not already connected)
- [ ] Should see invite being sent (from step 1)

#### 3. Patient Accepts Call

**Patient Browser:**
- [ ] Click "Join" button in incoming call modal
- [ ] Check browser console for:
  - `📞 [PatientAppointments] Patient emitting call:accept...`
- [ ] Verify popup window opens with call UI
- [ ] Popup should show:
  - "Connecting..." status
  - Call controls (Mute, End call)

**Backend Console:**
- [ ] Should see: `📞 [call:accept] Received from patient...`
- [ ] Should see: `📞 Router created for callId: ...`
- [ ] Should see: `📞 [call:accept] Emitted call:accepted to doctor: ...`

**Doctor Browser:**
- [ ] Should see toast: "Patient joined the call"
- [ ] Verify popup window opens with call UI
- [ ] Check browser console for:
  - `📞 [handleAudioCall] Received call:accepted event:`

**Database Check:**
```javascript
db.calls.findOne({ status: 'accepted' })
// Should show:
// - status: 'accepted'
// - startTime: Date (should be set)
```

#### 4. Audio Connection Established

**Both Browsers (Popup Windows):**
- [ ] Microphone permission requested (if not already granted)
- [ ] Status changes from "Connecting..." to "Connected"
- [ ] Call duration timer starts
- [ ] Both parties can hear each other
- [ ] Test mute/unmute button:
  - [ ] Click mute - remote party cannot hear
  - [ ] Click unmute - remote party can hear again

**Backend Console:**
- [ ] Should see mediasoup events:
  - `mediasoup:getRtpCapabilities`
  - `mediasoup:createWebRtcTransport`
  - `mediasoup:connectTransport`
  - `mediasoup:produce`
  - `mediasoup:consume`

#### 5. End Call

**Either Browser (Popup Window):**
- [ ] Click "End call" button
- [ ] Verify popup closes
- [ ] Check browser console for:
  - `📞 [CallPopup] Ending call...`

**Backend Console:**
- [ ] Should see: `📞 [call:end] Received from ...`
- [ ] Should see: `📞 Router closed for callId: ...`
- [ ] Should see: `📞 [call:end] Emitted call:ended to all participants`

**Database Check:**
```javascript
db.calls.findOne({ status: 'ended' })
// Should show:
// - status: 'ended'
// - startTime: Date
// - endTime: Date
// - durationSeconds: Number (calculated)
```

### Edge Cases to Test

#### Patient Declines Call

- [ ] Patient clicks "Decline" button
- [ ] Verify modal closes
- [ ] Check database: `status: 'declined'`
- [ ] Doctor should receive `call:declined` event

#### Patient Doesn't Respond (Timeout)

- [ ] Doctor initiates call
- [ ] Patient doesn't click Join or Decline
- [ ] Wait 30 seconds (or configured timeout)
- [ ] Check database: `status: 'missed'` (if timeout implemented)

#### Network Disconnection

- [ ] Start a call
- [ ] Disconnect one party's network
- [ ] Verify call ends gracefully
- [ ] Check database: call record updated with endTime

#### Multiple Call Attempts

- [ ] Doctor initiates call
- [ ] Before patient accepts, doctor tries to initiate again
- [ ] Should see error: "A call is already in progress"

#### Invalid Appointment

- [ ] Try to initiate call for appointment with `consultationMode != 'call'`
- [ ] Should see error: "Audio call is only available for call consultation mode"

- [ ] Try to initiate call for appointment with status not in ['called', 'in-consultation', 'in_progress']
- [ ] Should see error: "Please call the patient first before starting audio call"

### Browser Compatibility Tests

Test on:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if supported)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Performance Tests

- [ ] Call quality acceptable (no significant delay)
- [ ] No memory leaks (check browser task manager)
- [ ] Multiple calls in sequence work correctly
- [ ] Call duration timer accurate

### Security Tests

- [ ] Unauthorized user cannot initiate call
- [ ] Patient cannot initiate call (only doctor)
- [ ] Users can only access their own calls
- [ ] Socket authentication working

## Troubleshooting

### Issue: Doctor doesn't see "Audio Call" button

**Check:**
1. Appointment `consultationMode === 'call'`
2. Appointment status is `'called'`, `'in-consultation'`, or `'in_progress'`
3. Browser console for button configuration logs

### Issue: Patient doesn't receive invite

**Check:**
1. Backend console: Is invite being sent?
2. Backend console: How many sockets in patient room?
3. Patient browser: Is socket connected?
4. Patient browser console: Any errors?
5. Check patientId format matches between appointment and socket room

### Issue: Audio not working

**Check:**
1. Microphone permission granted?
2. Browser console: Any WebRTC errors?
3. Backend console: mediasoup events received?
4. Network: UDP ports open?
5. TURN server configured (if behind NAT)?

### Issue: Call record not created/updated

**Check:**
1. MongoDB connection working?
2. Call model schema correct?
3. Backend console: Any database errors?
4. Check MongoDB logs

## Test Results Template

```
Test Date: ___________
Tester: ___________

✅ Doctor initiates call: PASS / FAIL
✅ Patient receives invite: PASS / FAIL
✅ Patient accepts call: PASS / FAIL
✅ Audio connection: PASS / FAIL
✅ Call end: PASS / FAIL
✅ Database logging: PASS / FAIL

Notes:
_______________________________________
_______________________________________
```

## Quick Test Commands

### Check if sockets are connected (MongoDB)
```javascript
// This requires access to socket.io internals, but you can check:
// Backend console should show connection logs
```

### Check call records
```javascript
// MongoDB
db.calls.find().sort({ createdAt: -1 }).limit(5)
```

### Check appointments
```javascript
// MongoDB
db.appointments.find({ consultationMode: 'call' }).limit(5)
```

## Next Steps After Testing

1. Fix any issues found
2. Test on production-like environment
3. Test with real network conditions (NAT, firewall)
4. Test with TURN server
5. Performance testing with multiple concurrent calls
6. Load testing

