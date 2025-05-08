
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
// EMAIL_FROM="Your App Name <your.email@gmail.com>" // Make sure this matches SMTP_USER for Gmail
// SMTP_SECURE=true
//
// Example .env.local for Gmail (TLS):
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=587
// SMTP_USER=your.email@gmail.com
// SMTP_PASS=your_generated_app_password
// EMAIL_FROM="Your App Name <your.email@gmail.com>" // Make sure this matches SMTP_USER for Gmail
// SMTP_SECURE=false
//
// --- General SMTP Configuration ---
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587; 
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM; 
const smtpSecure = process.env.SMTP_SECURE === 'true'; 

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
  // For Gmail, if `service: 'gmail'` is used, host/port/secure might be ignored.
  // It's often better to explicitly define them.
  // service: (smtpHost === 'smtp.gmail.com' && smtpUser && smtpPass && smtpUser.endsWith('@gmail.com')) ? 'gmail' : undefined,
});

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  if (!smtpHost || !smtpUser || !smtpPass || !emailFrom) {
    console.log(`Email sending is disabled due to missing SMTP configuration. Would have sent to ${to} with subject "${subject}"`);
    // console.log(`HTML content: ${html}`);
    // if (text) console.log(`Text content: ${text}`);
    return; 
  }

  const mailOptions = {
    from: emailFrom, // Use the configured EMAIL_FROM
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
    throw new Error(`Failed to send email: ${(error as Error).message}`); 
  }
}

