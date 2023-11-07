const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register.bind(authController));

router.post('/verify', authController.verifyUser.bind(authController));

router.post('/resend', authController.resendVerificationCode.bind(authController));

router.post('/login', authController.login.bind(authController))

router.post('/forgot-password', authController.forgotPassword.bind(authController))

router.post('/reset-forgotten-password', authController.resetForgettenPassword.bind(authController))

router.post('/reset-password', authController.resetPassword.bind(authController))

module.exports = router;
