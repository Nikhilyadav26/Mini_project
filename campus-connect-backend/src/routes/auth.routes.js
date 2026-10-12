const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authenticateToken = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { loginSchema, registerSchema } = require("../validators/auth.validator");

// Public
router.post("/register", validateBody(registerSchema), authController.register);
router.post("/login", validateBody(loginSchema), authController.login);

// Protected (Logged-in user)
router.get("/me", authenticateToken, authController.getMe);

module.exports = router;

