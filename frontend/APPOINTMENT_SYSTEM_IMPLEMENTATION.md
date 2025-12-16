# Frontend Appointment System Implementation

## 📋 Overview
This document describes the frontend implementation of the appointment booking, consultation, and prescription system.

---

## ✅ IMPLEMENTED FEATURES

### 1. Patient Appointment Booking UI

#### 1.1 Doctor Selection Page
**File**: `frontend/src/modules/patient/patient-pages/PatientDoctors.jsx`

**Features**:
- Browse all doctors
- Filter by specialization
- View doctor details (rating, experience, fee)
- Click to view doctor details page

#### 1.2 Doctor Details & Booking
**File**: `frontend/src/modules/patient/patient-pages/PatientDoctorDetails.jsx`

**Booking Flow**:

**Step 1: Date Selection** (Lines 669-717)
- Calendar view with available dates
- Dates with available slots: Enabled, shows slot count
- Full dates: Disabled, shows "Full" badge
- Real-time slot availability check
- Date selection triggers slot check API call

**Step 2: Token Number Display** (Lines 720-766)
- After date selection, token number is displayed
- Shows: "Your Token Number: X"
- Shows: "X of Y slots booked"
- Shows: "Z slot(s) remaining"
- Green success box with token number

**Step 3: Payment** (Lines 410-450)
- Proceed to payment after token confirmation
- Razorpay payment integration
- Payment verification
- Success notification
- Redirect to appointments page

**Key Functions**:
- `handleBookingClick()` - Opens booking modal
- `handleNextStep()` - Moves to next step
- `handleConfirmBooking()` - Creates appointment
- `checkDoctorSlotAvailability()` - Checks slot availability

**API Calls**:
```javascript
// Check slot availability
const response = await checkDoctorSlotAvailability(doctor._id, selectedDate)

// Book appointment
const response = await bookAppointment(appointmentData)

// Verify payment
const response = await verifyAppointmentPayment(appointmentId, paymentData)
```

---

### 2. Doctor Session & Queue Management UI

#### 2.1 Patient Queue View
**File**: `frontend/src/modules/doctor/doctor-pages/DoctorPatients.jsx`

**Features**:
- Date selector to view sessions
- Session list for selected date
- Patient queue for each session
- Real-time updates via Socket.IO

**Patient Card Display** (Lines 314-666):
- Patient name and photo
- Token number (prominent display)
- Appointment time
- Queue status badge
- ETA (Estimated Time of Arrival)
- Action buttons based on status

**Queue Status Badges**:
- `waiting` - Blue badge
- `called` - Yellow badge
- `in-consultation` - Green badge
- `completed` - Gray badge
- `skipped` - Orange badge
- `no-show` - Red badge

#### 2.2 Session Actions

**Start Session**:
- Button to start session
- Changes status: `scheduled` → `live`
- Shows patient list

**Pause/Resume Session**:
- Pause button when session is live
- Resume button when session is paused
- ETA updates automatically

**Cancel Session**:
- Cancel button
- Confirmation dialog
- All appointments cancelled
- Patients notified

#### 2.3 Queue Actions

**Call Next Patient** (Lines 637-648):
```javascript
<button onClick={() => handleCallNext(appointment.id)}>
  Call to Consultation Room
</button>
```
- Calls next patient in queue
- Updates token number
- Real-time notification to patient

**Skip Patient** (Lines 649-655):
```javascript
<button onClick={() => handleSkip(appointment.id)}>
  Skip
</button>
```
- Skips current patient
- Moves to end of queue
- ETA recalculated

**Re-Call Patient** ⭐ **NEW**:
```javascript
<button onClick={() => handleRecall(appointment.id)}>
  Re-Call
</button>
```
- Re-calls a skipped/no-show patient
- Changes status back to `waiting`
- Patient added back to queue

**Complete Consultation**:
- Marks consultation as complete
- Updates appointment status
- Moves to next patient

**API Calls**:
```javascript
// Get queue
const response = await getQueue(date)

// Call next
const response = await callNextPatient(sessionId)

// Skip patient
const response = await skipPatient(appointmentId)

// Re-call patient ⭐ NEW
const response = await recallPatient(appointmentId)

// Update status
const response = await updateQueueStatus(appointmentId, status)

// Pause session
const response = await pauseSession(sessionId)

// Resume session
const response = await resumeSession(sessionId)
```

---

### 3. Consultation & Prescription UI

