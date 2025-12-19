const nodemailer = require('nodemailer');

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

// Send verification email
const sendVerificationEmail = async (email, name, verificationToken) => {
  const transporter = createTransporter();

  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

  const mailOptions = {
    from: `"InternSync" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your InternSync Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #09090b; color: #fafafa;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8b5cf6; font-size: 28px; margin: 0;">⚡ InternSync</h1>
        </div>
        
        <div style="background: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #27272a;">
          <h2 style="margin-top: 0; color: #fafafa;">Welcome, ${name}!</h2>
          <p style="color: #a1a1aa;">Thanks for creating your organization on InternSync. Please verify your email to get started.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #71717a; font-size: 14px;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        
        <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 20px;">
          © 2024 InternSync. Built for better internships.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Send invite email
const sendInviteEmail = async (email, name, orgName, inviterName, inviteToken, role) => {
  const transporter = createTransporter();

  const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/accept-invite/${inviteToken}`;

  const roleLabel = role === 'admin' ? 'Administrator' : 'Intern';

  const mailOptions = {
    from: `"InternSync" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `You're invited to join ${orgName} on InternSync`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #09090b; color: #fafafa;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8b5cf6; font-size: 28px; margin: 0;">⚡ InternSync</h1>
        </div>
        
        <div style="background: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #27272a;">
          <h2 style="margin-top: 0; color: #fafafa;">You're Invited!</h2>
          <p style="color: #a1a1aa;">
            <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as an <strong>${roleLabel}</strong>.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #71717a; font-size: 14px;">
            This invite expires in 7 days. If you weren't expecting this, you can ignore this email.
          </p>
        </div>
        
        <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 20px;">
          © 2024 InternSync. Built for better internships.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Invite email error:', error);
    return false;
  }
};

module.exports = { sendVerificationEmail, sendInviteEmail };
