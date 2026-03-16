import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"CineStream OTT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your CineStream Login OTP',
    html: `
      <div style="font-family: Arial, sans-serif; background: #0a0a0c; color: #fff; padding: 40px; border-radius: 12px; max-width: 500px; margin: auto;">
        <h1 style="color: #e50914; text-align: center; font-size: 28px;">🎬 CineStream</h1>
        <h2 style="text-align: center; color: #fff;">Your Login OTP</h2>
        <div style="background: #1a1a2e; border: 1px solid #e50914; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="font-size: 14px; color: #aaa; margin: 0 0 10px;">Your one-time password is:</p>
          <h1 style="font-size: 48px; letter-spacing: 12px; color: #00f5ff; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #aaa; text-align: center; font-size: 13px;">This OTP expires in <strong style="color: #e50914;">5 minutes</strong>.</p>
        <p style="color: #555; text-align: center; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
