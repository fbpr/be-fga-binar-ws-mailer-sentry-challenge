const express = require("express");
const { register, login, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot_password", forgotPassword);
router.post("/password_reset", resetPassword);

module.exports = router;