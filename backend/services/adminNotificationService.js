const Admin = require('../models/Admin');
const { sendAdminPendingApprovalEmail } = require('./emailService');

const parseEmails = (value = '') =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item);

const unique = (arr) => [...new Set(arr)];

const notifyAdminsOfPendingSignup = async ({ role, entity }) => {
  const fallback = parseEmails(process.env.ADMIN_NOTIFICATION_EMAILS);

  let recipients = [];

  let admins = [];

  try {
    const adminRecords = await Admin.find({ isActive: true, email: { $exists: true, $ne: '' } }).select('email');
    recipients = adminRecords.map((admin) => admin.email);
  } catch (error) {
    console.error('Failed to fetch admin emails for notification', error);
  }

  try {
    admins = await Admin.find({ isActive: true }).select('email name');
  } catch (error) {
    console.error('Failed to fetch admin emails for notification', error);
  }

  recipients = unique([...recipients, ...fallback]);

  if (!recipients.length) {
    console.warn('No admin notification recipients configured. Skipping admin notification email.');
    return;
  }

  await Promise.all(
    recipients.map((email) =>
      sendAdminPendingApprovalEmail({
        email,
        role,
        entity,
      }).catch((error) => console.error(`Failed to send admin pending approval email to ${email}`, error))
    )
  );
};

module.exports = {
  notifyAdminsOfPendingSignup,
};