// Shared styles and structure for emails
const emailStyles = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f4f4; }
  .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 5px; }
  .header { background-color: #007bff; color: #ffffff; padding: 10px 20px; text-align: center; border-top-left-radius: 5px; border-top-right-radius: 5px; }
  .header h1 { margin: 0; font-size: 24px; }
  .content { padding: 20px; text-align: left; }
  .content p { margin-bottom: 15px; }
  .content strong { color: #0056b3; }
  .footer { text-align: center; padding: 15px; font-size: 12px; color: #777777; border-bottom-left-radius: 5px; border-bottom-right-radius: 5px; background-color: #f9f9f9;}
  .button { display: inline-block; background-color: #28a745; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; }
  .details-block { background-color: #f9f9f9; border: 1px solid #eeeeee; padding: 15px; margin-top: 15px; border-radius: 4px; }
  .details-block p { margin-bottom: 8px; }
`;

const generateHtmlTemplate = (title: string, bodyContent: string, appName: string = "Project Gateway") => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>${emailStyles}</style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${appName}</h1>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

// Email template helper for client submission confirmation
export async function generateProjectSubmissionClientEmail(projectName: string, clientName: string, submissionId: string): Promise<{ subject: string; html: string; text: string }> {
  const subject = `Your Project "${projectName}" Has Been Submitted`;
  
  const htmlBodyContent = `
    <p>Dear ${clientName},</p>
    <p>Thank you for submitting your project "<strong>${projectName}</strong>". We have received your details and will review them shortly.</p>
    <div class="details-block">
      <p><strong>Submission ID:</strong> ${submissionId}</p>
    </div>
    <p>You will be notified once there's an update on your submission status.</p>
    <p>Best regards,<br/>The Project Gateway Team</p>
  `;
  const html = generateHtmlTemplate(subject, htmlBodyContent);

  const text = `
Dear ${clientName},

Thank you for submitting your project "${projectName}". We have received your details and will review them shortly.

Submission ID: ${submissionId}

You will be notified once there's an update on your submission status.

Best regards,
The Project Gateway Team

© ${new Date().getFullYear()} Project Gateway. All rights reserved.
  `.trim();
  return { subject, html, text };
}

// Email template for admin notification of new submission
export async function generateNewSubmissionAdminEmail(projectName: string, clientName: string, clientEmail: string, submissionId: string): Promise<{ subject: string; html: string; text: string }> {
  const subject = `New Project Submission: "${projectName}"`;
  const adminDashboardLink = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/admin` : "the admin dashboard";
  
  const htmlBodyContent = `
    <p>A new project "<strong>${projectName}</strong>" has been submitted.</p>
    <div class="details-block">
      <p><strong>Client Name:</strong> ${clientName}</p>
      <p><strong>Client Email:</strong> ${clientEmail}</p>
      <p><strong>Submission ID:</strong> ${submissionId}</p>
    </div>
    <p>Please review it in <a href="${adminDashboardLink}" class="button" style="color: #ffffff; text-decoration: none;">Admin Dashboard</a>.</p>
  `;
  const html = generateHtmlTemplate(subject, htmlBodyContent, "Project Gateway Admin");

  const text = `
A new project "${projectName}" has been submitted.

Client Name: ${clientName}
Client Email: ${clientEmail}
Submission ID: ${submissionId}

Please review it in the admin dashboard: ${adminDashboardLink}

© ${new Date().getFullYear()} Project Gateway Admin. All rights reserved.
  `.trim();
  return { subject, html, text };
}

// Email template for status updates to client
export async function generateStatusUpdateEmail(
  projectName: string,
  clientName: string,
  status: SubmissionStatus,
  details?: string 
): Promise<{ subject: string; html: string; text: string }> {
  let emailSubject = '';
  let htmlBodyMain = '';
  let textBodyMain = '';

  switch (status) {
    case 'accepted':
      emailSubject = `Congratulations! Your project "${projectName}" has been accepted!`;
      htmlBodyMain = `
        <p>Dear ${clientName},</p>
        <p>We are pleased to inform you that your project "<strong>${projectName}</strong>" has been accepted.</p>
        <p>We will be in touch shortly with the next steps.</p>
      `;
      textBodyMain = `Dear ${clientName},\n\nWe are pleased to inform you that your project "${projectName}" has been accepted.\nWe will be in touch shortly with the next steps.`;
      break;
    case 'acceptedWithConditions':
      emailSubject = `Your project "${projectName}" has been accepted with conditions`;
      htmlBodyMain = `
        <p>Dear ${clientName},</p>
        <p>Your project "<strong>${projectName}</strong>" has been accepted with the following conditions:</p>
        <div class="details-block">
          <p><em>${details || 'Please contact us for details.'}</em></p>
        </div>
        <p>Please review these conditions. We will contact you to discuss them further.</p>
      `;
      textBodyMain = `Dear ${clientName},\n\nYour project "${projectName}" has been accepted with the following conditions:\n\n${details || 'Please contact us for details.'}\n\nPlease review these conditions. We will contact you to discuss them further.`;
      break;
    case 'rejected':
      emailSubject = `Update on your project submission: "${projectName}"`;
      htmlBodyMain = `
        <p>Dear ${clientName},</p>
        <p>We regret to inform you that after careful consideration, your project "<strong>${projectName}</strong>" has been rejected.</p>
        ${details ? `<div class="details-block"><p><strong>Reason:</strong> ${details}</p></div>` : ''}
        <p>If you would like to discuss this further or have any questions, please feel free to contact us.</p>
      `;
      textBodyMain = `Dear ${clientName},\n\nWe regret to inform you that after careful consideration, your project "${projectName}" has been rejected.\n\n${details ? `Reason: ${details}\n\n` : ''}If you would like to discuss this further or have any questions, please feel free to contact us.`;
      break;
    default:
      console.warn(`generateStatusUpdateEmail called with unhandled status: ${status} for project ${projectName}`);
      emailSubject = `Update on your project: "${projectName}"`;
      htmlBodyMain = `<p>Dear ${clientName},</p><p>There's an update on your project "<strong>${projectName}</strong>". The status is now: <strong>${status}</strong>. Please contact us for more details if necessary.</p>`;
      textBodyMain = `Dear ${clientName},\n\nThere's an update on your project "${projectName}". The status is now: ${status}.\nPlease contact us for more details if necessary.`;
      break;
  }

  const htmlBodyContent = `
    ${htmlBodyMain}
    <p>Best regards,<br/>The Project Gateway Team</p>
  `;
  const html = generateHtmlTemplate(emailSubject, htmlBodyContent);

  const text = `
${textBodyMain}

Best regards,
The Project Gateway Team

© ${new Date().getFullYear()} Project Gateway. All rights reserved.
  `.trim();

  return { subject: emailSubject, html, text };
}
