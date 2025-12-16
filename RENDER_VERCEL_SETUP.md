# Render + Vercel Setup Guide for Audio Calls

## Environment Variables Configuration

### Backend (Render.com)

In your Render dashboard → Environment Variables, add:

```env
# ===== CRITICAL: mediasoup Configuration =====
# Use your Render service URL (without https://)
# This can be a domain name (e.g., healiinn.onrender.com) or IP address
# The code will automatically handle domain names by listening on 0.0.0.0
PUBLIC_IP=healiinn.onrender.com

# UDP port range for RTP media traffic
MEDIA_UDP_MIN=40000
MEDIA_UDP_MAX=49999

# ===== Socket.IO CORS =====
# Add your Vercel frontend URL
SOCKET_IO_CORS_ORIGIN=https://healiinnx.vercel.app,https://www.healiinnx.vercel.app
FRONTEND_URL=https://healiinnx.vercel.app

# ===== Other Required Variables =====
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
# ... (other existing variables)
```

### Frontend (Vercel)

In your Vercel dashboard → Project Settings → Environment Variables, add:

```env
# ===== CRITICAL: API Configuration =====
# Your Render backend URL
VITE_API_BASE_URL=https://healiinn.onrender.com/api
```

## Render-Specific Configuration

### 1. Public IP Setting

**Important**: Render services have dynamic IPs, so use your service URL:

```env
PUBLIC_IP=healiinn.onrender.com
```

**NOT**:

- ❌ `127.0.0.1`
- ❌ `localhost`
- ❌ The actual IP address (it changes)

### 2. Firewall/Port Configuration

Render automatically handles port forwarding, but you need to:

1. **In Render Dashboard**:

   - Go to your service → Settings
   - Ensure "Auto-Deploy" is enabled
   - Check that the service is running

2. **UDP Ports**: Render should handle UDP ports automatically, but if you have issues:
   - Contact Render support about UDP port access
   - Or use a TURN server (recommended for production)

### 3. TURN Server (Recommended for Production)

Since Render may have NAT/firewall restrictions, use a TURN server:

**Option A: Use a free TURN service**

```env
# Example: Using Metered.ca free TURN
TURN_URIS=turn:openrelay.metered.ca:80,turn:openrelay.metered.ca:443,turn:openrelay.metered.ca:443?transport=tcp
TURN_USER=openrelay
TURN_PASS=openrelay
```

**Option B: Set up your own TURN server**

- Use a service like Twilio, Metered, or self-hosted coturn
- Add credentials to Render environment variables

### 4. Render Service Health Check

Ensure your Render service has proper health checks:

1. Go to Render Dashboard → Your Service → Settings
2. Set Health Check Path: `/api/health` (or your health endpoint)
3. Ensure service stays "Live"

## Vercel-Specific Configuration

### 1. Environment Variables

Add in Vercel Dashboard → Project → Settings → Environment Variables:

```env
VITE_API_BASE_URL=https://healiinn.onrender.com/api
```

**Important**:

- Use `https://` (not `http://`)
- Include `/api` at the end
- No trailing slash

### 2. Vercel Deployment Settings

1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

### 3. CORS Configuration

The backend already includes Vercel URLs in CORS, but verify in `backend/config/socket.js`:

```javascript
const productionOrigins = [
  "https://healiinnx.vercel.app",
  "https://www.healiinnx.vercel.app",
];
```

## Testing Your Setup

### Step 1: Verify Backend Environment Variables

1. Go to Render Dashboard → Your Service → Environment
2. Verify these are set:
   - ✅ `PUBLIC_IP=healiinn.onrender.com`
   - ✅ `MEDIA_UDP_MIN=40000`
   - ✅ `MEDIA_UDP_MAX=49999`
   - ✅ `SOCKET_IO_CORS_ORIGIN` includes your Vercel URL

### Step 2: Verify Frontend Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify:
   - ✅ `VITE_API_BASE_URL=https://healiinn.onrender.com/api`

### Step 3: Restart Services

1. **Render**: Go to Manual Deploy → Clear build cache & deploy
2. **Vercel**: Trigger a new deployment (or it auto-deploys)

### Step 4: Test Connection

1. Open browser console on your Vercel frontend
2. Check for Socket.IO connection:
   ```
   ✅ Socket.IO connected for doctor/patient
   ```
3. If you see connection errors, check:
   - CORS configuration
   - Environment variables are correct
   - Both services are running

## Common Issues & Solutions

### Issue 1: "Connection Failed" or "No Audio"

**Cause**: PUBLIC_IP not set correctly or TURN server needed

**Solution**:

1. Verify `PUBLIC_IP=healiinn.onrender.com` in Render
2. Add TURN server configuration (see above)
3. Restart Render service

### Issue 2: CORS Errors

**Error**: `Access to fetch at 'https://healiinn.onrender.com' from origin 'https://healiinnx.vercel.app' has been blocked by CORS policy`

**Solution**:

1. In Render, add to environment variables:
   ```env
   SOCKET_IO_CORS_ORIGIN=https://healiinnx.vercel.app,https://www.healiinnx.vercel.app
   FRONTEND_URL=https://healiinnx.vercel.app
   ```
2. Restart Render service

### Issue 3: Socket.IO Connection Timeout

**Error**: `Socket.IO: Connection timeout`

**Solution**:

1. Verify `VITE_API_BASE_URL` in Vercel matches your Render URL
2. Check Render service is "Live" (not sleeping)
3. Verify Render service URL is correct

### Issue 4: Call Status Shows "ended" Immediately

**Cause**: PUBLIC_IP incorrect or mediasoup worker failed

**Solution**:

1. Check Render logs for mediasoup errors
2. Verify `PUBLIC_IP=healiinn.onrender.com` (your actual Render service name)
3. Ensure UDP ports are accessible (may need TURN server)

### Issue 5: Render Service Goes to Sleep

**Solution**:

1. Render free tier services sleep after 15 minutes of inactivity
2. Upgrade to paid plan for always-on service
3. Or use a service like UptimeRobot to ping your service every 5 minutes

## Production Checklist

- [ ] `PUBLIC_IP` set to your Render service URL (e.g., `healiinn.onrender.com`)
- [ ] `VITE_API_BASE_URL` set to your Render API URL (e.g., `https://healiinn.onrender.com/api`)
- [ ] CORS configured with Vercel URLs
- [ ] TURN server configured (recommended)
- [ ] Both services deployed and running
- [ ] Test call from Vercel frontend to Render backend
- [ ] Check browser console for errors
- [ ] Check Render logs for mediasoup errors

## Quick Start Commands

### Render (Backend)

```bash
# In Render Dashboard → Environment Variables, add:
PUBLIC_IP=healiinn.onrender.com
MEDIA_UDP_MIN=40000
MEDIA_UDP_MAX=49999
SOCKET_IO_CORS_ORIGIN=https://healiinnx.vercel.app
FRONTEND_URL=https://healiinnx.vercel.app
```

### Vercel (Frontend)

```bash
# In Vercel Dashboard → Environment Variables, add:
VITE_API_BASE_URL=https://healiinn.onrender.com/api
```

**Then restart both services!**
