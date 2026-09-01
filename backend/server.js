const express = require("express");
const cors = require("cors");
const app = express();
const connectToDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

connectToDB();

app.listen(3030, () => console.log("Server is running on port 3030"));
