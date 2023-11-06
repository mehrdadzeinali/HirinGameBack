const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const pool = require('../config/db');


class AuthController {
    isPasswordValid(password) {
        if (password.length < 8 || password.length > 16) {
            return false;
          }
      
          const lowerCaseRegex = /[a-z]/;
          const upperCaseRegex = /[A-Z]/;
          const digitRegex = /[0-9]/;
          const specialCharRegex = /[!@#\$%\^&\*]/;
      
          if (!lowerCaseRegex.test(password) || 
              !upperCaseRegex.test(password) || 
              !digitRegex.test(password) || 
              !specialCharRegex.test(password)) {
            return false;
          }
      
          const charCount = {};
          for (const char of password) {
            if (charCount[char]) {
              charCount[char]++;
              if (charCount[char] > 2) return false;
            } else {
              charCount[char] = 1;
            }
          }
          
          return true;
    }

    isEmailValid(email) {
        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(email.toLowerCase());
    }
  
    async register(req, res, next) {
        const { email, password, confirmation_password } = req.body;
    
        if (!email || !password || !confirmation_password) {
            return res.status(400).json({ message: 'Email, password, and confirmation password are required.' });
        }

        if (password !== confirmation_password) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }
    
        try {
            if (!this.isPasswordValid(password)) {
                return res.status(400).json({ message: 'Password does not meet complexity requirements. It must be 8-16 characters long, include upper and lower case letters, numbers, and special characters, and not have more than 2 identical characters in a row.' });
            }
        } catch (error) {
            return res.status(400).json({ message: 'Error in password validation.' });
        }
    
        try {
            if (!this.isEmailValid(email)) {
                return res.status(400).json({ message: 'Invalid email format. Please enter a valid email address.' });
            }
        } catch (error) {
            return res.status(400).json({ message: 'Error in email validation.' });
        }
      
        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ message: 'User already exists with the provided email.' });
            }
    
            let hashedPassword;
            try {
                hashedPassword = await bcrypt.hash(password, 10);
            } catch (error) {
                return res.status(500).json({ message: 'Error in password encryption.' });
            }
    
            const newUser = new User({
                email,
                password: hashedPassword,
                email_verified: false,
            });
    
            await newUser.save();
    
            res.status(201).json({ message: 'Registration successful.' });
        } catch (error) {
            if (error.name === 'ValidationError') {
                let message = 'Validation error: ';
                for (field in error.errors) {
                    message += `${field} - ${error.errors[field].message}. `;
                }
                return res.status(400).json({ message });
            } else {
                console.error('Registration error:', error);
                return res.status(500).json({ message: 'An unexpected error occurred during registration.' });
            }
        }
    }
    
  }
  
  module.exports = new AuthController();
