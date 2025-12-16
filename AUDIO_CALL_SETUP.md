# Audio Call Feature - Setup and Testing Guide

## Overview

This document provides setup instructions, environment variable configuration, port range requirements, and testing procedures for the one-to-one audio call feature using mediasoup SFU.

## Architecture

- **Backend**: Node.js + Express with mediasoup worker
- **Frontend**: React (Vite) with mediasoup-client
- **Signaling**: Socket.IO for WebRTC signaling
- **Storage**: MongoDB for call records
- **SFU**: mediasoup (Selective Forwarding Unit) for audio routing

## Prerequisites

1. Node.js (v16 or higher)
2. MongoDB database
3. Public IP address or domain name for the server
4. Firewall access for UDP ports (MEDIA_UDP_MIN to MEDIA_UDP_MAX)
5. (Optional) TURN server (coturn) for NAT traversal

## Installation

### Backend Dependencies

```bash
cd backend
npm install mediasoup
```

### Frontend Dependencies

```bash
cd frontend
npm install mediasoup-client
```

## Environment Variables

Add the following variables to your `backend/.env` file:

```env
# mediasoup Configuration
PUBLIC_IP=your-server-public-ip-or-domain
MEDIA_UDP_MIN=40000
MEDIA_UDP_MAX=49999

# TURN Server (coturn) - Optional, for NAT traversal
# Format: turn:host:port (comma-separated for multiple servers)
TURN_URIS=turn:your-turn-server.com:3478
TURN_USER=your-turn-username
TURN_PASS=your-turn-password
```

### Environment Variable Details

- **PUBLIC_IP**: The public IP address or domain name of your server. This is used for WebRTC ICE candidates.
- **MEDIA_UDP_MIN/MEDIA_UDP_MAX**: UDP port range for RTP media traffic. Default: 40000-49999.
- **TURN_URIS**: Comma-separated list of TURN server URIs (optional). Required for users behind restrictive NATs.
- **TURN_USER**: TURN server username (if using TURN).
- **TURN_PASS**: TURN server password (if using TURN).

## Port Configuration

### Required Ports

1. **HTTP/HTTPS Port**: Your main server port (default: 5000)
2. **WebSocket Port**: Same as HTTP port (Socket.IO uses same port)
3. **UDP Port Range**: MEDIA_UDP_MIN to MEDIA_UDP_MAX (default: 40000-49999)

### Firewall Configuration

Ensure the following ports are open in your firewall:

```bash
# HTTP/HTTPS (adjust port as needed)
sudo ufw allow 5000/tcp

# UDP port range for media
sudo ufw allow 40000:49999/udp
```

For AWS EC2, Azure, or other cloud providers:
- Add inbound rules for TCP port 5000 (or your server port)
- Add inbound rules for UDP ports 40000-49999

## TURN Server Setup (Optional but Recommended)

### Using coturn

1. Install coturn:
```bash
sudo apt-get update
sudo apt-get install coturn
```

2. Configure `/etc/turnserver.conf`:
```
listening-port=3478
realm=your-domain.com
user=username:password
```

3. Start coturn:
```bash
sudo systemctl start coturn
sudo systemctl enable coturn
```

4. Update environment variables:
```env
TURN_URIS=turn:your-domain.com:3478
TURN_USER=username
TURN_PASS=password
```

## Database Schema

The Call model stores call records in MongoDB:

