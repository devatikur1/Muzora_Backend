const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔹 Send OTP Email
async function sendOtpEmail(to, otp) {
  await transporter.sendMail({
    from: `Muzora <${process.env.EMAIL_USER}>`,
    to,
    subject: "Email verification code",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Your OTP Code</h2>
        <p>Use the code below to verify your action:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

// 🔹 Send Welcome Email
async function sendBackupEmail(to, backupData) {
  const jsonBuffer = Buffer.from(JSON.stringify(backupData, null, 2));

  await transporter.sendMail({
    from: `Muzora <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Music Data Backup",
    text: `Hi, as requested, here is a backup of your music data before your artist account was converted to a regular user account. Please keep this file safe.`,
    attachments: [
      {
        filename: `music-backup-${Date.now()}.json`,
        content: jsonBuffer,
      },
    ],
  });
}

module.exports = { sendOtpEmail, sendBackupEmail };
