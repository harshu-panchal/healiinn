# Frontend Environment Variables Checklist

## ✅ Required Environment Variables

### 🔴 CRITICAL (Must be set)

1. **VITE_API_BASE_URL** - Backend API base URL
   - Development: `http://localhost:5000/api`
   - Production: `https://your-backend-domain.com/api`
   - **Important**: Must include `/api` suffix
   - Socket.IO automatically removes `/api` suffix for socket connection

## 📝 How It Works

### API Client
- Uses: `VITE_API_BASE_URL` (with `/api` suffix)
- Example: `http://localhost:5000/api`
- Used in: `apiClient.js`, all service files

### Socket.IO Client
- Uses: `VITE_API_BASE_URL` but removes `/api` suffix automatically
- Example: If `VITE_API_BASE_URL=http://localhost:5000/api`, Socket.IO connects to `http://localhost:5000`
- Used in: `socketClient.js`, `NotificationContext.jsx`

### Image URLs
- Uses: `VITE_API_BASE_URL` (without `/api` suffix for uploads)
- Example: `http://localhost:5000` for `/uploads/` paths
- Used in: Profile pages for image display

## 🔧 Current Implementation

### apiClient.js
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
```

### socketClient.js
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const SOCKET_URL = API_BASE_URL.replace('/api', '').replace(/\/$/, '')
```

### Profile Pages (Image URLs)
```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
// Then removes /api for image paths: http://localhost:5000/uploads/...
```

## ⚠️ Important Notes

1. **Vite Environment Variables**: All must be prefixed with `VITE_`
2. **Restart Required**: After changing `.env`, restart dev server (`npm run dev`)
3. **Socket.IO**: Automatically handles `/api` suffix removal - no separate variable needed
4. **No Session Store**: Frontend uses JWT tokens stored in localStorage/sessionStorage
5. **No Additional Socket Config**: Socket.IO configuration is handled automatically

## ✅ Verification Checklist

Before deploying, ensure:
- [ ] `VITE_API_BASE_URL` is set correctly
- [ ] For development: `http://localhost:5000/api`
- [ ] For production: Your production backend URL with `/api` suffix
- [ ] Backend server is running and accessible
- [ ] Socket.IO connection works (check browser console)

## 🚀 Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `VITE_API_BASE_URL` in `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. Restart development server:
   ```bash
   npm run dev
   ```

## 📋 Summary

**Only ONE environment variable is required:**
- `VITE_API_BASE_URL` - Backend API base URL (with `/api` suffix)

**No additional variables needed for:**
- Socket.IO (uses same URL, removes `/api` automatically)
- Session management (uses JWT tokens in browser storage)
- Authentication (handled via JWT tokens)

