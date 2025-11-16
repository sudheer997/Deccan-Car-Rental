# Railway Deployment Guide for Deccan Car Rental

This guide will walk you through deploying your Deccan Car Rental application to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **MongoDB Atlas**: Your MongoDB database (already configured)
3. **GitHub Repository**: Your code should be pushed to GitHub
4. **Environment Variables**: Ready from your `.env` file

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

**Important**: Make sure `.env` is in `.gitignore` (it already is!)

---

### 2. Create a New Project on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your `Deccan-Car-Rental` repository
6. Railway will automatically detect it's a Next.js app

---

### 3. Configure Environment Variables

In your Railway project dashboard:

1. Click on your service
2. Go to **"Variables"** tab
3. Add the following environment variables:

#### Required Environment Variables

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `MONGO_URL` | `mongodb+srv://srikanth8426_db_user:jkkcynHuKEjlBiy7@cluster0.9dhar1g.mongodb.net/your_database_name?retryWrites=true&w=majority&ssl=true` | Your MongoDB Atlas connection string |
| `DB_NAME` | `your_database_name` | Your MongoDB database name |
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3000` | Application port (Railway auto-assigns this) |

#### Optional Environment Variables (Email Configuration)

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `EMAIL_PROVIDER` | `gmail` | Email provider (gmail or smtp) |
| `EMAIL_USER` | `your-email@gmail.com` | Your Gmail address |
| `EMAIL_PASSWORD` | `your-app-password` | Gmail App Password |
| `ADMIN_EMAIL` | `your-admin-email@gmail.com` | Admin email for notifications |
| `COMPANY_NAME` | `Deccan Car Rental` | Your company name |
| `COMPANY_PHONE` | `+1-XXX-XXX-XXXX` | Your company phone |

#### Optional Environment Variables (Advanced)

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_BASE_URL` | `https://your-app.railway.app` | Your Railway app URL (add after first deploy) |
| `CORS_ORIGINS` | `https://your-app.railway.app` | Allowed CORS origins (or `*` for all) |

**Note**: For `NEXT_PUBLIC_BASE_URL`, you'll get this URL after the first deployment. You can add it later.

---

### 4. Railway Auto-Detection

Railway will automatically:
- Detect the Next.js framework
- Use the `railway.json` configuration
- Run `yarn install`
- Run `yarn build` (which includes the postbuild script)
- Run `yarn start`

The `railway.json` file ensures static files are copied correctly for the standalone build.

---

### 5. Deploy!

1. Railway will start building automatically
2. Watch the build logs in the **"Deployments"** tab
3. Build process takes 3-5 minutes
4. Once complete, you'll get a deployment URL like: `https://your-app.railway.app`

---

### 6. Post-Deployment Configuration

#### Update Environment Variables

1. Copy your Railway deployment URL
2. Go back to **Variables** tab
3. Update `NEXT_PUBLIC_BASE_URL`:
   ```
   NEXT_PUBLIC_BASE_URL=https://your-app.railway.app
   ```
4. Update `CORS_ORIGINS` (optional):
   ```
   CORS_ORIGINS=https://your-app.railway.app
   ```
5. Railway will auto-redeploy with new variables

#### Configure Custom Domain (Optional)

1. In Railway dashboard, go to **"Settings"** tab
2. Click **"Add Custom Domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_BASE_URL` and `CORS_ORIGINS` with your custom domain

---

### 7. Verify Deployment

1. Visit your Railway URL
2. Check that the app loads correctly
3. Test API endpoints:
   - `https://your-app.railway.app/api/cars`
   - `https://your-app.railway.app/api/maintenance`
4. Test the admin login functionality
5. Monitor the deployment logs for any errors

---

## Email Configuration for Production

If you want email notifications to work:

### Option 1: Gmail (Recommended for Testing)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Create password for "Mail"
3. Use this App Password as `EMAIL_PASSWORD` in Railway

### Option 2: Custom SMTP

