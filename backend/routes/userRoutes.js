const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
} = require("../controllers/userController");
const validate = require("../middlewares/validateMiddleware");
const {
  loginSchema,
  registerSchema,
} = require("../validations/userValidation");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.get("/profile", authMiddleware, getProfile);

module.exports = router;
