const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/sendError");

//🔹 Check Is Login
async function protect(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    return sendError(res, "auth/unauthorized");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, "auth/unauthorized");
  }
}

//🔹 Check Is Artist
async function authCheckIsArtist(req, res, next) {
  if (!req.user || req.user.role !== "artist") {
    return res.status(409).json({ message: "You don't have access" });
  }

  next();
}

module.exports = { protect, authCheckIsArtist };
