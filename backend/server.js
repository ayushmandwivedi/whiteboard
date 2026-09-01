const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const connectToDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const PORT = process.env.PORT || 3030;

if (!process.env.SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined");
}

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

const startServer = async () => {
  try {
    await connectToDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
