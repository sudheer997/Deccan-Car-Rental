# Railway Deployment Troubleshooting Guide

## Changes Made to Fix Deployment Issues

### 1. Created Dedicated Health Check Endpoint
**File:** `app/api/health/route.js`

A simple endpoint that doesn't require MongoDB connection for Railway's health checks.

**Test locally:**
```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:00:00.000Z",
  "service": "Deccan Car Rental",
  "version": "1.0.0"
}
```

### 2. Enhanced Nixpacks Configuration
**File:** `nixpacks.toml`

Added verbose logging to track the build process:
- Explicit echo statements to show build progress
- `-v` flag on `cp` commands to see what files are being copied
- Directory listings to verify standalone structure
- Error handling with `|| echo` fallbacks

### 3. Added Procfile
**File:** `Procfile`

Provides an explicit start command as a fallback for Railway.

### 4. Updated Railway Configuration
**File:** `railway.json`

Changed healthcheck from `/` to `/api/health` - a simpler endpoint that doesn't load the entire React app.

## Deployment Checklist

### Before Deployment

- [ ] All files committed to git
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] MongoDB user credentials are correct
- [ ] `.env` file is NOT committed (should be in .gitignore)

### Railway Environment Variables

Verify these are set in Railway Dashboard → Variables:

**Required:**
```
MONGO_URL=mongodb+srv://srikanth8426_db_user:PASSWORD@cluster0.9dhar1g.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority&ssl=true
DB_NAME=DATABASE_NAME
NODE_ENV=production
```

**Important:** Replace `PASSWORD` and `DATABASE_NAME` with actual values!

### Build Log Verification

After deploying, check the build logs for these sections:

#### 1. Build Phase Should Show:
```
=== Building Next.js application ===
yarn run v1.22.22
$ next build
✓ Compiled successfully
=== Copying static files ===
'.next/static' -> '.next/standalone/.next/static'
'.next/static/chunks' -> '.next/standalone/.next/static/chunks'
[... many file copies ...]
'public' -> '.next/standalone/public'
=== Verifying standalone structure ===
drwxr-xr-x 1 root root  4096 Nov 16 10:00 .
drwxr-xr-x 1 root root  4096 Nov 16 10:00 ..
drwxr-xr-x 1 root root  4096 Nov 16 10:00 .next
drwxr-xr-x 1 root root  4096 Nov 16 10:00 node_modules
-rw-r--r-- 1 root root   123 Nov 16 10:00 package.json
drwxr-xr-x 1 root root  4096 Nov 16 10:00 public
-rw-r--r-- 1 root root  1234 Nov 16 10:00 server.js
=== Build complete ===
```

**If you DON'T see the file copies, the build is failing!**

#### 2. Healthcheck Should Show:
```
====================
Starting Healthcheck
====================
Path: /api/health
Retry window: 1m40s

Attempt #1 succeeded!
```

**If it shows "service unavailable", the app isn't responding!**

#### 3. Runtime Logs Should Show:
```
Starting Container
yarn run v1.22.22
$ node .next/standalone/server.js
  ▲ Next.js 14.2.3
  - Local:        http://CONTAINER_ID:8080
  - Network:      http://[IPv6]:8080
 ✓ Starting...
 ✓ Ready in 61ms
```

**The container should stay running after "Ready in 61ms"!**

## Common Issues and Solutions

### Issue 1: "Static copy failed" in Build Logs

**Cause:** The `.next/static` directory wasn't created by the build.

**Solution:**
1. Verify `next.config.js` has `output: 'standalone'`
2. Check that the build completed successfully
3. Ensure `yarn build` ran without errors

### Issue 2: "No .next in standalone" in Build Logs

**Cause:** The standalone build structure is missing.

**Solution:**
1. Clear Railway build cache: Settings → "Reset Build Cache"
2. Redeploy

### Issue 3: Healthcheck Keeps Failing

**Symptoms:**
```
Attempt #1 failed with service unavailable
Attempt #2 failed with service unavailable
...
```

**Possible Causes:**

**A. App Crashes on Startup**
- Check runtime logs for errors after "Ready in 61ms"
- Look for MongoDB connection errors
- Verify environment variables are set

**B. App Doesn't Listen on Correct Port**
- Railway auto-sets `PORT` environment variable
- Next.js standalone should auto-detect this
- Check if PORT is being overridden somewhere

