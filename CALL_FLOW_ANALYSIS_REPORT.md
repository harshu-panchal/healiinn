# Call Flow Analysis Report

## Executive Summary

This report analyzes the implementation of all 5 calling flow cases in the Healiinn application. The analysis covers backend socket handlers, frontend event listeners, state management, and edge cases.

## Case-by-Case Analysis

### ✅ Case 1: Doctor cuts call before patient joins

**Status**: **FULLY IMPLEMENTED**

**Flow**:
1. Doctor initiates call → Call status: 'initiated'
2. Doctor clicks end button in `DoctorCallStatus` → Emits `call:end`
3. Backend `call:end` handler (line 497-563 in `socket.js`):
   - Works for any status except 'ended' (line 517-519)
   - Updates call status to 'ended' via `call.endCall()`
   - Cleans up mediasoup resources
   - Emits `call:ended` to patient room, doctor room, and role rooms
4. Patient's `IncomingCallNotification` listens for `call:ended` (line 74-84) and closes notification
5. Doctor's `DoctorCallStatus` closes properly

**Files Involved**:
- `backend/config/socket.js` (line 497-563)
- `frontend/src/modules/shared/DoctorCallStatus.jsx` (line 380-386, 156-188)
- `frontend/src/modules/shared/IncomingCallNotification.jsx` (line 74-84)

**Verification**: ✅ All components properly handle this case

---

### ✅ Case 2: Patient declines call

**Status**: **FULLY IMPLEMENTED**

**Flow**:
1. Doctor initiates call → Call status: 'initiated'
2. Patient clicks decline in `IncomingCallNotification` → Emits `call:decline`
3. Backend `call:decline` handler (line 404-494 in `socket.js`):
   - Validates patient can decline (line 407-414)
   - Updates call status to 'declined' (line 455-456)
   - Emits `call:declined` to doctor room, call room, and 'doctors' room
4. Doctor's `DoctorCallStatus` listens for `call:declined` (line 190-224) and closes UI
5. Patient's notification closes after declining

**Files Involved**:
- `backend/config/socket.js` (line 404-494)
- `frontend/src/modules/shared/IncomingCallNotification.jsx` (line 238-297)
- `frontend/src/modules/shared/DoctorCallStatus.jsx` (line 190-224)

**Verification**: ✅ All components properly handle this case

---

### ⚠️ Case 3: Patient joins call (call starts)

**Status**: **PARTIALLY IMPLEMENTED - CRITICAL ISSUE FOUND**

**Flow**:
1. Doctor initiates call → Call status: 'initiated'
2. Patient accepts call → Emits `call:accept`
3. Backend `call:accept` handler (line 305-401 in `socket.js`):
   - Updates call status to 'accepted' (line 356-358)
   - Patient joins call room (line 361)
   - Creates router for call (line 365)
   - Emits `call:accepted` to doctor
4. Patient opens `CallPopup` → Joins WebRTC:
   - Creates transports (send & recv)
   - Produces local audio
   - Consumes remote audio when available
   - Emits `call:joined` when fully connected
5. Backend `call:joined` handler (line 598-713):
   - Emits `call:patientJoined` to doctor
6. Doctor receives `call:patientJoined` → Updates status to 'started'

**CRITICAL ISSUE**: 
- **Doctors do NOT open `CallPopup` when patient accepts**
- In `DoctorPatients.jsx` line 574: "Note: CallPopup is not used for doctors - only DoctorCallStatus is shown"
- Doctor does NOT call `startCall()` when patient accepts (line 552-581)
- This means `activeCall` is never set for doctors
- Without `activeCall`, `CallPopup` doesn't render for doctors
- **Result**: Doctors cannot produce audio or consume patient's audio
- **Only patients can talk; doctors cannot hear or speak**

**Files Involved**:
- `backend/config/socket.js` (line 305-401, 598-713)
- `frontend/src/modules/shared/IncomingCallNotification.jsx` (line 147-236)
- `frontend/src/modules/shared/CallPopup.jsx` (entire file)
- `frontend/src/modules/doctor/doctor-pages/DoctorPatients.jsx` (line 552-654)
- `frontend/src/modules/shared/DoctorCallStatus.jsx` (line 110-154)

**Verification**: ⚠️ **ISSUE**: Doctors need to also open `CallPopup` to join WebRTC

---

### ✅ Case 4: Doctor cuts call after patient joins

**Status**: **FULLY IMPLEMENTED**

**Flow**:
1. Call is active (status: 'accepted')
2. Doctor clicks end button in `DoctorCallStatus` → Emits `call:end`
3. Backend `call:end` handler:
   - Works for 'accepted' status (only checks if status !== 'ended')
   - Updates call status to 'ended'
   - Cleans up mediasoup resources
   - Emits `call:ended` to both parties
