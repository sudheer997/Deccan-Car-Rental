# Email Notification Setup Guide

## Overview
This guide will help you configure email notifications for your car rental system. When a customer submits a reservation, the system will automatically send:
1. **Confirmation email** to the customer
2. **Notification email** to you (the admin)

---

## Email Configuration Options

You have two options for sending emails:

### Option 1: Gmail (Recommended for Quick Setup)
Use your Gmail account to send emails.

### Option 2: Custom SMTP
Use any SMTP email service (e.g., Outlook, SendGrid, AWS SES, etc.)

---

## Setup Instructions

### Step 1: Configure Your .env File

Open the `.env` file in your project root and update the email configuration section:

#### For Gmail:

```env
# Email Configuration
EMAIL_PROVIDER=gmail
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-app-specific-password
ADMIN_EMAIL=your-admin-email@gmail.com
COMPANY_NAME=Deccan Car Rental
COMPANY_PHONE=+1-XXX-XXX-XXXX
```

#### For Custom SMTP:

```env
# Email Configuration
EMAIL_PROVIDER=smtp
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
ADMIN_EMAIL=your-admin-email@domain.com
COMPANY_NAME=Deccan Car Rental
COMPANY_PHONE=+1-XXX-XXX-XXXX

# SMTP Configuration
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
```

---

## Gmail Setup (Detailed Instructions)

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "How you sign in to Google", click on **2-Step Verification**
4. Follow the prompts to enable 2-Step Verification

### Step 2: Generate App Password

1. After enabling 2FA, go back to **Security**
2. Under "How you sign in to Google", click on **App passwords**
3. Click **Select app** dropdown and choose **Mail**
4. Click **Select device** dropdown and choose **Other (Custom name)**
5. Enter a name like "Deccan Car Rental"
6. Click **Generate**
7. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update .env File

```env
EMAIL_PROVIDER=gmail
EMAIL_USER=yourname@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop    # The 16-character app password (without spaces)
ADMIN_EMAIL=yourname@gmail.com     # Where you want to receive notifications
COMPANY_NAME=Deccan Car Rental
COMPANY_PHONE=+1-234-567-8900
```

---

## Common SMTP Provider Settings

### Gmail
- Host: `smtp.gmail.com`
- Port: `587`
- Secure: `false`

### Outlook/Hotmail
- Host: `smtp-mail.outlook.com`
- Port: `587`
- Secure: `false`

### SendGrid
- Host: `smtp.sendgrid.net`
- Port: `587`
- Secure: `false`
- User: `apikey`
- Password: Your SendGrid API Key

### AWS SES
- Host: `email-smtp.us-east-1.amazonaws.com` (adjust region)
- Port: `587`
- Secure: `false`
- User: Your SMTP username from AWS
- Password: Your SMTP password from AWS

---

## Testing Email Configuration

After configuring your email settings, test the system:

### Method 1: Submit a Test Reservation

1. Start your server: `npm start`
2. Go to http://localhost:3000
3. Select a car and fill out the reservation form
4. Submit the form
5. Check:
   - Customer email inbox (confirmation email)
   - Admin email inbox (notification email)
   - Server console for email logs

### Method 2: Create a Test Script

Create a file `test-email.js`:

```javascript
const { sendCustomerConfirmationEmail, sendAdminNotificationEmail } = require('./lib/emailService');

const testData = {
  customerName: 'Test Customer',
  email: 'customer@example.com',
  phone: '+1234567890',
  carName: 'Toyota Camry',
  startDate: new Date('2025-12-01'),
  endDate: new Date('2025-12-31'),
  message: 'Test reservation',
  reservationNumber: 'TEST-12345'
};

console.log('Testing customer email...');
sendCustomerConfirmationEmail(testData)
  .then(result => console.log('Customer email result:', result))
  .catch(err => console.error('Customer email error:', err));

console.log('Testing admin email...');
sendAdminNotificationEmail(testData)
  .then(result => console.log('Admin email result:', result))
  .catch(err => console.error('Admin email error:', err));
```

Run: `node test-email.js`

---

## Email Templates

### Customer Confirmation Email Includes:
- Reservation confirmation message
- Reservation number
- Vehicle details
- Start and end dates
- Contact information
- Next steps

### Admin Notification Email Includes:
- Alert banner for new reservation
- Customer contact information
- Reservation details
- Customer message (if provided)
- Link to admin dashboard

---

## Troubleshooting

### Problem: "Invalid login" or "Authentication failed"

**For Gmail:**
- Make sure you've enabled 2-Factor Authentication
- Generate a new App Password
- Use the App Password (not your regular Gmail password)
- Remove spaces from the App Password in .env

**For other providers:**
- Verify your SMTP credentials are correct
- Check if your email provider requires "Less secure app access" to be enabled
- Some providers require whitelisting the server IP

### Problem: Emails go to spam

**Solutions:**
- Add your domain to SPF records
- Set up DKIM authentication
- Use a verified sending domain
- Ask recipients to add your email to their contacts

### Problem: "Connection timeout"

**Solutions:**
- Check your firewall settings
- Verify the SMTP port is correct (usually 587 or 465)
- Try using port 25 if 587 doesn't work
- Check if your hosting provider blocks outgoing SMTP

### Problem: "ECONNREFUSED" error

**Solutions:**
- Verify SMTP host is correct
- Check if SMTP service is running
- Ensure your server has internet access
- Try using a different port

### Problem: Emails not sending but no errors

**Solutions:**
- Check server console logs
- Verify .env file is being loaded
- Restart the server after changing .env
- Check spam folder for test emails

---

## Security Best Practices

1. **Never commit .env file to Git**
   - Already included in `.gitignore`
   - Store sensitive credentials securely

2. **Use App Passwords for Gmail**
   - Never use your main Gmail password
   - Each app should have its own password

3. **Rotate credentials regularly**
   - Change app passwords periodically
   - Revoke unused app passwords

4. **Use environment-specific configs**
   - Different credentials for development/production
   - Use secure secret management in production (AWS Secrets Manager, Azure Key Vault, etc.)

---

## Production Deployment

### For Vercel/Netlify:

1. Go to your project settings
2. Add environment variables:
   - `EMAIL_PROVIDER`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
   - `ADMIN_EMAIL`
   - `COMPANY_NAME`
   - `COMPANY_PHONE`
3. Redeploy your application

### For AWS/DigitalOcean:

1. Set environment variables in your hosting platform
2. Or use a secrets manager service
3. Ensure .env file is not deployed to production

---

## Email Delivery Best Practices

1. **Verify email addresses**
   - Send to verified email addresses first
   - Gradually increase sending volume

2. **Monitor delivery rates**
   - Check bounce rates
   - Monitor spam complaints
   - Track open rates

3. **Use professional email service for high volume**
   - Gmail: ~500 emails/day limit
   - Consider SendGrid/AWS SES for production
   - These services provide better deliverability

---

## Support

If you encounter issues:

1. Check server console logs for errors
2. Verify all environment variables are set
3. Test with a simple email first
4. Check your email provider's documentation

For Gmail-specific issues:
- https://support.google.com/accounts/answer/185833

For SMTP issues:
- Contact your email provider's support

---

**Last Updated:** November 12, 2025
**Version:** 1.0
