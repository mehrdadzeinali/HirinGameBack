const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { sendEmail } = require('../config/emailServices');
const {
    findUserByEmail,
    createUser
  } = require('../models/userModel');


class AuthController {

    constructor() {
        this.register = this.register.bind(this);
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
    
            await createUser(email, hashedPassword);

            const emailSubject = 'Welcome to Our Platform - Verify Your Email';
            const emailBody = `
                Welcome to Our Platform!
        
                We are excited to have you on board. Whether you're looking to find your next job opportunity or to discover top talent for your company, we're here to support you every step of the way.
        
                Your verification code is: ${verificationCode}
        
                Please enter this code in our app to verify your email address and get started.
        
                Good luck with your job search if you're looking for new opportunities, or may you find the perfect candidate if you're hiring!
        
                Best Regards,
                The Our Platform Team
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
  }
  
  module.exports = new AuthController();