4. Both `CallPopup` (patient) and `DoctorCallStatus` (doctor) listen for `call:ended` and close

**Files Involved**:
- `backend/config/socket.js` (line 497-563)
- `frontend/src/modules/shared/CallPopup.jsx` (line 54-97, 747-790)
- `frontend/src/modules/shared/DoctorCallStatus.jsx` (line 156-188, 380-386)

**Verification**: ✅ All components properly handle this case

---

### ✅ Case 5: Patient cuts call after joining

**Status**: **FULLY IMPLEMENTED**

**Flow**:
1. Call is active (status: 'accepted')
2. Patient clicks end button in `CallPopup` → Calls `handleEndCall()`
3. `handleEndCall` emits `call:end` to server (line 769)
4. Backend `call:end` handler processes the request
5. Backend emits `call:ended` to both parties
6. Both `CallPopup` (patient) and `DoctorCallStatus` (doctor) close

**Files Involved**:
- `backend/config/socket.js` (line 497-563)
- `frontend/src/modules/shared/CallPopup.jsx` (line 747-790, 54-97)
- `frontend/src/modules/shared/DoctorCallStatus.jsx` (line 156-188)

**Verification**: ✅ All components properly handle this case

---

## Edge Cases Analysis

### 1. Status Validation ✅
- `call:end` works for both 'initiated' and 'accepted' statuses
- `call:accept` only works for 'initiated' status (prevents double-accept)
- `call:decline` checks if already declined/ended (prevents duplicate decline)
- **Status**: Properly handled

### 2. Event Delivery ✅
- Events are emitted to multiple rooms for redundancy:
  - Call room (primary)
  - User-specific rooms (doctor-{id}, patient-{id})
  - Role rooms ('doctors', 'patients')
  - Direct socket emission (fallback)
- **Status**: Robust delivery mechanism

### 3. UI State Management ✅
- `CallPopup` uses `isEndingRef` to prevent duplicate processing
- Fallback logic for callId mismatch (processes if activeCall exists)
- `DoctorCallStatus` has similar duplicate prevention
- **Status**: Properly handled

### 4. Resource Cleanup ✅
- Mediasoup resources cleaned up in `call:end` handler
- `CallPopup.cleanup()` properly closes producers, consumers, transports
- **Status**: Properly handled

### 5. Race Conditions ✅
- Backend prevents duplicate `call:end` by checking status === 'ended'
- Frontend prevents duplicate processing with `isEndingRef` flag
- **Status**: Properly handled

### 6. Disconnect Handling ⚠️
**Issue Found**:
- On socket disconnect, only calls with status 'accepted' are ended (line 858 in `socket.js`)
- Calls with status 'initiated' are NOT ended on disconnect
- This could leave orphaned calls if doctor disconnects before patient accepts
- **Recommendation**: Also end 'initiated' calls on disconnect, or mark them as 'missed'

---

## Summary of Findings

### ✅ Fully Working Cases (4/5)
1. Case 1: Doctor cuts before patient joins ✅
2. Case 2: Patient declines call ✅
3. Case 4: Doctor cuts after patient joins ✅
4. Case 5: Patient cuts after joining ✅

### ⚠️ Issues Found (1/5)
1. **Case 3: Patient joins call** - **CRITICAL ISSUE**
   - Doctors do not join WebRTC call
   - Doctors cannot produce or consume audio
   - Only patients can talk; bidirectional communication is broken

### Minor Issues
1. **Disconnect handling**: 'initiated' calls not ended on disconnect (could leave orphaned calls)

---

## Recommendations

### Critical Fix Required

**Issue**: Doctors do not join WebRTC when patient accepts call

**Solution**: 
1. In `DoctorPatients.jsx`, when `call:accepted` event is received, also call `startCall()`:
   ```javascript
   // After line 572, add:
   startCall(data.callId, patientName)
   ```
2. This will set `activeCall` in `CallContext`, which will cause `CallPopup` to render for doctors
3. `CallPopup` will then initialize WebRTC connection for doctors, allowing them to produce and consume audio

**Files to Modify**:
- `frontend/src/modules/doctor/doctor-pages/DoctorPatients.jsx` (line 552-581)

### Optional Improvement

**Issue**: 'initiated' calls not cleaned up on disconnect

**Solution**:
In `backend/config/socket.js` line 858, change:
```javascript
if (call && call.status === 'accepted') {
```
to:
```javascript
if (call && (call.status === 'accepted' || call.status === 'initiated')) {
```

---

## Conclusion

The calling flow is **mostly implemented correctly**, with 4 out of 5 cases working properly. However, there is a **critical issue** in Case 3 where doctors do not join the WebRTC call, breaking bidirectional communication. This needs to be fixed for the calling feature to work as intended.

All other cases (1, 2, 4, 5) are fully functional and properly handle state transitions, event delivery, and resource cleanup.

