# TURN Server Setup Guide

## Quick Answer: Can I Use the Free TURN Server?

**Yes, you can use these values as-is for testing:**

```env
TURN_URIS=turn:openrelay.metered.ca:80,turn:openrelay.metered.ca:443,turn:openrelay.metered.ca:443?transport=tcp
TURN_USER=openrelay
TURN_PASS=openrelay
```

**However**, these are **public/free credentials** with limitations:

### ⚠️ Limitations of Free TURN Server

1. **Rate Limited**: May stop working if too many requests
2. **Shared Service**: Used by many users, not reliable for production
3. **No Support**: No SLA or customer support
4. **May Be Blocked**: Could be blocked or rate-limited at any time

### ✅ When to Use Free TURN Server

- ✅ **Testing/Development**: Perfect for testing your implementation
- ✅ **Low Traffic**: Works fine for occasional calls
- ✅ **Proof of Concept**: Good for demonstrating functionality

### ❌ When NOT to Use Free TURN Server

- ❌ **Production**: Not reliable for production use
- ❌ **High Traffic**: Will fail under heavy load
- ❌ **Commercial Use**: May violate terms of service
- ❌ **Critical Applications**: No SLA or guarantee

---

## For Production: Get Your Own TURN Server

### Option 1: Metered.ca (Recommended - Easy Setup)

1. **Sign up**: https://www.metered.ca/stun-turn
2. **Get credentials**: They provide TURN server URLs and credentials
3. **Add to Render**:
   ```env
   TURN_URIS=turn:your-domain.metered.ca:80,turn:your-domain.metered.ca:443
   TURN_USER=your-username
   TURN_PASS=your-password
   ```

**Pricing**: Free tier available, paid plans start at $10/month

---

### Option 2: Twilio STUN/TURN (Reliable, Paid)

1. **Sign up**: https://www.twilio.com/stun-turn
2. **Get credentials**: They provide TURN server URLs
3. **Add to Render**:
   ```env
   TURN_URIS=turn:global.stun.twilio.com:3478?transport=udp,turn:global.stun.twilio.com:3478?transport=tcp
   TURN_USER=your-twilio-username
   TURN_PASS=your-twilio-password
   ```

**Pricing**: Pay-as-you-go, very reliable

---

### Option 3: Self-Hosted coturn (Advanced)

1. **Set up coturn server** on a VPS (DigitalOcean, AWS, etc.)
2. **Configure coturn** with your domain
3. **Add to Render**:
   ```env
   TURN_URIS=turn:your-turn-server.com:3478
   TURN_USER=your-username
   TURN_PASS=your-password
   ```

**Pricing**: VPS costs (~$5-10/month)

---

## Step-by-Step: Using Free TURN Server (For Testing)

### Step 1: Add to Render Environment Variables

1. Go to **Render Dashboard** → Your Service → **Environment**
2. Click **"Add Environment Variable"**
3. Add these three variables:

```env
TURN_URIS=turn:openrelay.metered.ca:80,turn:openrelay.metered.ca:443,turn:openrelay.metered.ca:443?transport=tcp
TURN_USER=openrelay
TURN_PASS=openrelay
```

### Step 2: Restart Render Service

1. Go to **Render Dashboard** → Your Service
2. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
3. Wait for deployment to complete

### Step 3: Verify TURN Server is Working

Check Render logs for:
```
✅ TURN servers configured: 3 servers
```

Or check browser console during a call - you should see TURN servers being used in ICE candidates.

---

## Testing Your TURN Server

### Test 1: Check Backend Logs

In Render Dashboard → Logs, look for:
```
✅ TURN servers configured: X servers
```

### Test 2: Check Browser Console

During a call, check WebRTC stats:
```javascript
// In browser console during a call:
const pc = /* your peer connection */;
pc.getStats().then(stats => {
  stats.forEach(report => {
    if (report.type === 'candidate-pair' && report.selected) {
      console.log('ICE Candidate Type:', report.localCandidate?.candidateType);
      // Should show 'relay' if TURN is being used
    }
  });
});
```

### Test 3: Test Call Between Different Networks

- Doctor on WiFi
- Patient on Mobile Data
- If call works, TURN server is working!

---

## Recommended Setup for Production

### Minimum Setup:
1. **Sign up for Metered.ca** (free tier or paid)
2. **Get your own credentials**
3. **Add to Render environment variables**
4. **Test thoroughly**

### Why Get Your Own?

- ✅ **Reliability**: Dedicated resources
- ✅ **No Rate Limits**: Works under heavy load
- ✅ **Support**: Customer support available
- ✅ **Monitoring**: Usage statistics and monitoring
- ✅ **Compliance**: Meets production requirements

---

## Quick Comparison

| Feature | Free (openrelay) | Metered.ca Paid | Twilio | Self-Hosted |
|---------|------------------|------------------|--------|-------------|
| **Cost** | Free | $10+/month | Pay-as-you-go | $5-10/month |
| **Reliability** | Low | High | Very High | High |
| **Setup Time** | Instant | 5 minutes | 10 minutes | 1-2 hours |
| **Support** | None | Yes | Yes | Self-support |
| **Rate Limits** | Yes | No | No | No |
| **Best For** | Testing | Production | Enterprise | Custom needs |

---

## Summary

**For Testing (Now)**:
```env
✅ Use these values as-is:
TURN_URIS=turn:openrelay.metered.ca:80,turn:openrelay.metered.ca:443,turn:openrelay.metered.ca:443?transport=tcp
TURN_USER=openrelay
TURN_PASS=openrelay
```

**For Production (Later)**:
- Sign up for Metered.ca or Twilio
- Get your own credentials
- Replace the values above with your credentials

**The free TURN server will work for testing**, but plan to upgrade to a paid service before going to production!

