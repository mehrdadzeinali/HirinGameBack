const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { sendEmail } = require('../config/emailServices');
const {
    findUserByEmail,
    createUser,
    checkVerificationCode,
    updateUserEmailVerified,
    updateVerificationCode,
    setPasswordResetCodeAndExpiry,
    checkPasswordResetCode,
    updateUserPassword
  } = require('../models/userModel');


class AuthController {

    constructor() {
        this.register = this.register.bind(this);
        this.verifyUser = this.verifyUser.bind(this);
        this.resendVerificationCode = this.resendVerificationCode.bind(this);
        this.login = this.login.bind(this)
        this.forgotPassword = this.forgotPassword.bind(this)
        this.resetForgettenPassword = this.resetForgettenPassword.bind(this)
    }

    isPasswordValid(password) {
        let errorMessage = '';
    
        if (password.length < 8 || password.length > 16) {
            errorMessage = 'Password must be 8-16 characters long.';
            return { valid: false, message: errorMessage };
        }

        const lowerCaseRegex = /[a-z]/;
        if (!lowerCaseRegex.test(password)) {
            errorMessage = 'Password must include at least one lowercase letter.';
            return { valid: false, message: errorMessage };
        }
    
        const upperCaseRegex = /[A-Z]/;
        if (!upperCaseRegex.test(password)) {
            errorMessage = 'Password must include at least one uppercase letter.';
            return { valid: false, message: errorMessage };
        }
    
        const digitRegex = /[0-9]/;
        if (!digitRegex.test(password)) {
            errorMessage = 'Password must include at least one digit.';
            return { valid: false, message: errorMessage };
        }
    
        const specialCharRegex = /[!@#\$%\^&\*]/;
        if (!specialCharRegex.test(password)) {
            errorMessage = 'Password must include at least one special character (!@#$%^&*).';
            return { valid: false, message: errorMessage };
        }
    
        const charCount = {};
        for (const char of password) {
            if (charCount[char]) {
                charCount[char]++;
                if (charCount[char] > 3) {
                    errorMessage = 'Password must not have more than three identical characters in a row.';
                    return { valid: false, message: errorMessage };
                }
            } else {
                charCount[char] = 1;
            }
        }
    
        return { valid: true, message: 'Password is valid.' };
    }

    isEmailValid(email) {
        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(email.toLowerCase());
    }
  
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000);
    }

    register = async (req, res, next) => {
        const { email, password, confirmation_password } = req.body;
    
        if (!email || !password || !confirmation_password) {
            return res.status(400).json({ message: 'Email, password, and confirmation password are required.' });
        }
    
        if (password !== confirmation_password) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }
    
        try {
            const { valid, message } = this.isPasswordValid(password);
            if (!valid) {
                return res.status(400).json({ message });
            }
        } catch (error) {
            console.error('Password validation error:', error);
            return res.status(400).json({ message: 'Error in password validation: ' + error.message });
        }
    
        try {
            if (!this.isEmailValid(email)) {
                return res.status(400).json({ message: 'Invalid email format. Please enter a valid email address.' });
            }
        } catch (error) {
            return res.status(400).json({ message: 'Error in email validation.' });
        }

        const verificationCode = this.generateVerificationCode();

        try {
            const existingUser = await findUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({ message: 'User already exists with the provided email.' });
            }
    
            let hashedPassword;
            try {
                hashedPassword = await bcrypt.hash(password, 10);
            } catch (error) {
                return res.status(500).json({ message: 'Error in password encryption.' });
            }
    
            await createUser(email, hashedPassword, verificationCode);

            const emailSubject = 'Welcome to HirinGame - Verify Your Email';
            const emailBody = `
                Welcome to HirinGame!
        
                We are excited to have you on board. Whether you're looking to find your next job opportunity or to discover top talent for your company, we're here to support you every step of the way.
        
                Your verification code is: ${verificationCode}
        
                Please enter this code in our app to verify your email address and get started.
        
                Good luck with your job search if you're looking for new opportunities, or may you find the perfect candidate if you're hiring!
        
                Best Regards,
                HirinGame Team
            `;

            const emailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: emailSubject,
                text: emailBody
            };
        
            await sendEmail(emailOptions);

            res.status(201).json({ message: 'Registration successful.' });
        } catch (error) {
            console.error('Error during user creation and sending verification email:', error);
            return res.status(500).json({ message: 'An unexpected error occurred during registration.' });
        }
    }

    verifyUser = async (req, res, next) => {
        const { email, verificationCode } = req.body;
    
        if (!email || !verificationCode) {
          return res.status(400).json({ message: 'Email and verification code are required.' });
        }
    
        try {
          const user = await findUserByEmail(email);
          if (!user) {
            return res.status(404).json({ message: 'User not found.' });
          }
      
          const isCodeMatch = await checkVerificationCode(email, verificationCode);
      
          if (!isCodeMatch) {
            return res.status(400).json({ message: 'Verification code is incorrect.' });
          }

          await updateUserEmailVerified(user.id, true, null);
      
          res.status(200).json({ message: 'Email verified successfully.' });
        } catch (error) {
          console.error('Verification error:', error);
          return res.status(500).json({ message: 'An unexpected error occurred during verification.' });
        }
    }

    resendVerificationCode = async (req, res, next) => {
        const { email } = req.body;
    
        if (!email) {
          return res.status(400).json({ message: 'Email is required.' });
        }
    
        try {
          const user = await findUserByEmail(email);
          if (!user) {
            return res.status(404).json({ message: 'User not found.' });
          }

          if (user.email_verified) {
            return res.status(401).json({ message: 'Email is already verified.' });
          }
      
          const newVerificationCode = this.generateVerificationCode();
      
          await updateVerificationCode(email, newVerificationCode);
      
          const emailSubject = 'Welcome to HirinGame - Verify Your Email';
          const emailBody = `
              Welcome to HirinGame!
      
              We are excited to have you on board. Whether you're looking to find your next job opportunity or to discover top talent for your company, we're here to support you every step of the way.
      
              Your verification code is: ${newVerificationCode}
      
              Please enter this code in our app to verify your email address and get started.
      
              Good luck with your job search if you're looking for new opportunities, or may you find the perfect candidate if you're hiring!
      
              Best Regards,
              HirinGame Team
          `;

          const emailOptions = {
              from: process.env.EMAIL_USER,
              to: email,
              subject: emailSubject,
              text: emailBody
          };
      
          await sendEmail(emailOptions);

      
          res.status(200).json({ message: 'Verification code resent successfully.' });
        } catch (error) {
          console.error('Error resending verification code:', error);
          return res.status(500).json({ message: 'An unexpected error occurred while resending the verification code.' });
        }
    }

    login = async (req, res, next) => {
      const { email, password } = req.body;
    
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }
    
      try {
        const user = await findUserByEmail(email);
        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (!user.email_verified) {
          return res.status(401).json({ message: 'Please verify your email to login.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const payload = {
          user: {
            id: user.id,
            email: user.email
          }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
          if (err) throw err;
          res.json({ token });
        });
    
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }

    forgotPassword = async (req, res, next) => {
        const { email } = req.body;
    
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }
    
        try {
            const user = await findUserByEmail(email);
            if (!user) {
                return res.status(200).json({ message: 'If a user with that email exists, we will send them a password reset code.' });
            }

            const passwordResetCode = this.generateVerificationCode();

            await setPasswordResetCodeAndExpiry(email, passwordResetCode);
        
            const emailSubject = 'Your HirinGame Password Reset Code';
            const emailBody = `
                Here is your password reset code: ${passwordResetCode}
                
                Please enter this code on the password reset page.
        
                If you did not request a password reset, please ignore this email.
        
                The code is valid for 20 minutes only.
        
                Best Regards,
                HirinGame Team
            `;
        
            const emailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: emailSubject,
                text: emailBody
            };
        
            await sendEmail(emailOptions);
        
            res.status(200).json({ message: 'If a user with that email exists, we have sent them a password reset code.' });
        } catch (error) {
            console.error('Error in forgotPassword:', error);
            return res.status(500).json({ message: 'An unexpected error occurred while processing the password reset.' });
        }
    }

    resetForgettenPassword = async (req, res, next) => {
        const { email, code, newPassword, confirmationNewPassword } = req.body;
    
        if (!email || !code || !newPassword || !confirmationNewPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (newPassword !== confirmationNewPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }
    
        try {
            const { valid, message } = this.isPasswordValid(newPassword);
            if (!valid) {
                return res.status(400).json({ message });
            }
        } catch (error) {
            console.error('Password validation error:', error);
            return res.status(400).json({ message: 'Error in password validation: ' + error.message });
        }
    
        try {
            const user = await findUserByEmail(email);
        
            if (!user) {
                return res.status(200).json({ message: 'Invalid code or code has expired.' });
            }

            const isCodeValid = await checkPasswordResetCode(email, code);
        
            if (!isCodeValid) {
                return res.status(400).json({ message: 'Invalid code or code has expired.' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await updateUserPassword(email, hashedPassword);
        
            res.status(200).json({ message: 'Your password has been reset successfully. Please login with your new password.' });
        } catch (error) {
            console.error('Error in resetPassword:', error);
            return res.status(500).json({ message: 'An unexpected error occurred while resetting the password.' });
        }
    }

}

module.exports = new AuthController();
