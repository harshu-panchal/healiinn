# Missing Endpoints Analysis

## Frontend Requirements vs Backend Implementation

### ✅ IMPLEMENTED ENDPOINTS

#### Patient Module
- ✅ Auth endpoints (signup, login/otp, login, logout, profile)
- ✅ Appointments (GET, POST, PATCH, DELETE, /upcoming)
- ✅ Prescriptions (GET, GET/:id)
- ✅ Reports (GET, GET/:id/download)
- ✅ Orders (GET, GET/:id, POST)
- ✅ Transactions (GET, GET/:id)
- ✅ Requests (GET, GET/:id, POST, POST/:id/payment, DELETE)
- ✅ Reviews (GET, GET/:id, POST)
- ✅ Support (GET, GET/:id, POST, GET/history)
- ✅ Doctors discovery (GET, GET/:id)
- ✅ Hospitals (GET, GET/:id, GET/:id/doctors)
- ✅ Specialties (GET, GET/:id/doctors)
- ✅ Locations (GET)
- ✅ Pharmacy discovery (GET, GET/:id)

#### Doctor Module
- ✅ Auth endpoints
- ✅ Dashboard (GET/stats)
- ✅ Appointments (GET, GET/today)
- ✅ Patients (GET/queue, GET/all, GET/:id, GET/:id/history)
- ✅ Consultations (GET, POST, PATCH, GET/:id)
- ✅ Prescriptions (GET, GET/:id, POST)
- ✅ Sessions (GET, POST, PATCH, DELETE)
- ✅ Queue (GET, PATCH/:id/move, PATCH/:id/skip, PATCH/:id/status)
- ✅ Wallet (GET/balance, GET/earnings, GET/transactions, POST/withdraw)
- ✅ Support (GET, POST, GET/history)

#### Pharmacy Module
- ✅ Auth endpoints
- ✅ Dashboard (GET/stats)
- ✅ Orders (GET, GET/:id, PATCH/:id/status)
- ✅ Medicines (GET, POST, PATCH/:id, DELETE/:id)
- ✅ Patients (GET, GET/:id, GET/statistics)
- ✅ Request Orders (GET, GET/:id, PATCH/:id/confirm, PATCH/:id/status)
- ✅ Prescriptions (GET, GET/:id)
- ✅ Services (GET, POST, PATCH/:id, DELETE/:id, PATCH/:id/toggle)
- ✅ Wallet (GET/balance, GET/earnings, GET/transactions, POST/withdraw)
- ✅ Support (GET, POST)

#### Laboratory Module
- ✅ Auth endpoints
- ✅ Dashboard (GET/stats)
- ✅ Orders/Leads (GET, GET/:id, PATCH/:id/status)
- ✅ Tests (GET, POST, PATCH/:id, DELETE/:id)
- ✅ Reports (GET, GET/:id, POST, PATCH/:id)
- ✅ Patients (GET, GET/:id, GET/:id/orders, GET/statistics)
- ✅ Request Orders (GET, GET/:id, PATCH/:id/confirm, PATCH/:id/status, POST/:id/bill)
- ✅ Requests (GET, GET/:id)
- ✅ Wallet (GET/balance, GET/earnings, GET/transactions, POST/withdraw)
- ✅ Support (GET, POST)

#### Admin Module
- ✅ Auth endpoints (including check-exists, forgot-password, verify-otp, reset-password)
- ✅ Dashboard (GET/stats)
- ✅ Users (GET, GET/:id, PATCH/:id/status, DELETE/:id)
- ✅ Providers (GET/doctors, GET/doctors/:id, PATCH/doctors/:id/verify, PATCH/doctors/:id/reject, same for pharmacies and laboratories)
- ✅ Verifications (GET/pending)
- ✅ Activities (GET)
- ✅ Requests (GET, GET/:id, POST/:id/accept, POST/:id/respond, POST/:id/cancel, PATCH/:id/status)
- ✅ Appointments (GET, GET/:id, PATCH/:id, DELETE/:id)
- ✅ Orders (GET, GET/:id, PATCH/:id)
- ✅ Inventory (GET/pharmacies, GET/laboratories, GET/pharmacies/:id, GET/laboratories/:id)
- ✅ Pharmacy Medicines (GET, GET/:id, PATCH/:id)
- ✅ Wallet (GET/overview, GET/providers, GET/withdrawals, PATCH/withdrawals/:id)
- ✅ Settings (GET, PATCH)
- ✅ Support (GET, GET/:id, POST, PATCH/:id)

---

## ❌ MISSING ENDPOINTS

### Patient Module

1. **History Endpoints** - Current: `/api/patients/transactions/history`, Required: `/api/patients/history`
   - ❌ `GET /api/patients/history` - Complete medical history
   - ❌ `GET /api/patients/history/prescriptions` - Prescription history
   - ❌ `GET /api/patients/history/lab-tests` - Lab test history
   - ❌ `GET /api/patients/history/appointments` - Appointment history

### Doctor Module

1. **Availability Endpoints**
   - ❌ `GET /api/doctors/availability` - Get availability schedule
   - ❌ `PATCH /api/doctors/availability` - Update availability schedule

2. **Reviews Endpoints**
   - ❌ `GET /api/doctors/reviews` - Get doctor reviews
   - ❌ `GET /api/doctors/reviews/stats` - Get review statistics

---

## 🔧 FIXES NEEDED

1. **Patient History Route Structure**
   - Current route: `/api/patients/transactions/history`
   - Required route: `/api/patients/history` with sub-routes
   - Action: Create new history route file and move/update controller

2. **Doctor Availability Routes**
   - Action: Add availability routes to doctor routes
   - Action: Create availability controller methods

3. **Doctor Reviews Routes**
   - Action: Add reviews routes to doctor routes
   - Action: Create reviews controller methods (or check if exists in patient review controller)

---

## 📝 IMPLEMENTATION PLAN

1. Create `/backend/routes/patient-routes/history.routes.js`
2. Update patient history controller to support sub-routes
3. Update `server.js` to include new history route
4. Create `/backend/routes/doctor-routes/availability.routes.js`
5. Create doctor availability controller methods
6. Create `/backend/routes/doctor-routes/review.routes.js` (or check if can reuse patient review controller)
7. Create doctor review controller methods
8. Update `server.js` to include new routes
9. Test all endpoints

