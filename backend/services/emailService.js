const nodemailer = require('nodemailer');
const { APPROVAL_STATUS } = require('../utils/constants');

let cachedTransporter;

const ensureTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email credentials are not fully configured. Emails will not be sent.');
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return cachedTransporter;
};

const sendEmail = async ({ to, subject, text, html }, retries = 3) => {
  const transporter = ensureTransporter();

  if (!transporter) {
    console.warn(`Skipping email to ${to}: transporter not configured.`);
    return null;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      const isRateLimitError = 
        error.message?.includes('Too many login attempts') ||
        error.message?.includes('454') ||
        error.responseCode === 454 ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET';

      // If it's a rate limit error and we have retries left, wait and retry
      if (isRateLimitError && attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.warn(
          `Email rate limited (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If it's the last attempt or non-rate-limit error, log and fail
      if (attempt === retries || !isRateLimitError) {
        // In test/development mode, don't log every email failure as error
        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
        if (isRateLimitError && isTestEnv) {
          console.warn(
            `Failed to send email to ${to}: Rate limit exceeded. Email functionality working but Gmail is rate limiting.`
          );
        } else {
          console.error(
            `Failed to send email to ${to}: ${error.message || error}`
          );
        }
      }
    }
  }

  return null;
};

const formatRoleName = (role) => role.charAt(0).toUpperCase() + role.slice(1);

const sendRoleApprovalEmail = async ({ role, email, status, reason }) => {
  const readableRole = formatRoleName(role);

  if (status === APPROVAL_STATUS.APPROVED) {
    return sendEmail({
      to: email,
      subject: `${readableRole} account approved | Healiinn`,
      text: `Hello ${readableRole},\n\nYour registration with Healiinn has been approved. You can now sign in using your credentials.\n\nThank you,\nTeam Healiinn`,
      html: `<p>Hello ${readableRole},</p><p>Your registration with <strong>Healiinn</strong> has been approved. You can now sign in using your credentials.</p><p>Thank you,<br/>Team Healiinn</p>`,
    });
  }

  if (status === APPROVAL_STATUS.REJECTED) {
    return sendEmail({
      to: email,
      subject: `${readableRole} account update | Healiinn`,
      text: `Hello ${readableRole},\n\nYour registration could not be approved at this time.${reason ? ` Reason: ${reason}.` : ''}\nPlease contact support if you need more information.\n\nRegards,\nTeam Healiinn`,
      html: `<p>Hello ${readableRole},</p><p>Your registration could not be approved at this time.${
        reason ? ` Reason: <strong>${reason}</strong>.` : ''
      }</p><p>Please contact support if you need more information.</p><p>Regards,<br/>Team Healiinn</p>`,
    });
  }

  return null;
};

const sendSignupAcknowledgementEmail = async ({ role, email, name }) => {
  const readableRole = formatRoleName(role);

  return sendEmail({
    to: email,
    subject: `${readableRole} signup received | Healiinn`,
    text: `Hello ${name || readableRole},\n\nWe have received your registration for Healiinn as a ${readableRole}. Our admin team will review your details and notify you once approved.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${name || readableRole},</p><p>We have received your registration for <strong>Healiinn</strong> as a ${readableRole}. Our admin team will review your details and notify you once approved.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

const sendAdminPendingApprovalEmail = async ({ email, role, entity }) => {
  const readableRole = formatRoleName(role);
  const name = entity?.firstName
    ? `${entity.firstName} ${entity.lastName || ''}`.trim()
    : entity?.labName || entity?.pharmacyName || entity?.ownerName || entity?.name || 'New applicant';

  const details = [
    entity?.email && `Email: ${entity.email}`,
    entity?.phone && `Phone: ${entity.phone}`,
    entity?.licenseNumber && `License: ${entity.licenseNumber}`,
  ]
    .filter(Boolean)
    .join('\n');

  const text = `Hello Admin,

A new ${readableRole} registration requires approval.

Name: ${name}
${details ? `${details}
` : ''}
Please review and take action in the admin panel.

Thank you,
Healiinn Platform`;

  const html = `<p>Hello Admin,</p><p>A new <strong>${readableRole}</strong> registration requires approval.</p><ul>${
    name ? `<li><strong>Name:</strong> ${name}</li>` : ''
  }${
    entity?.email ? `<li><strong>Email:</strong> ${entity.email}</li>` : ''
  }${
    entity?.phone ? `<li><strong>Phone:</strong> ${entity.phone}</li>` : ''
  }${
    entity?.licenseNumber ? `<li><strong>License:</strong> ${entity.licenseNumber}</li>` : ''
  }</ul><p>Please review and take action in the admin panel.</p><p>Thank you,<br/>Healiinn Platform</p>`;

  return sendEmail({
    to: email,
    subject: `New ${readableRole} registration pending approval`,
    text,
    html,
  });
};

const sendPasswordResetOtpEmail = async ({ role, email, otp }) => {
  const readableRole = formatRoleName(role);

  return sendEmail({
    to: email,
    subject: `Password reset OTP for ${readableRole} account | Healiinn`,
    text: `Hello ${readableRole},\n\nUse the following OTP to reset your Healiinn password: ${otp}.\nThis OTP will expire in ${process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10} minutes.\n\nIf you did not request this, please contact support immediately.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${readableRole},</p><p>Use the following OTP to reset your <strong>Healiinn</strong> password: <strong>${otp}</strong>.</p><p>This OTP will expire in ${
      process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10
    } minutes.</p><p>If you did not request this, please contact support immediately.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

const sendAppointmentReminderEmail = async ({ patientEmail, patientName, doctorName, appointmentDate, appointmentTime, hoursBefore = 24 }) => {
  if (!patientEmail) {
    return null;
  }

  const timeText = hoursBefore === 24 ? 'tomorrow' : hoursBefore === 2 ? 'in 2 hours' : `in ${hoursBefore} hours`;
  const formattedDate = appointmentDate ? new Date(appointmentDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';
  const formattedTime = appointmentTime || (appointmentDate ? new Date(appointmentDate).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) : '');

  const subject = `Appointment Reminder - ${doctorName || 'Doctor'} | Healiinn`;
  const text = `Hello ${patientName || 'Patient'},

This is a reminder that you have an appointment ${timeText}:

Doctor: ${doctorName || 'Doctor'}
Date: ${formattedDate}
Time: ${formattedTime}

Please make sure to arrive on time. If you need to reschedule or cancel, please contact us as soon as possible.

Thank you,
Team Healiinn`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2c3e50;">Appointment Reminder</h2>
      <p>Hello ${patientName || 'Patient'},</p>
      <p>This is a reminder that you have an appointment <strong>${timeText}</strong>:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Doctor:</strong> ${doctorName || 'Doctor'}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
      </div>
      <p>Please make sure to arrive on time. If you need to reschedule or cancel, please contact us as soon as possible.</p>
      <p>Thank you,<br/>Team Healiinn</p>
    </div>
  `;

  return sendEmail({
    to: patientEmail,
    subject,
    text,
    html,
  });
};

const sendPrescriptionEmail = async ({ patientEmail, patientName, doctorName, prescriptionId, pdfPath, prescriptionDate }, retries = 3) => {
  if (!patientEmail) {
    return null;
  }

  const fs = require('fs');
  const transporter = ensureTransporter();

  if (!transporter) {
    console.warn(`Skipping prescription email to ${patientEmail}: transporter not configured.`);
    return null;
  }

  const subject = `Your Prescription from ${doctorName || 'Doctor'} | Healiinn`;
  const text = `Hello ${patientName || 'Patient'},

Your prescription has been prepared by ${doctorName || 'Doctor'}.

Prescription ID: ${prescriptionId}
Date: ${prescriptionDate ? new Date(prescriptionDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}

Please find your prescription attached to this email. You can use this prescription to purchase medications from any pharmacy or book lab tests as recommended.

If you have any questions, please contact your doctor.

Thank you,
Team Healiinn`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2c3e50;">Your Prescription</h2>
      <p>Hello ${patientName || 'Patient'},</p>
      <p>Your prescription has been prepared by <strong>${doctorName || 'Doctor'}</strong>.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Prescription ID:</strong> ${prescriptionId}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${prescriptionDate ? new Date(prescriptionDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</p>
      </div>
      <p>Please find your prescription attached to this email. You can use this prescription to purchase medications from any pharmacy or book lab tests as recommended.</p>
      <p>If you have any questions, please contact your doctor.</p>
      <p>Thank you,<br/>Team Healiinn</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: patientEmail,
    subject,
    text,
    html,
  };

  // Attach PDF if it exists
  if (pdfPath && fs.existsSync(pdfPath)) {
    mailOptions.attachments = [
      {
        filename: `prescription-${prescriptionId}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf',
      },
    ];
  }

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      const isRateLimitError = 
        error.message?.includes('Too many login attempts') ||
        error.message?.includes('454') ||
        error.responseCode === 454 ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET';

      // If it's a rate limit error and we have retries left, wait and retry
      if (isRateLimitError && attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.warn(
          `Prescription email rate limited (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If it's the last attempt or non-rate-limit error, log and fail
      if (attempt === retries || !isRateLimitError) {
        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
        if (isRateLimitError && isTestEnv) {
          console.warn(
            `Failed to send prescription email to ${patientEmail}: Rate limit exceeded. Email functionality working but Gmail is rate limiting.`
          );
        } else {
          console.error(
            `Failed to send prescription email to ${patientEmail}: ${error.message || error}`
          );
        }
      }
    }
  }

  return null;
};

module.exports = {
  sendEmail,
  sendRoleApprovalEmail,
  sendSignupAcknowledgementEmail,
  sendAdminPendingApprovalEmail,
  sendPasswordResetOtpEmail,
  sendAppointmentReminderEmail,
  sendPrescriptionEmail,
};


