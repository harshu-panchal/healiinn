# Production Troubleshooting Guide - Audio Calls

## Common Issues: Works Locally But Not in Production

### 🔴 Issue 1: HTTPS Requirement

**Problem**: WebRTC requires HTTPS in production (except localhost)

**Symptoms**:
- Microphone permission denied
- `getUserMedia()` fails
- "NotAllowedError" in console

**Solution**:
- ✅ Ensure Vercel frontend uses HTTPS (automatic)
- ✅ Ensure Render backend uses HTTPS (automatic)
- ✅ Check browser console for HTTPS-related errors

**Check**:
```javascript
// In browser console:
console.log('Protocol:', window.location.protocol); // Should be 'https:'
```

---

### 🔴 Issue 2: TURN Server Not Configured

**Problem**: Render services are behind NAT/firewall, requiring TURN server for NAT traversal

**Symptoms**:
- Call connects but no audio
- ICE connection fails
- Transports show "failed" or "disconnected"
- Works locally but not between different networks

**Solution**: Add TURN server to Render environment variables

**Option A: Free TURN Service (Metered.ca) - For Testing Only**
```env
# In Render Dashboard → Environment Variables:
# ⚠️ WARNING: These are public/free credentials - rate-limited, not for production!
# Use only for testing. For production, get your own TURN server.
TURN_URIS=turn:openrelay.metered.ca:80,turn:openrelay.metered.ca:443,turn:openrelay.metered.ca:443?transport=tcp
TURN_USER=openrelay
TURN_PASS=openrelay
```

**✅ Yes, you can use these as-is for testing!**

**Limitations:**
- ⚠️ Rate-limited (may stop working under heavy load)
- ⚠️ Shared with other users (not reliable for production)
- ⚠️ No SLA or support
- ✅ Good for testing and development

**Option B: Paid TURN Service (Recommended for Production)**
- Twilio STUN/TURN: https://www.twilio.com/stun-turn
- Metered.ca: https://www.metered.ca/tools/openrelay
- Or self-hosted coturn

**Verify**: Check backend logs for TURN server usage:
```
✅ TURN servers configured: 3 servers
```

---

### 🔴 Issue 3: PUBLIC_IP Configuration

**Problem**: PUBLIC_IP not set correctly or using wrong format

**Symptoms**:
- "invalid IP" error (we fixed this)
- Transports fail to connect
- ICE candidates show wrong IP

**Solution**:
```env
# In Render Dashboard → Environment Variables:
PUBLIC_IP=healiinn.onrender.com  # Your actual Render service URL
```

**Verify**: Check Render service URL matches exactly:
1. Go to Render Dashboard → Your Service
2. Copy the service URL (e.g., `healiinn.onrender.com`)
3. Ensure `PUBLIC_IP` matches exactly (no `https://`, no trailing slash)

---

### 🔴 Issue 4: CORS Configuration

**Problem**: Socket.IO connection blocked by CORS

**Symptoms**:
- Socket.IO connection timeout
- CORS errors in browser console
- "Not allowed by CORS" errors

**Solution**:
```env
# In Render Dashboard → Environment Variables:
SOCKET_IO_CORS_ORIGIN=https://healiinnx.vercel.app,https://www.healiinnx.vercel.app
FRONTEND_URL=https://healiinnx.vercel.app
```

**Verify**: Check browser console for CORS errors:
```
❌ Access to fetch at 'https://healiinn.onrender.com' from origin 'https://healiinnx.vercel.app' has been blocked by CORS policy
```

---

### 🔴 Issue 5: Render Service Sleeping

**Problem**: Render free tier services sleep after 15 minutes of inactivity

**Symptoms**:
- Socket.IO connection timeout
- First call attempt fails, subsequent attempts work
- Service shows "Sleeping" status

**Solution**:
1. **Upgrade to paid plan** (always-on service)
2. **Or use UptimeRobot** to ping service every 5 minutes:
   - Sign up at https://uptimerobot.com
   - Add monitor: URL = `https://healiinn.onrender.com/api/health`
   - Interval: 5 minutes

**Check**: Render Dashboard → Your Service → Status should be "Live" not "Sleeping"

---

### 🔴 Issue 6: UDP Port Restrictions

**Problem**: Render may restrict UDP ports or have firewall issues

**Symptoms**:
- Transports fail to connect
- ICE connection fails
- "Connection failed" errors

**Solution**:
1. **Use TURN server** (recommended - handles UDP restrictions)
2. **Contact Render support** about UDP port access
3. **Check Render logs** for UDP-related errors

**Verify**: Check backend logs:
```
✅ mediasoup worker created [pid:XXXX]
```

If you see errors about ports, UDP is likely blocked.

---

### 🔴 Issue 7: Environment Variables Not Set

**Problem**: Environment variables missing or incorrect in production

**Symptoms**:
- Various errors depending on missing variable
- Calls fail at different stages

**Checklist** - Render Backend:
```env
✅ PUBLIC_IP=healiinn.onrender.com
✅ MEDIA_UDP_MIN=40000
✅ MEDIA_UDP_MAX=49999
✅ NODE_ENV=production
✅ SOCKET_IO_CORS_ORIGIN=https://healiinnx.vercel.app
✅ FRONTEND_URL=https://healiinnx.vercel.app
✅ TURN_URIS=turn:openrelay.metered.ca:80,...
✅ TURN_USER=openrelay
✅ TURN_PASS=openrelay
✅ MONGODB_URI=your-mongodb-uri
✅ JWT_SECRET=your-secret
```

**Checklist** - Vercel Frontend:
```env
✅ VITE_API_BASE_URL=https://healiinn.onrender.com/api
```

**Verify**: 
- Render: Dashboard → Environment → Check all variables
- Vercel: Dashboard → Settings → Environment Variables → Check all variables

