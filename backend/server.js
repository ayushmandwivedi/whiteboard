const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const connectToDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

connectToDB();

app.listen(process.env.PORT, () =>
  console.log("Server is running on port 3030"),
);
