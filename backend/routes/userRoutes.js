const express = require("express");
const { registerUser, loginUser } = require("../controllers/userController");
const validate = require("../middlewares/validate");
const {
  loginSchema,
  registerSchema,
} = require("../validations/userValidation");
const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);

module.exports = router;