Add these variables instead:
```
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

---

## Important Configuration Notes

### MongoDB Atlas Setup

Ensure your MongoDB Atlas cluster:
1. **Whitelist Railway IPs**: Add `0.0.0.0/0` to Network Access (or specific Railway IPs)
2. **Database User**: Verify credentials in connection string
3. **SSL/TLS**: Enabled (already in your connection string)

### Security Best Practices

1. **Never commit `.env` files** (already gitignored ✓)
2. **Rotate MongoDB passwords** regularly
3. **Use Railway's secret management** for sensitive data
4. **Update `CORS_ORIGINS`** to specific domains in production
5. **Enable HTTPS only** (Railway provides this automatically)

---

## Troubleshooting

### Build Fails

**Error**: "Module not found" or dependency issues
- **Solution**: Clear build cache in Railway → Settings → Reset Build Cache

**Error**: "Out of memory"
- **Solution**: Railway provides 8GB RAM by default. Contact Railway support if needed.

### Static Files Not Loading (404 Errors)

**Error**: JavaScript bundles return 404
- **Solution**: The `railway.json` and `postbuild` script handle this. Verify they executed in build logs.
- **Check**: Look for "Copying static files" in deployment logs

### MongoDB Connection Errors

**Error**: "MongoServerError: Authentication failed"
- **Solution**: Verify `MONGO_URL` environment variable is correct
- **Check**: MongoDB Atlas Network Access allows Railway (0.0.0.0/0)

**Error**: "MongooseServerSelectionError"
- **Solution**: Check MongoDB Atlas cluster is running
- **Verify**: Connection string includes `?retryWrites=true&w=majority&ssl=true`

### App Crashes or Restarts

**Error**: "Application error" or constant restarts
- **Solution**: Check Railway logs for errors
- **Common fix**: Ensure `PORT` environment variable is not hardcoded (Railway assigns dynamically)

### Email Not Sending

**Error**: Emails not being delivered
- **Solution**: Verify Gmail App Password is correct
- **Check**: `EMAIL_USER` and `EMAIL_PASSWORD` are set in Railway
- **Test**: Check Railway logs for email errors

---

## Monitoring and Logs

### View Logs
1. Railway Dashboard → Your Service
2. Click **"Deployments"** tab
3. Click on latest deployment
4. View real-time logs

### Common Log Locations
- **Build logs**: Show yarn install and build process
- **Deploy logs**: Show application startup
- **Runtime logs**: Show API requests and errors

### Health Checks
Railway automatically performs health checks. Your app responds on:
- `GET /` - Main application page
- `GET /api/cars` - API health check

---

## Cost Considerations

### Railway Pricing (as of 2024)
- **Free Plan**: $5 free credits/month (enough for hobby projects)
- **Paid Plan**: $5/month + usage-based pricing
- **Estimate**: Small Next.js app ~$5-10/month

### MongoDB Atlas Pricing
- **Free Tier**: M0 (512MB storage, shared)
- **Recommended**: M2 or M5 for production ($9-25/month)

---

## Scaling Your Application

### Horizontal Scaling
1. Railway Dashboard → Settings
2. Increase **"Replicas"** (Paid plan required)
3. Load balancing is automatic

### Vertical Scaling
Railway auto-scales resources based on usage up to plan limits.

---

## CI/CD (Continuous Deployment)

Railway automatically deploys when you push to your main branch:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Railway auto-deploys!
```

### Disable Auto-Deploy (Optional)
1. Railway Dashboard → Settings
2. Scroll to **"Deployments"**
3. Toggle **"Auto-Deploy"** off
4. Deploy manually via dashboard

---

## Rollback Deployments

If something goes wrong:
1. Railway Dashboard → Deployments
2. Find previous successful deployment
3. Click **"⋮"** (three dots)
4. Select **"Redeploy"**

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

---

## Need Help?

- **Railway Support**: [Railway Discord](https://discord.gg/railway)
- **MongoDB Issues**: [MongoDB Community Forums](https://www.mongodb.com/community/forums)
- **Application Issues**: Check your repository issues

---

## Quick Reference: Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas IP whitelist updated (0.0.0.0/0)
- [ ] Railway project created
- [ ] All environment variables added
- [ ] First deployment successful
- [ ] `NEXT_PUBLIC_BASE_URL` updated with Railway URL
- [ ] Test all API endpoints
- [ ] Test email functionality (if configured)
- [ ] Monitor logs for errors
- [ ] (Optional) Configure custom domain
- [ ] (Optional) Set up monitoring/alerts

---

## Success! 🎉

Your Deccan Car Rental application is now live on Railway!

Access your app at: `https://your-app.railway.app`

Admin login: Navigate to `/admin` or access via your app's admin panel.