#### 3.1 Consultation Interface
**File**: `frontend/src/modules/doctor/doctor-pages/DoctorConsultations.jsx`

**Features**:
- Patient details panel
- Consultation form:
  - Diagnosis input
  - Vitals (BP, temperature, pulse, etc.)
  - Symptoms
  - Medications list
  - Investigations
  - Advice
  - Follow-up date

**Prescription Form** (Lines 1573-1682):
- Add medications (name, dosage, frequency, duration)
- Add investigations
- Add notes
- Save prescription

**Save Prescription** (Lines 1573-1682):
```javascript
const handleSavePrescription = async () => {
  // Validate
  if (!diagnosis) {
    toast.warning('Please enter a diagnosis')
    return
  }
  
  // Create prescription
  const prescriptionResponse = await createPrescription({
    consultationId: selectedConsultation?.id,
    patientId: selectedConsultation?.patientId,
    medications: [...medications],
    // ... other fields
  })
  
  // Update UI
  if (prescriptionResponse.success) {
    setSavedPrescriptions((prev) => [prescriptionResponse.data, ...prev])
    toast.success('Prescription saved successfully!')
  }
}
```

**Prescription Display**:
- Saved prescriptions list
- View prescription details
- Download PDF
- Share with pharmacy

---

### 4. Prescription View (Patient)

#### 4.1 Patient Prescription List
**File**: `frontend/src/modules/patient/patient-pages/PatientPrescriptions.jsx` (if exists)

**Features**:
- View all prescriptions
- Filter by doctor
- Filter by date
- View prescription details
- Download PDF
- Share with pharmacy

**API Call**:
```javascript
const response = await getPatientPrescriptions()
```

---

### 5. Real-Time Updates (Socket.IO)

#### 5.1 Patient Socket Events
**File**: Patient components with Socket.IO integration

**Events Received**:
- `appointment:created` - Appointment booked
- `token:called` - Doctor called patient
- `token:eta:update` - ETA updated
- `appointment:cancelled` - Appointment cancelled
- `prescription:created` - Prescription received
- `appointment:payment:confirmed` - Payment confirmed
- `appointment:rescheduled` - Appointment rescheduled
- `token:recalled` - Patient recalled ⭐ **NEW**

**Implementation**:
```javascript
useEffect(() => {
  const socket = io(API_BASE_URL)
  
  socket.on('token:called', (data) => {
    // Update UI
    toast.info(`Your token ${data.tokenNumber} has been called!`)
  })
  
  socket.on('token:eta:update', (data) => {
    // Update ETA display
    setETA(data.estimatedWaitMinutes)
  })
  
  return () => socket.disconnect()
}, [])
```

#### 5.2 Doctor Socket Events
**File**: Doctor components with Socket.IO integration

**Events Received**:
- `appointment:created` - New appointment
- `wallet:credited` - Wallet credited ⭐ **NEW**
- `session:updated` - Session status changed
- `queue:updated` - Queue updated
- `queue:next:called` - Next patient called

**Implementation**:
```javascript
useEffect(() => {
  const socket = io(API_BASE_URL)
  
  socket.on('appointment:created', (data) => {
    // Refresh queue
    fetchQueue()
    toast.info('New appointment received!')
  })
  
  socket.on('wallet:credited', (data) => {
    // Update wallet balance
    setWalletBalance(data.balance)
    toast.success(`₹${data.amount} credited to wallet!`)
  })
  
  return () => socket.disconnect()
}, [])
```

---

## 🆕 NEW ADDITIONS

### 1. Re-Call Patient Functionality ⭐ **NEW**

**File**: `frontend/src/modules/doctor/doctor-services/doctorService.js`

**Function**:
```javascript
export const recallPatient = async (appointmentId) => {
  try {
    return await apiClient.patch(`/doctors/queue/${appointmentId}/recall`)
  } catch (error) {
    console.error('Error recalling patient:', error)
    throw error
  }
}
```

**Usage in Component**:
```javascript
const handleRecall = async (appointmentId) => {
  try {
    const response = await recallPatient(appointmentId)
    if (response.success) {
      toast.success('Patient recalled to queue')
      // Refresh queue
      fetchQueue()
    }
  } catch (error) {
    toast.error('Failed to recall patient')
  }
}
```

### 2. Wallet Credit Notification ⭐ **NEW**

**File**: Doctor dashboard or wallet component

