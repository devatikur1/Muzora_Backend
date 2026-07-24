const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const musicRoutes = require("./routes/music.routes");
const albumRoutes = require("./routes/album.routes");
const otpRoutes = require("./routes/otp.routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/music/album", albumRoutes);

app.get("/:*", async (req, res) => {
  res.status(500).json({
    message: "Eror",
  });
});



module.exports = app;