const jwt = require("jsonwebtoken");

//🔹 Check Is Login
async function protect(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
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