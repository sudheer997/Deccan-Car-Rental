# Deccan Car Rental - Login Instructions

## ✅ MongoDB Cloud Configuration

Your application is now connected to MongoDB Atlas Cloud:

- **Database:** `your_database_name`
- **Connection:** Working ✓
- **Data Migrated:**
  - 16 Cars ✓
  - 4 Reservations ✓
  - 1 Admin user ✓

## 🚀 How to Start the Application

### Option 1: Using the startup script
```bash
chmod +x start-server.sh
./start-server.sh
```

### Option 2: Manual start
```bash
npm start
```

## 🔐 Admin Login Credentials

**Username:** `admin`
**Password:** `admin123`

## 🌐 Access URLs

### Main Application
- **URL:** http://localhost:3000
- Click the "Admin Login" button on the homepage
- Enter your credentials

### Alternative Login Page (Recommended for Testing)
- **URL:** http://localhost:3000/admin-login.html
- Direct login page with debug logging
- Pre-filled credentials
- Shows detailed error messages

### Test Login API Directly
- **URL:** http://localhost:3000/test-login.html
- Simple test page to verify API connectivity

## ❌ Troubleshooting

### If login doesn't work:

1. **Verify the server is running:**
   ```bash
   curl http://localhost:3000/api/auth/login \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```
   Should return: `{"success":true,"data":{"token":"...","username":"admin"}}`

2. **Check admin credentials in database:**
   ```bash
   node check-admin.js
   ```

3. **Test password verification:**
   ```bash
   node test-password.js
   ```

4. **Clear browser cache:**
   - Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   - Clear cached images and files
   - Or use Incognito/Private mode

5. **Check browser console:**
   - Press F12
   - Click "Console" tab
   - Look for error messages in red

### Common Issues:

**Issue:** "404 Page Not Found"
- **Solution:** Make sure you're accessing `http://localhost:3000` not the preview URL

**Issue:** "Cannot connect to server"
- **Solution:** Verify the server is running with `npm start`

**Issue:** "Invalid credentials"
- **Solution:** Make sure you're typing exactly: `admin` and `admin123`

**Issue:** Login form doesn't appear
- **Solution:** Try the alternative login page at `http://localhost:3000/admin-login.html`

## 📝 Files Modified

- `.env` - Updated MongoDB connection string with correct database name
- `app/page.js` - Added debug logging to login function
- `public/admin-login.html` - Created standalone login page with debugging

## 🛠️ Helper Scripts Created

- `check-admin.js` - Check admin user in database
- `test-login.js` - Test login API endpoint
- `test-password.js` - Verify password hashing
- `start-server.sh` - Easy startup script

## ✅ Verification Checklist

- [x] MongoDB Cloud connected
- [x] Database name configured: `your_database_name`
- [x] Admin user exists with username: `admin`
- [x] Password hash verified: `YWRtaW4xMjM=` (decodes to `admin123`)
- [x] Login API tested and working
- [x] All data migrated successfully
- [x] Debug logging added to frontend
- [x] Alternative login pages created

## 📞 Support

If you're still having issues, please provide:
1. The exact URL you're accessing
2. What you see on the screen (screenshot helpful)
3. Browser console errors (F12 → Console)
4. Output from `node check-admin.js`

---

**Last Updated:** November 12, 2025
**Status:** All backend systems operational ✓
