require("dotenv").config();
const dns = require("dns");
const app = require("./src/app.js");
const connectDB = require("./src/db/db.js");
const port = process.env.PORT;

dns.setServers(["8.8.8.8", "8.8.4.4"]);
connectDB();

app.listen(port, () => console.log(`Server is running on port ${port} website link http://localhost:${port}`));
