const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register.bind(authController));

router.post('/verify', authController.verifyUser.bind(authController));

router.post('/resend', authController.resendVerificationCode.bind(authController));

router.post('/login', authController.login.bind(authController))

module.exports = router;
