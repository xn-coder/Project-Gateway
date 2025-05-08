
'use server';

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

// Ensure these environment variables are set in your .env.local file
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM; // e.g., "Project Gateway <noreply@example.com>"
const smtpSecure = process.env.SMTP_SECURE === 'true'; // Use true for port 465, false for others (like 587)

if (!smtpHost || !smtpUser || !smtpPass || !emailFrom) {
  console.warn(
    'SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM) are not fully configured. Email sending will be disabled.'
  );
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  if (!smtpHost || !smtpUser || !smtpPass || !emailFrom) {
    console.log(`Email sending is disabled. Would have sent to ${to} with subject "${subject}"`);
    console.log(`HTML content: ${html}`);
    if (text) console.log(`Text content: ${text}`);
    return; // Silently fail or log if not configured
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
    // Optionally, re-throw the error or handle it as needed
    // throw new Error('Failed to send email');
  }
}

// Email template helper (basic example)
export function generateProjectSubmissionClientEmail(projectName: string, clientName: string, submissionId: string): { subject: string; html: string; text: string } {
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

export function generateNewSubmissionAdminEmail(projectName: string, clientName: string, clientEmail: string, submissionId: string): { subject: string; html: string; text: string } {
  const subject = `New Project Submission: "${projectName}"`;
  const html = `
    <p>A new project "<strong>${projectName}</strong>" has been submitted.</p>
    <p><strong>Client Name:</strong> ${clientName}</p>
    <p><strong>Client Email:</strong> ${clientEmail}</p>
    <p><strong>Submission ID:</strong> ${submissionId}</p>
    <p>Please review it in the admin dashboard.</p>
  `;
  const text = `A new project "${projectName}" has been submitted.\n\nClient Name: ${clientName}\nClient Email: ${clientEmail}\nSubmission ID: ${submissionId}\n\nPlease review it in the admin dashboard.`;
  return { subject, html, text };
}

export function generateStatusUpdateEmail(
  projectName: string,
  clientName: string,
  status: 'accepted' | 'acceptedWithConditions' | 'rejected',
  details?: string // This will be acceptanceConditions or rejectionReason
): { subject: string; html: string; text: string } {
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
        <p><strong>Reason:</strong> ${details || 'Not specified.'}</p>
        <p>If you would like to discuss this further, please feel free to contact us.</p>
      `;
      textBody = `Dear ${clientName},\n\nWe regret to inform you that after careful consideration, your project "${projectName}" has been rejected.\n\nReason: ${details || 'Not specified.'}\n\nIf you would like to discuss this further, please feel free to contact us.`;
      break;
  }

  const html = `${htmlBody}<p>Best regards,<br/>The Project Gateway Team</p>`;
  const text = `${textBody}\n\nBest regards,\nThe Project Gateway Team`;

  return { subject, html, text };
}