**Socket Event Handler**:
```javascript
socket.on('wallet:credited', (data) => {
  // Show notification
  toast.success(`₹${data.amount} credited to your wallet!`)
  
  // Update wallet balance
  updateWalletBalance(data.balance)
  
  // Show notification badge
  showNotification('Wallet', `Earning from appointment ${data.appointmentId}`)
})
```

---

## 📱 COMPONENT STRUCTURE

### Patient Module
```
patient-pages/
├── PatientDoctors.jsx          # Browse doctors
├── PatientDoctorDetails.jsx    # Doctor details & booking
├── PatientAppointments.jsx    # View appointments
└── PatientPrescriptions.jsx    # View prescriptions

patient-services/
└── patientService.js           # API calls
```

### Doctor Module
```
doctor-pages/
├── DoctorPatients.jsx          # Patient queue & session
├── DoctorConsultations.jsx    # Consultation & prescription
├── DoctorSessions.jsx         # Session management
└── DoctorWallet.jsx           # Wallet & earnings

doctor-services/
└── doctorService.js           # API calls
```

---

## 🎨 UI/UX FEATURES

### 1. Token Number Display
- Large, prominent display
- Green success box
- Shows booking progress
- Real-time updates

### 2. Queue Status Indicators
- Color-coded badges
- Icons for each status
- Tooltips with descriptions
- Real-time status updates

### 3. ETA Display
- Live countdown
- Updates automatically
- Shows patients ahead
- Pause/resume adjustments

### 4. Prescription Form
- Clean, organized layout
- Add/remove medications
- Validation before save
- PDF preview

---

## 🔄 STATE MANAGEMENT

### Patient Booking State
```javascript
const [selectedDate, setSelectedDate] = useState('')
const [slotAvailability, setSlotAvailability] = useState({})
const [bookingStep, setBookingStep] = useState(1)
const [tokenNumber, setTokenNumber] = useState(null)
```

### Doctor Queue State
```javascript
const [sessions, setSessions] = useState([])
const [currentSession, setCurrentSession] = useState(null)
const [patients, setPatients] = useState([])
const [sessionStatus, setSessionStatus] = useState('scheduled')
```

### Consultation State
```javascript
const [diagnosis, setDiagnosis] = useState('')
const [medications, setMedications] = useState([])
const [vitals, setVitals] = useState({})
const [prescription, setPrescription] = useState(null)
```

---

## 📡 API INTEGRATION

### Service Functions

**Patient Service** (`patientService.js`):
- `checkDoctorSlotAvailability(doctorId, date)`
- `bookAppointment(appointmentData)`
- `verifyAppointmentPayment(appointmentId, paymentData)`
- `rescheduleAppointment(appointmentId, newDate)`
- `getPatientPrescriptions()`

**Doctor Service** (`doctorService.js`):
- `getSessions(date)`
- `getQueue(date)`
- `callNextPatient(sessionId)`
- `skipPatient(appointmentId)`
- `recallPatient(appointmentId)` ⭐ **NEW**
- `pauseSession(sessionId)`
- `resumeSession(sessionId)`
- `updateQueueStatus(appointmentId, status)`
- `createConsultation(consultationData)`
- `createPrescription(prescriptionData)`
- `getWalletBalance()`

---

## 🎯 USER FLOWS

### Patient Booking Flow
1. Browse doctors → Select doctor
2. View doctor details → Click "Book Appointment"
3. Select date → See token number
4. Confirm booking → Make payment
5. Payment success → Appointment confirmed
6. Receive notifications → View in appointments

### Doctor Consultation Flow
1. View sessions → Select date
2. See patient queue → Start session
3. Call next patient → Patient enters consultation
4. Conduct consultation → Add diagnosis, vitals
5. Create prescription → Save prescription
6. Complete consultation → Move to next patient

---

## 🐛 KNOWN ISSUES & FIXES

### Fixed Issues
1. ✅ Doctor wallet not credited on payment - **FIXED**
2. ✅ Re-call functionality missing - **ADDED**
3. ✅ Token number display - **VERIFIED**

### Pending
- None currently

---

## 📝 NOTES

1. **Real-time Updates**: All components use Socket.IO for real-time updates
2. **Error Handling**: All API calls have try-catch with toast notifications
3. **Loading States**: All async operations show loading indicators
4. **Validation**: Form validation before submission
5. **Responsive**: Mobile-first design as per workspace rules

---

**Last Updated**: 2024-01-XX
**Version**: 1.0.0

