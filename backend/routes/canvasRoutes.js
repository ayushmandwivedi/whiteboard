const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getUserCanvases } = require("../controllers/canvasController");

const router = express.Router();

router.get("/list", authMiddleware, getUserCanvases);

module.exports = router;
