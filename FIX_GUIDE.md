# Fix Guide for Your Issues

## Issues Found:

### 1. WebSocket Error: `ws://localhost:443/ws`
**Source:** The rrweb-recorder script in `frontend/public/index.html` (line 26)
**Solution:** This is a third-party testing script that's trying to connect to a WebSocket server. You can safely ignore this error OR remove the script if you're not using it.

### 2. "User already exists" Error (400) with No Database
**Root Cause:** The error message is misleading. The actual problem is likely:
- Backend server is not running on the correct port
- CORS configuration issue
- Frontend is pointing to wrong backend URL

### 3. 401 Error on `/api/auth/login`
**Cause:** Authentication endpoint is being called before user registration completes

## Solutions:

### STEP 1: Start Backend Server Properly

Open a PowerShell terminal and run:
```powershell
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### STEP 2: Check Frontend Configuration

Create a `.env` file in the `frontend` folder with:
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

### STEP 3: Remove or Fix the WebSocket Script (Optional)

If you're not using the rrweb-recorder for testing, remove these lines from `frontend/public/index.html`:

Line 25-26:
```html
<script src="https://unpkg.com/rrweb@latest/dist/rrweb.min.js"></script>
<script src="https://d2adkz2s9zrlge.cloudfront.net/rrweb-recorder-20250919-1.js"></script>
```

### STEP 4: Clear MongoDB Data (if needed)

If you want to start fresh, run:
```python
# Run this script to clear the database
python -c "import asyncio; from motor.motor_asyncio import AsyncIOMotorClient; asyncio.run(AsyncIOMotorClient('mongodb://localhost:27017/').drop_database('penlink_database'))"
```

### STEP 5: Restart Everything

1. Stop backend (Ctrl+C)
2. Stop frontend (Ctrl+C)
3. Start backend: `cd backend && python -m uvicorn server:app --reload --port 8000`
4. Start frontend: `cd frontend && npm start`

## Verification Steps:

1. Check backend is running: http://localhost:8000/docs
2. Check frontend is running: http://localhost:3000
3. Try to register a new user
4. Check browser console for errors

## Common Issues:

### If you still get "User already exists":
- Clear browser cache and cookies
- Check if MongoDB has users: Run `python check_mongodb.py`
- Drop the database and try again

### If WebSocket errors persist:
- They're from the rrweb-recorder script (testing tool)
- Safe to ignore OR remove the script tags from index.html

### If 401 errors persist:
- Make sure you're registering first, not logging in
- Check that backend is running on port 8000
- Verify REACT_APP_BACKEND_URL is set correctly
