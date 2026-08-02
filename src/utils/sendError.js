const errorCodes = require("./errorCodes.js");

function sendError(res, code) {
  const error = errorCodes[code] || errorCodes["auth/server-error"];
  const responseCode = errorCodes[code] ? code : "auth/server-error";

  return res
    .status(error.status)
    .json({ code: responseCode, message: error.message });
}

module.exports = { sendError };
