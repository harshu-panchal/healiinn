# Frontend Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
# Backend API Base URL
# For development (local): http://localhost:5000/api
# For production: https://your-backend-domain.com/api
# Note: Must include /api suffix
# Socket.IO will automatically remove /api suffix for socket connection
VITE_API_BASE_URL=http://localhost:5000/api
```

## Development Setup

1. Copy the example:
   ```bash
   # In frontend directory
   cp .env.example .env
   ```

2. Update `.env` with your backend URL:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. Make sure your backend is running on port 5000

4. Restart the development server:
   ```bash
   npm run dev
   ```

## Production Setup

1. Update `.env` with your production backend URL:
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

2. Rebuild the frontend:
   ```bash
   npm run build
   ```

## Important Notes

- **All environment variables in Vite must be prefixed with `VITE_`**
- **After changing `.env`, restart the development server**
- **Never commit `.env` file to version control** (it's already in `.gitignore`)
- **Socket.IO Configuration**: Socket.IO automatically uses the same URL but removes `/api` suffix
  - Example: If `VITE_API_BASE_URL=http://localhost:5000/api`, Socket.IO connects to `http://localhost:5000`
- **No separate Socket.IO URL needed**: The code handles this automatically

## How It Works

### API Calls
- Uses: `VITE_API_BASE_URL` (with `/api` suffix)
- Example: `http://localhost:5000/api/patients/auth/login`

### Socket.IO Connection
- Uses: `VITE_API_BASE_URL` but removes `/api` suffix automatically
- Example: If `VITE_API_BASE_URL=http://localhost:5000/api`, Socket.IO connects to `http://localhost:5000`

### Image URLs
- Uses: Base URL without `/api` for upload paths
- Example: `http://localhost:5000/uploads/profiles/image.jpg`

