require("dotenv").config();
const app = require("./src/app");
const contectDB = require("./src/db/db");
const port = process.env.PORT;

contectDB();

app.listen(port, () => console.log(`Server is running on port ${port}`));
