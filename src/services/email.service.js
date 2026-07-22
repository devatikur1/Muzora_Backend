const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtpEmail(to, otp) {
  await transporter.sendMail({
    from: `Musify <${process.env.EMAIL_USER}>`,
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


module.exports = { sendOtpEmail };
