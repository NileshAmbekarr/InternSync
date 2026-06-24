const nodemailer = require('nodemailer');

const CLIENT_URL = () => process.env.CLIENT_URL || 'http://localhost:5173';

// Create transporter (Gmail SMTP)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Shared branded email shell
const emailLayout = (innerHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0c; color: #f4f4f5;">
    <div style="text-align: center; margin-bottom: 28px;">
      <h1 style="color: #8b5cf6; font-size: 26px; margin: 0;">InternSync</h1>
    </div>
    <div style="background: #131316; padding: 28px; border-radius: 14px; border: 1px solid #232329;">
      ${innerHtml}
    </div>
    <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 20px;">
      © ${new Date().getFullYear()} InternSync. Built for better internships.
    </p>
  </div>
`;

const button = (url, label) => `
  <div style="text-align: center; margin: 28px 0;">
    <a href="${url}" style="display: inline-block; background: #8b5cf6; color: #fff; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      ${label}
    </a>
  </div>
`;

// Low-level send helper; never throws into the caller
const sendMail = async (mailOptions, errorLabel = 'Email error') => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({ from: `"InternSync" <${process.env.EMAIL_USER}>`, ...mailOptions });
    return true;
  } catch (error) {
    console.error(`${errorLabel}:`, error.message);
    return false;
  }
};

// Send verification email
const sendVerificationEmail = async (email, name, verificationToken) => {
  const verificationUrl = `${CLIENT_URL()}/verify-email/${verificationToken}`;
  return sendMail({
    to: email,
    subject: 'Verify Your InternSync Account',
    html: emailLayout(`
      <h2 style="margin-top: 0; color: #f4f4f5;">Welcome, ${name}!</h2>
      <p style="color: #a1a1aa;">Thanks for creating your organization on InternSync. Please verify your email to get started.</p>
      ${button(verificationUrl, 'Verify Email Address')}
      <p style="color: #71717a; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    `),
  }, 'Verification email error');
};

// Send invite email
const sendInviteEmail = async (email, name, orgName, inviterName, inviteToken, role) => {
  const inviteUrl = `${CLIENT_URL()}/accept-invite/${inviteToken}`;
  const roleLabel = role === 'admin' ? 'Administrator' : 'Intern';
  return sendMail({
    to: email,
    subject: `You're invited to join ${orgName} on InternSync`,
    html: emailLayout(`
      <h2 style="margin-top: 0; color: #f4f4f5;">You're Invited!</h2>
      <p style="color: #a1a1aa;"><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as an <strong>${roleLabel}</strong>.</p>
      ${button(inviteUrl, 'Accept Invitation')}
      <p style="color: #71717a; font-size: 14px;">This invite expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
    `),
  }, 'Invite email error');
};

// Send a single notification as an email
const sendNotificationEmail = async (email, name, { title, message, link }) => {
  const url = link ? `${CLIENT_URL()}${link}` : CLIENT_URL();
  return sendMail({
    to: email,
    subject: title,
    html: emailLayout(`
      <h2 style="margin-top: 0; color: #f4f4f5;">${title}</h2>
      <p style="color: #a1a1aa;">Hi ${name || 'there'},</p>
      <p style="color: #a1a1aa;">${message || ''}</p>
      ${button(url, 'Open InternSync')}
      <p style="color: #71717a; font-size: 13px;">You're receiving this because email notifications are on. You can turn them off in your profile.</p>
    `),
  }, 'Notification email error');
};

// Send a digest of multiple notifications
const sendDigestEmail = async (email, name, notifications) => {
  const items = notifications
    .map(
      (n) => `
        <li style="margin-bottom: 12px;">
          <span style="color: #f4f4f5; font-weight: bold;">${n.title}</span><br/>
          <span style="color: #a1a1aa; font-size: 14px;">${n.message || ''}</span>
        </li>`
    )
    .join('');

  return sendMail({
    to: email,
    subject: `Your InternSync digest — ${notifications.length} update${notifications.length === 1 ? '' : 's'}`,
    html: emailLayout(`
      <h2 style="margin-top: 0; color: #f4f4f5;">Your recent activity</h2>
      <p style="color: #a1a1aa;">Hi ${name || 'there'}, here's what you missed:</p>
      <ul style="padding-left: 18px; margin: 18px 0;">${items}</ul>
      ${button(CLIENT_URL(), 'Open InternSync')}
      <p style="color: #71717a; font-size: 13px;">You can turn off email notifications in your profile.</p>
    `),
  }, 'Digest email error');
};

module.exports = {
  sendVerificationEmail,
  sendInviteEmail,
  sendNotificationEmail,
  sendDigestEmail,
};
