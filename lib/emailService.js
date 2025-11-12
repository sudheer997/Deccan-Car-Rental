const nodemailer = require('nodemailer');

// Email service configuration
const createTransporter = () => {
  // Support multiple email providers
  const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

  let transportConfig;

  if (emailProvider === 'gmail') {
    transportConfig = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // App password for Gmail
      }
    };
  } else if (emailProvider === 'smtp') {
    transportConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    };
  }

  return nodemailer.createTransporter(transportConfig);
};

// Send customer confirmation email
const sendCustomerConfirmationEmail = async (reservationData) => {
  try {
    const transporter = createTransporter();

    const { customerName, email, phone, carName, startDate, endDate, reservationNumber } = reservationData;

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Deccan Car Rental'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Reservation Confirmation - ${reservationNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Reservation Confirmed!</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Thank you for choosing <strong>${process.env.COMPANY_NAME || 'Deccan Car Rental'}</strong>! We have received your reservation request.</p>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #667eea;">Reservation Details</h3>
                <div class="info-row">
                  <span class="label">Reservation Number:</span> ${reservationNumber}
                </div>
                <div class="info-row">
                  <span class="label">Vehicle:</span> ${carName}
                </div>
                <div class="info-row">
                  <span class="label">Start Date:</span> ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div class="info-row">
                  <span class="label">End Date:</span> ${new Date(endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div class="info-row">
                  <span class="label">Contact Phone:</span> ${phone}
                </div>
              </div>

              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our team will review your reservation request</li>
                <li>We will contact you within 24 hours to confirm availability</li>
                <li>Payment and pickup details will be shared after confirmation</li>
              </ul>

              <p>If you have any questions or need to make changes, please contact us:</p>
              <p>
                📞 Phone: ${process.env.COMPANY_PHONE || 'Contact us'}<br>
                📧 Email: ${process.env.EMAIL_USER}<br>
                🌐 Website: ${process.env.NEXT_PUBLIC_BASE_URL || 'Visit our website'}
              </p>

              <div class="footer">
                <p>This is an automated confirmation email. Please do not reply to this message.</p>
                <p>&copy; ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Deccan Car Rental'}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear ${customerName},

Thank you for choosing ${process.env.COMPANY_NAME || 'Deccan Car Rental'}! We have received your reservation request.

RESERVATION DETAILS
-------------------
Reservation Number: ${reservationNumber}
Vehicle: ${carName}
Start Date: ${new Date(startDate).toLocaleDateString()}
End Date: ${new Date(endDate).toLocaleDateString()}
Contact Phone: ${phone}

WHAT HAPPENS NEXT?
- Our team will review your reservation request
- We will contact you within 24 hours to confirm availability
- Payment and pickup details will be shared after confirmation

If you have any questions, please contact us at ${process.env.EMAIL_USER}

Thank you!
${process.env.COMPANY_NAME || 'Deccan Car Rental'}
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Customer email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending customer email:', error);
    return { success: false, error: error.message };
  }
};

// Send admin notification email
const sendAdminNotificationEmail = async (reservationData) => {
  try {
    const transporter = createTransporter();

    const { customerName, email, phone, carName, startDate, endDate, message, reservationNumber } = reservationData;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Deccan Car Rental'}" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `🔔 New Reservation Request - ${reservationNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fef2f2; border: 2px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Reservation Request</h1>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>⏰ Action Required:</strong> A new customer has submitted a reservation request. Please review and respond within 24 hours.
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #667eea;">Customer Information</h3>
                <div class="info-row">
                  <span class="label">Name:</span> ${customerName}
                </div>
                <div class="info-row">
                  <span class="label">Email:</span> <a href="mailto:${email}">${email}</a>
                </div>
                <div class="info-row">
                  <span class="label">Phone:</span> <a href="tel:${phone}">${phone}</a>
                </div>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #667eea;">Reservation Details</h3>
                <div class="info-row">
                  <span class="label">Reservation Number:</span> ${reservationNumber}
                </div>
                <div class="info-row">
                  <span class="label">Vehicle:</span> ${carName}
                </div>
                <div class="info-row">
                  <span class="label">Start Date:</span> ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div class="info-row">
                  <span class="label">End Date:</span> ${new Date(endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                ${message ? `
                <div class="info-row">
                  <span class="label">Customer Message:</span><br>
                  <div style="background: #f3f4f6; padding: 15px; margin-top: 10px; border-radius: 5px;">
                    ${message}
                  </div>
                </div>
                ` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" class="button">
                  View in Dashboard →
                </a>
              </div>

              <p style="margin-top: 30px; font-size: 12px; color: #666;">
                This is an automated notification from your car rental management system.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
NEW RESERVATION REQUEST
=======================

⏰ ACTION REQUIRED: A new customer has submitted a reservation request.

CUSTOMER INFORMATION
-------------------
Name: ${customerName}
Email: ${email}
Phone: ${phone}

RESERVATION DETAILS
------------------
Reservation Number: ${reservationNumber}
Vehicle: ${carName}
Start Date: ${new Date(startDate).toLocaleDateString()}
End Date: ${new Date(endDate).toLocaleDateString()}
${message ? `\nCustomer Message:\n${message}` : ''}

Please log in to your dashboard to review and respond.

Dashboard: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Admin email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending admin email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendCustomerConfirmationEmail,
  sendAdminNotificationEmail
};