```javascript
{
  callId: String (unique),
  appointmentId: ObjectId,
  doctorId: ObjectId,
  patientId: ObjectId,
  status: 'initiated' | 'accepted' | 'ended' | 'missed' | 'declined',
  startTime: Date,
  endTime: Date,
  durationSeconds: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Socket.IO Events

### Call Lifecycle Events

- `call:initiate` - Doctor initiates call (payload: `{ appointmentId }`)
- `call:invite` - Server sends invite to patient (payload: `{ callId, appointmentId, doctorName }`)
- `call:accept` - Patient accepts call (payload: `{ callId }`)
- `call:decline` - Patient declines call (payload: `{ callId }`)
- `call:end` - Either party ends call (payload: `{ callId }`)
- `call:accepted` - Server notifies doctor that patient accepted
- `call:declined` - Server notifies doctor that patient declined
- `call:ended` - Server notifies all participants that call ended
- `call:error` - Error occurred during call

### mediasoup Events

- `mediasoup:getRtpCapabilities` - Get router RTP capabilities
- `mediasoup:createWebRtcTransport` - Create WebRTC transport
- `mediasoup:connectTransport` - Connect transport with DTLS
- `mediasoup:produce` - Start producing audio
- `mediasoup:consume` - Start consuming remote audio
- `mediasoup:newProducer` - New producer available (broadcast to other participants)

## Testing Checklist

### 1. Doctor Initiates Call

- [ ] Doctor navigates to Patients page
- [ ] Doctor sees "Audio Call" button for appointments with `consultationMode='call'`
- [ ] Button is visible for confirmed/scheduled appointments
- [ ] Doctor clicks "Audio Call" button
- [ ] Verify call record created in MongoDB with status='initiated'
- [ ] Verify patient receives `call:invite` socket event
- [ ] Verify doctor receives `call:initiated` confirmation

### 2. Patient Receives Invite

- [ ] Patient sees incoming call modal
- [ ] Modal displays doctor name and appointment details
- [ ] Modal shows "Join" and "Decline" buttons
- [ ] Modal is non-dismissible (must choose action)

### 3. Patient Accepts Call

- [ ] Patient clicks "Join" button
- [ ] Verify call record updated to status='accepted' in MongoDB
- [ ] Verify popup window opens with call UI
- [ ] Verify doctor receives `call:accepted` event
- [ ] Verify doctor's popup window opens
- [ ] Verify `startTime` is set in call record

### 4. Audio Stream Flow

- [ ] Both parties see "Connecting..." status
- [ ] Microphone permission requested (if not already granted)
- [ ] Local audio track created successfully
- [ ] Remote audio track received and playing
- [ ] Both parties can hear each other
- [ ] Audio quality is acceptable (no significant delay or distortion)

### 5. Call Controls

- [ ] Mute/Unmute button works correctly
- [ ] Muted state is reflected in UI
- [ ] Remote party cannot hear when muted
- [ ] End call button is visible and functional

### 6. Call End

- [ ] Either party clicks "End call"
- [ ] Verify call record updated with `endTime` and `durationSeconds`
- [ ] Verify status='ended' in MongoDB
- [ ] Verify both popup windows close
- [ ] Verify `call:ended` event received by both parties
- [ ] Verify mediasoup resources cleaned up

### 7. Edge Cases

- [ ] Patient declines call
  - [ ] Verify status='declined' in MongoDB
  - [ ] Verify doctor receives `call:declined` event
  - [ ] Verify no popup opens

- [ ] Patient doesn't respond (timeout - if implemented)
  - [ ] Verify status='missed' after timeout
  - [ ] Verify doctor notified

- [ ] Network disconnection
  - [ ] Verify call ends gracefully
  - [ ] Verify call record updated with endTime
  - [ ] Verify cleanup occurs

- [ ] Multiple call attempts
  - [ ] Verify only one active call per appointment
  - [ ] Verify error message if call already in progress

- [ ] TURN fallback (if TURN configured)
  - [ ] Block UDP ports on server
  - [ ] Verify TURN server used for connection
  - [ ] Verify audio still works

### 8. Browser Compatibility

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if supported)
- [ ] Mobile browsers (Chrome Mobile, Safari Mobile)

## Manual Testing Steps

### Basic Flow Test

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login as Doctor**:
   - Navigate to `/doctor/login`
   - Login with doctor credentials
   - Go to `/doctor/patients`

4. **Login as Patient** (in different browser/incognito):
   - Navigate to `/patient/login`
   - Login with patient credentials
   - Go to `/patient/appointments`

5. **Initiate Call**:
   - As doctor, find an appointment with `consultationMode='call'`
   - Click "Audio Call" button
   - Verify patient sees incoming call modal

6. **Accept Call**:
   - As patient, click "Join" in modal
   - Verify popup windows open for both
   - Verify audio connection established

7. **Test Controls**:
   - Test mute/unmute
   - Test end call
   - Verify call duration displayed

8. **Verify Database**:
   - Check MongoDB Call collection
   - Verify call record with correct status, startTime, endTime, durationSeconds

## Troubleshooting

### Common Issues

1. **"Failed to initialize mediasoup worker"**
   - Check if UDP ports are available
   - Verify PUBLIC_IP is set correctly
   - Check server logs for detailed error

2. **"Microphone permission denied"**
   - User must grant microphone permission
   - Check browser settings
   - Verify HTTPS in production (required for getUserMedia)

3. **"Connection failed" or "No audio"**
   - Check firewall rules (UDP ports)
   - Verify TURN server if behind NAT
   - Check browser console for WebRTC errors
   - Verify PUBLIC_IP is accessible

4. **"Popup blocked"**
   - User must allow popups for the site
   - Check browser popup settings

5. **"Socket.IO connection failed"**
   - Verify backend server is running
   - Check CORS configuration
   - Verify authentication token is valid

### Debug Mode

Enable detailed logging:

```env
NODE_ENV=development
```

Check browser console and server logs for detailed error messages.

## Production Considerations

1. **HTTPS Required**: WebRTC requires HTTPS in production (except localhost)
2. **TURN Server**: Essential for users behind restrictive NATs
3. **Firewall**: Ensure UDP port range is open
4. **Monitoring**: Monitor call success rate, duration, errors
5. **Scaling**: Consider multiple mediasoup workers for high load
6. **Security**: Validate all socket events, rate limit call initiation

## Support

For issues or questions:
1. Check server logs: `backend/logs/` (if logging configured)
2. Check browser console for frontend errors
3. Verify environment variables are set correctly
4. Test with TURN server if connection issues persist

## Next Steps

- [ ] Implement call recording (if required)
- [ ] Add call quality metrics
- [ ] Implement reconnection logic
- [ ] Add call history UI
- [ ] Implement call timeout handling
- [ ] Add analytics for call success rates

