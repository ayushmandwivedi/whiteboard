const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getUserCanvases,
  loadCanvas,
  createCanvas,
  updateCanvas,
  deleteCanvas,
  shareCanvas,
} = require("../controllers/canvasController");

const router = express.Router();

router.get("/list", authMiddleware, getUserCanvases);
router.post("/create", authMiddleware, createCanvas);
router.put("/share/:id", authMiddleware, shareCanvas);
router.patch("/:id", authMiddleware, updateCanvas);
router.delete("/:id", authMiddleware, deleteCanvas);
router.get("/:id", authMiddleware, loadCanvas);

module.exports = router;
