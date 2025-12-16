# Audio Call Environment Variables Setup Guide

## Critical Environment Variables Required

### Backend `.env` File

Add these variables to your `backend/.env` file:

```env
# ===== CRITICAL: mediasoup Configuration =====
# PUBLIC_IP is the MOST IMPORTANT variable for audio calls to work
# For localhost development: use your local IP (e.g., 192.168.1.100)
# For production: use your server's public IP or domain name
PUBLIC_IP=your-server-public-ip-or-domain

# UDP port range for RTP media traffic
# Default: 40000-49999 (ensure these ports are open in firewall)
MEDIA_UDP_MIN=40000
MEDIA_UDP_MAX=49999

# ===== Optional but Recommended: TURN Server =====
# TURN server helps with NAT traversal (required for users behind firewalls)
# Format: turn:host:port (comma-separated for multiple servers)
TURN_URIS=turn:your-turn-server.com:3478
TURN_USER=your-turn-username
TURN_PASS=your-turn-password
```

### Frontend `.env` File

Add this to your `frontend/.env` file:

```env
# API Base URL - must match your backend server
VITE_API_BASE_URL=http://localhost:5000/api
# For production: https://your-domain.com/api
```

## How to Find Your PUBLIC_IP

### For Local Development:
1. **Windows**: Open Command Prompt and run:
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x)

2. **Mac/Linux**: Open Terminal and run:
   ```bash
   ifconfig | grep "inet "
   ```
   Or:
   ```bash
   ip addr show
   ```

3. Use the IP address that's NOT `127.0.0.1` (usually `192.168.x.x` or `10.x.x.x`)

### For Production (Cloud Servers):
- **AWS EC2**: Use the public IP or Elastic IP from EC2 console
- **Heroku/Render**: Use your app's domain name (e.g., `healiinn.onrender.com`)
- **DigitalOcean/Linode**: Use the droplet's public IP from the dashboard

## Common Issues and Solutions

### Issue 1: Call Status Shows "ended" Immediately After Starting

**Root Cause**: `PUBLIC_IP` is set to `127.0.0.1` or `localhost`, which doesn't work for WebRTC.

**Solution**: 
1. Set `PUBLIC_IP` to your actual public IP or domain
2. Restart the backend server
3. Clear browser cache and try again

### Issue 2: "Connection Failed" or "No Audio"

**Possible Causes**:
1. **Firewall blocking UDP ports**: Ensure ports 40000-49999 are open
2. **PUBLIC_IP incorrect**: Verify it's accessible from the internet
3. **TURN server not configured**: Required for users behind NAT/firewalls

**Solutions**:
```bash
# Check if ports are open (Linux/Mac)
sudo ufw status
# If not open, allow them:
sudo ufw allow 40000:49999/udp

# For cloud providers, add inbound rules in security groups:
# - Protocol: UDP
# - Port Range: 40000-49999
# - Source: 0.0.0.0/0 (or specific IPs)
```

### Issue 3: Works Locally But Not Remotely

**Solution**: 
1. Set `PUBLIC_IP` to your server's public IP/domain (NOT localhost)
2. Ensure firewall allows UDP ports 40000-49999
3. Configure TURN server for NAT traversal

### Issue 4: "mediasoup worker died" Error

**Solution**:
1. Check if UDP ports 40000-49999 are available
2. Verify `PUBLIC_IP` is set correctly
3. Check server logs for detailed error messages

## Testing Your Configuration

### Step 1: Verify Environment Variables
```bash
# Backend
cd backend
node -e "console.log('PUBLIC_IP:', process.env.PUBLIC_IP)"
node -e "console.log('MEDIA_UDP_MIN:', process.env.MEDIA_UDP_MIN)"
node -e "console.log('MEDIA_UDP_MAX:', process.env.MEDIA_UDP_MAX)"
```

### Step 2: Check Backend Logs
When you start the backend, you should see:
```
✅ mediasoup worker created [pid:XXXX]
```

If you see errors, check:
- Are UDP ports available?
- Is PUBLIC_IP set correctly?

### Step 3: Test Call Flow
1. Start backend server
2. Open doctor app in one browser
3. Open patient app in another browser (or incognito)
4. Initiate call from doctor
5. Accept call from patient
6. Check browser console for errors

## Production Checklist

- [ ] `PUBLIC_IP` set to production domain/IP
- [ ] `MEDIA_UDP_MIN` and `MEDIA_UDP_MAX` configured
- [ ] Firewall allows UDP ports 40000-49999
- [ ] TURN server configured (recommended)
- [ ] HTTPS enabled (required for WebRTC in production)
- [ ] Backend server restarted after env changes
- [ ] Browser console checked for errors

## Quick Fix for Your Current Issue

Based on your console logs, the most likely issue is:

1. **PUBLIC_IP is not set correctly** - Set it to your actual server IP/domain
2. **Call status being set to 'ended' prematurely** - This is a code issue we already fixed

**Immediate Action**:
1. Add `PUBLIC_IP` to `backend/.env`:
   ```env
   PUBLIC_IP=your-actual-ip-or-domain
   ```
2. Restart your backend server
3. Try the call again

If you're using Render.com or similar:
```env
PUBLIC_IP=healiinn.onrender.com
```

If you're on localhost but testing from different devices:
```env
PUBLIC_IP=192.168.1.100  # Your local network IP
```

