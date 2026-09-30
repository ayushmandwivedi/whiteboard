const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getUserCanvases,
  loadCanvas,
  createCanvas,
  updateCanvas,
} = require("../controllers/canvasController");

const router = express.Router();

router.get("/list", authMiddleware, getUserCanvases);
router.post("/create", authMiddleware, createCanvas);
router.patch("/:id", authMiddleware, updateCanvas);
router.get("/:id", authMiddleware, loadCanvas);

module.exports = router;
