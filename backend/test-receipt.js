// Test script to check if receipt email is sent
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('SMTP_USER:', process.env.SMTP_USER ? '✓ Set' : '✗ Not set');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✓ Set' : '✗ Not set');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || '587');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('\n❌ SMTP credentials not configured!');
    console.log('Please set SMTP_USER and SMTP_PASS in your .env file');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('\n📧 Sending test email...');
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'RideSwift <noreply@rideswift.com>',
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'RideSwift - Email Test',
      html: '<h1>✅ Email Configuration Working!</h1><p>Your SMTP settings are configured correctly.</p>',
    });
    console.log('✅ Test email sent successfully!');
    console.log(`Check inbox: ${process.env.SMTP_USER}`);
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('  1. SMTP_USER and SMTP_PASS are correct');
      console.log('  2. For Gmail, you need an "App Password" not your regular password');
      console.log('  3. Go to: https://myaccount.google.com/apppasswords');
    }
  }
}

testEmail();