---

### 🔴 Issue 8: Microphone Permission Denied

**Problem**: Browser blocking microphone access in production

**Symptoms**:
- "Permission denied" error
- Microphone icon shows blocked
- getUserMedia() fails

**Solution**:
1. **Check browser permissions**:
   - Chrome: Settings → Privacy → Site Settings → Microphone
   - Ensure site has microphone permission
2. **Check HTTPS**: Must be HTTPS (not HTTP)
3. **Check browser console** for permission errors

**Verify**: In browser console:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('✅ Microphone access granted'))
  .catch(err => console.error('❌ Microphone error:', err));
```

---

### 🔴 Issue 9: Socket.IO Connection Issues

**Problem**: Socket.IO not connecting in production

**Symptoms**:
- "Socket.IO: Connection timeout"
- Socket not available errors
- Call initiation fails

**Debugging Steps**:

1. **Check Socket.IO URL**:
   ```javascript
   // In browser console:
   console.log('Socket URL:', import.meta.env.VITE_API_BASE_URL);
   // Should be: https://healiinn.onrender.com/api
   ```

2. **Check Socket Connection**:
   ```javascript
   // In browser console (after page loads):
   // Look for: ✅ Socket.IO connected for doctor/patient
   ```

3. **Check Render Logs**:
   - Go to Render Dashboard → Your Service → Logs
   - Look for Socket.IO connection errors
   - Check for authentication errors

4. **Verify CORS**:
   - Check browser console for CORS errors
   - Ensure `SOCKET_IO_CORS_ORIGIN` includes your Vercel URL

---

### 🔴 Issue 10: Network/Firewall Restrictions

**Problem**: Corporate firewalls or network restrictions blocking WebRTC

**Symptoms**:
- Works on some networks but not others
- ICE connection fails
- Transports show "failed"

**Solution**:
1. **Test on different networks** (mobile data, different WiFi)
2. **Use TURN server** (bypasses most firewalls)
3. **Check network restrictions**:
   - Corporate firewalls often block WebRTC
   - Some ISPs restrict UDP traffic

---

## Step-by-Step Debugging Process

### Step 1: Check Browser Console

Open browser console (F12) and look for:

**Good Signs**:
```
✅ Socket.IO connected for doctor/patient
✅ mediasoup worker created
✅ Transport created
✅ Producer created
✅ Consumer created
```

**Bad Signs**:
```
❌ Socket.IO: Connection timeout
❌ Permission denied
❌ CORS error
❌ Transport failed
❌ ICE connection failed
```

### Step 2: Check Render Logs

Go to Render Dashboard → Your Service → Logs

**Look for**:
- mediasoup worker creation
- Transport creation errors
- Socket.IO connection errors
- TURN server configuration

**Good Signs**:
```
✅ mediasoup worker created [pid:XXXX]
✅ Transport created: XXXXX for callId: XXXXX
✅ TURN servers configured: X servers
```

**Bad Signs**:
```
❌ Error creating transport
❌ Invalid IP
❌ Transport failed
❌ Router not found
```

### Step 3: Check Network Tab

In browser DevTools → Network tab:

1. **Check Socket.IO connection**:
   - Look for WebSocket connection to Render
   - Status should be "101 Switching Protocols"
   - Should see Socket.IO handshake

2. **Check API calls**:
   - Verify API calls go to correct Render URL
   - Check for 404 or CORS errors

### Step 4: Test Microphone Access

In browser console:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone OK');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Microphone Error:', err));
```

### Step 5: Test Socket.IO Connection

In browser console (after page loads):
```javascript
// Check if socket is connected
const socket = window.socket; // Or however you access socket
console.log('Socket connected:', socket?.connected);
console.log('Socket ID:', socket?.id);
```

---

## Quick Fix Checklist

Run through this checklist in order:

- [ ] **PUBLIC_IP** set correctly in Render (`healiinn.onrender.com`)
- [ ] **VITE_API_BASE_URL** set correctly in Vercel (`https://healiinn.onrender.com/api`)
- [ ] **TURN server** configured in Render (critical for production)
- [ ] **CORS** configured with Vercel URL in Render
- [ ] **HTTPS** enabled (automatic on Render/Vercel)
- [ ] **Microphone permission** granted in browser
- [ ] **Render service** is "Live" (not sleeping)
- [ ] **Socket.IO** connects successfully (check console)
- [ ] **Browser console** checked for errors
- [ ] **Render logs** checked for errors

---

## Most Common Production Issues (Priority Order)

1. **🔴 TURN Server Not Configured** (90% of production issues)
   - **Fix**: Add TURN server to Render environment variables
   - **Why**: Render services are behind NAT, need TURN for NAT traversal

2. **🔴 PUBLIC_IP Incorrect**
   - **Fix**: Set to your Render service URL exactly
   - **Why**: WebRTC needs correct IP/domain for ICE candidates

3. **🔴 CORS Not Configured**
   - **Fix**: Add Vercel URL to `SOCKET_IO_CORS_ORIGIN`
   - **Why**: Browser blocks cross-origin Socket.IO connections

4. **🔴 Service Sleeping**
   - **Fix**: Upgrade to paid plan or use UptimeRobot
   - **Why**: Free tier sleeps after inactivity

5. **🔴 Microphone Permission**
   - **Fix**: Grant permission in browser settings
   - **Why**: Browser blocks microphone without permission

---

## Still Not Working?

If you've checked all the above:

1. **Share browser console logs** (all errors)
2. **Share Render logs** (last 100 lines)
3. **Share network tab** (Socket.IO connection details)
4. **Test on different browser** (Chrome, Firefox, Safari)
5. **Test on different network** (mobile data vs WiFi)

This will help identify the specific issue.

