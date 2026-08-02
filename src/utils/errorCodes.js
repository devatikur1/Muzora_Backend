const errorCodes = {
  "auth/invalid-credentials": {
    status: 401,
    message: "Incorrect username/email or password. Please try again.",
  },
  "auth/user-not-found": {
    status: 404,
    message: "User not found. Please sign up or check your credentials.",
  },
  "auth/email-already-exists": {
    status: 409,
    message:
      "The provided email is already in use. Please choose a different email.",
  },
  "auth/username-already-exists": {
    status: 409,
    message:
      "The provided username is already in use. Please choose a different username.",
  },
  "auth/weak-password": {
    status: 400,
    message: "Password must be at least 6 characters long.",
  },
  "auth/password-same": {
    status: 400,
    message: "New password must be different from your old password.",
  },
  "auth/incorrect-old-password": {
    status: 401,
    message: "Old password is incorrect. Please try again.",
  },
  "auth/invalid-otp": {
    status: 400,
    message: "Invalid OTP. Please check the code and try again.",
  },
  "auth/otp-expired": {
    status: 400,
    message: "OTP has expired. Please request a new code.",
  },
  "auth/missing-fields": {
    status: 400,
    message: "Required fields are missing. Please fill in all required fields.",
  },
  "auth/unauthorized": {
    status: 401,
    message: "Unauthorized request. Please log in and try again.",
  },
  "auth/session-expired": {
    status: 401,
    message: "Session expired. Please log in again.",
  },
  "auth/refresh-token-missing": {
    status: 401,
    message: "Refresh token is missing. Please log in again.",
  },
  "auth/otp-token-required": {
    status: 400,
    message: "OTP token is required. Please request a new code.",
  },
  "auth/invalid-otp-purpose": {
    status: 400,
    message: "Invalid OTP purpose. Please use the correct OTP flow.",
  },
  "auth/server-error": {
    status: 500,
    message: "Something went wrong. Please try again later.",
  },
  "auth/not-implemented": {
    status: 501,
    message: "This feature is not available yet.",
  },
};

module.exports = errorCodes;