**C. Static Files Missing**
- App loads but can't serve pages
- Verify build logs show file copies
- Check `.next/standalone/.next/static` exists

**Solution Steps:**
1. Check Railway live logs for crash errors
2. Verify MongoDB connection string is correct
3. Test `/api/health` endpoint manually after deployment

### Issue 4: MongoDB Connection Errors

**Symptoms in Logs:**
```
MongoServerError: Authentication failed
MongooseServerSelectionError: connection refused
```

**Solution:**

**A. Check Connection String**
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority&ssl=true
```

**Important:**
- Special characters in password must be URL-encoded
  - `@` becomes `%40`
  - `#` becomes `%23`
  - etc.

**B. Check MongoDB Atlas**
1. Network Access → Add `0.0.0.0/0`
2. Database Access → Verify user exists
3. Clusters → Verify cluster is running (not paused)

**C. Verify Environment Variables**
```bash
# In Railway, check that these match:
MONGO_URL=mongodb+srv://srikanth8426_db_user:PASSWORD@cluster0.9dhar1g.mongodb.net/your_database_name?retryWrites=true&w=majority&ssl=true
DB_NAME=your_database_name
# ^^^ These must be the same! ^^^
```

### Issue 5: Container Stops Immediately

**Symptoms:**
```
Starting Container
✓ Ready in 61ms
Stopping Container
```

**Cause:** Railway thinks the process exited or failed healthcheck.

**Solution:**
- This should be fixed by the health check endpoint
- If still failing, check logs for the actual error
- Verify `Procfile` and `nixpacks.toml` are committed

## Testing After Deployment

### 1. Test Health Endpoint
```bash
curl https://deccan-car-rental-production.up.railway.app/api/health
```

**Expected:**
```json
{"status":"healthy","timestamp":"...","service":"Deccan Car Rental","version":"1.0.0"}
```

### 2. Test API Endpoints
```bash
curl https://deccan-car-rental-production.up.railway.app/api/cars
```

**Expected:** JSON array (empty `[]` or with cars data)

### 3. Test Main App
Visit: `https://deccan-car-rental-production.up.railway.app`

**Expected:** React app loads, you see the car rental interface

### 4. Check Browser Console
Open browser DevTools → Console

**Should NOT see:**
- 404 errors for JavaScript files
- CORS errors
- Network errors

**If you see 404s for `.js` files:**
- Static files weren't copied correctly
- Check build logs for copy errors

## Advanced Debugging

### Enable Verbose Logging

Add to Railway environment variables:
```
NODE_ENV=development
DEBUG=*
```

**Warning:** This is verbose! Remove after debugging.

### SSH into Railway Container (if available)

Some Railway plans allow SSH access:
```bash
railway shell
```

Then check:
```bash
cd .next/standalone
ls -la
ls -la .next/
ls -la .next/static/
```

Verify static files exist.

### Check Disk Space

In build logs, if you see "No space left on device":
- Reduce dependencies
- Clear build cache
- Contact Railway support

## Success Indicators

✅ Build logs show "=== Build complete ==="
✅ Build logs show file copies with `-v` output
✅ Healthcheck shows "Attempt #1 succeeded!"
✅ Runtime logs show "Ready in Xms" and stay running
✅ `/api/health` returns 200 OK
✅ Main URL loads the React app
✅ No 404 errors in browser console

## Still Having Issues?

### Collect This Information:

1. **Full build logs** (from Railway Deployments tab)
2. **Runtime logs** (from Railway service logs)
3. **Healthcheck output** (from deployment logs)
4. **Browser console errors** (F12 → Console tab)
5. **Railway environment variables list** (names only, not values)

### Try These Steps:

1. **Reset and Redeploy:**
   ```bash
   # Railway Dashboard → Settings → Reset Build Cache
   # Then trigger new deployment
   ```

2. **Test Locally:**
   ```bash
   yarn build
   cp -r .next/static .next/standalone/.next/
   cp -r public .next/standalone/
   node .next/standalone/server.js
   # Visit http://localhost:3000
   ```

3. **Verify Files Committed:**
   ```bash
   git status
   git add app/api/health/route.js nixpacks.toml Procfile railway.json
   git commit -m "Fix Railway deployment"
   git push
   ```

## Contact Support

- **Railway Discord:** https://discord.gg/railway
- **Railway Docs:** https://docs.railway.app
- **MongoDB Support:** https://www.mongodb.com/community/forums
