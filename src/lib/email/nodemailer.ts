'use server';

import type { SubmissionStatus } from '@/types';
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

// Ensure these environment variables are set in your .env.local file
//
// --- Gmail Configuration Example ---
// To use a Gmail account, you'll typically need to:
// 1. Enable 2-Step Verification on your Google Account.
// 2. Generate an "App Password" for Nodemailer.
//    Go to your Google Account -> Security -> 2-Step Verification -> App passwords.
//    Generate a new app password and use it for SMTP_PASS.
//
// Example .env.local for Gmail (SSL - recommended):
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=465
// SMTP_USER=your.email@gmail.com
// SMTP_PASS=your_generated_app_password
// EMAIL_FROM="Your App Name <your.email@gmail.com>"
// SMTP_SECURE=true
//
// Example .env.local for Gmail (TLS):
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=587
// SMTP_USER=your.email@gmail.com
// SMTP_PASS=your_generated_app_password
// EMAIL_FROM="Your App Name <your.email@gmail.com>"
// SMTP_SECURE=false
//
// --- General SMTP Configuration ---
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587; // Defaults to 587 (TLS)
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM; // e.g., "Project Gateway <noreply@example.com>"
const smtpSecure = process.env.SMTP_SECURE === 'true'; // `true` for port 465 (SSL), `false` for port 587 (TLS)

if (!smtpHost || !smtpUser || !smtpPass || !emailFrom) {
  console.warn(
    'SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM) are not fully configured. Email sending will be disabled. Please check your .env.local file.'
  );
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure, 
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  // For Gmail, if you encounter issues, you might need to configure service: 'gmail'
  // However, providing host, port, secure, and auth is generally preferred for flexibility.
  // service: (smtpHost === 'smtp.gmail.com' && smtpUser && smtpPass) ? 'gmail' : undefined, 
});

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  if (!smtpHost || !smtpUser || !smtpPass || !emailFrom) {
    console.log(`Email sending is disabled due to missing SMTP configuration. Would have sent to ${to} with subject "${subject}"`);
    // console.log(`HTML content: ${html}`);
    // if (text) console.log(`Text content: ${text}`);
    return; 
  }

  const mailOptions = {
    from: emailFrom,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to} with subject "${subject}"`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    // Consider how you want to handle email sending failures.
    // For critical notifications, you might want to implement retries or alert an admin.
    // throw new Error('Failed to send email'); 
  }
}

// Email template helper (basic example)
export async function generateProjectSubmissionClientEmail(projectName: string, clientName: string, submissionId: string): Promise<{ subject: string; html: string; text: string }> {
  const subject = `Your Project "${projectName}" Has Been Submitted`;
  const html = `
    <p>Dear ${clientName},</p>
    <p>Thank you for submitting your project "<strong>${projectName}</strong>". We have received your details and will review them shortly.</p>
    <p>Your Submission ID is: <strong>${submissionId}</strong>.</p>
    <p>You will be notified once there's an update on your submission status.</p>
    <p>Best regards,<br/>The Project Gateway Team</p>
  `;
  const text = `Dear ${clientName},\n\nThank you for submitting your project "${projectName}". We have received your details and will review them shortly.\nYour Submission ID is: ${submissionId}.\nYou will be notified once there's an update on your submission status.\n\nBest regards,\nThe Project Gateway Team`;
  return { subject, html, text };
}

export async function generateNewSubmissionAdminEmail(projectName: string, clientName: string, clientEmail: string, submissionId: string): Promise<{ subject: string; html: string; text: string }> {
  const subject = `New Project Submission: "${projectName}"`;
  const adminDashboardLink = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/admin` : "the admin dashboard";
  const html = `
    <p>A new project "<strong>${projectName}</strong>" has been submitted.</p>
    <p><strong>Client Name:</strong> ${clientName}</p>
    <p><strong>Client Email:</strong> ${clientEmail}</p>
    <p><strong>Submission ID:</strong> ${submissionId}</p>
    <p>Please review it in ${adminDashboardLink}.</p>
  `;
  const text = `A new project "${projectName}" has been submitted.\n\nClient Name: ${clientName}\nClient Email: ${clientEmail}\nSubmission ID: ${submissionId}\n\nPlease review it in ${adminDashboardLink}.`;
  return { subject, html, text };
}

export async function generateStatusUpdateEmail(
  projectName: string,
  clientName: string,
  status: SubmissionStatus,
  details?: string // This will be acceptanceConditions or rejectionReason
): Promise<{ subject: string; html: string; text: string }> {
  let subject = '';
  let htmlBody = '';
  let textBody = '';

  switch (status) {
    case 'accepted':
      subject = `Congratulations! Your project "${projectName}" has been accepted!`;
      htmlBody = `
        <p>Dear ${clientName},</p>
        <p>We are pleased to inform you that your project "<strong>${projectName}</strong>" has been accepted.</p>
        <p>We will be in touch shortly with the next steps.</p>
      `;
      textBody = `Dear ${clientName},\n\nWe are pleased to inform you that your project "${projectName}" has been accepted.\nWe will be in touch shortly with the next steps.`;
      break;
    case 'acceptedWithConditions':
      subject = `Your project "${projectName}" has been accepted with conditions`;
      htmlBody = `
        <p>Dear ${clientName},</p>
        <p>Your project "<strong>${projectName}</strong>" has been accepted with the following conditions:</p>
        <p><em>${details || 'Please contact us for details.'}</em></p>
        <p>Please review these conditions. We will contact you to discuss them further.</p>
      `;
      textBody = `Dear ${clientName},\n\nYour project "${projectName}" has been accepted with the following conditions:\n\n${details || 'Please contact us for details.'}\n\nPlease review these conditions. We will contact you to discuss them further.`;
      break;
    case 'rejected':
      subject = `Update on your project submission: "${projectName}"`;
      htmlBody = `
        <p>Dear ${clientName},</p>
        <p>We regret to inform you that after careful consideration, your project "<strong>${projectName}</strong>" has been rejected.</p>
        ${details ? `<p><strong>Reason:</strong> ${details}</p>` : '<p>If you have questions, please contact us.</p>'}
        <p>If you would like to discuss this further or have any questions, please feel free to contact us.</p>
      `;
      textBody = `Dear ${clientName},\n\nWe regret to inform you that after careful consideration, your project "${projectName}" has been rejected.\n\n${details ? `Reason: ${details}\n\n` : 'If you have questions, please contact us.\n\n'}If you would like to discuss this further or have any questions, please feel free to contact us.`;
      break;
    // 'pending' status updates are typically not emailed to clients, but handled internally.
    // If other statuses are added, they can be handled here.
    default:
      // This case should ideally not be reached if 'status' is strictly SubmissionStatus
      // and client-facing emails are only for terminal or conditional statuses.
      console.warn(`generateStatusUpdateEmail called with unhandled status: ${status} for project ${projectName}`);
      subject = `Update on your project: "${projectName}"`;
      htmlBody = `<p>Dear ${clientName},</p><p>There's an update on your project "<strong>${projectName}</strong>". The status is now: ${status}. Please contact us for more details if necessary.</p>`;
      textBody = `Dear ${clientName},\n\nThere's an update on your project "${projectName}". The status is now: ${status}.\nPlease contact us for more details if necessary.`;
      break;
  }

  const html = `${htmlBody}<p>Best regards,<br/>The Project Gateway Team</p>`;
  const text = `${textBody}\n\nBest regards,\nThe Project Gateway Team`;

  return { subject, html, text };
}

