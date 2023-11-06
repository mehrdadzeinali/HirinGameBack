const pool = require('../config/db');

const createUserTable = async () => {
  try {
    await pool.execute(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email_verified BOOLEAN DEFAULT false,
      verification_code VARCHAR(6) DEFAULT NULL  // Allows null values initially, assuming not all users will have a code right away
    )`);
    console.log("User table created or already exists.");
  } catch (error) {
    console.error("Could not create user table:", error);
  }
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

const createUser = async (email, password, verificationCode) => {
  const [result] = await pool.query('INSERT INTO users (email, password, email_verified, verification_code) VALUES (?, ?, ?, ?)', [email, password, false, verificationCode]);
  return result.insertId;
};

const updateUserEmailVerified = async (id, emailVerified) => {
  const [result] = await pool.query('UPDATE users SET email_verified = ? WHERE id = ?', [emailVerified, id]);
  return result.affectedRows;
};

const checkVerificationCode = async (email, verificationCode) => {
  try {
    const [user] = await pool.query('SELECT * FROM users WHERE email = ? AND verification_code = ?', [email, verificationCode]);
    return user.length > 0;
  } catch (error) {
    console.error("Error checking verification code:", error);
    throw error;
  }
};

const updateVerificationCode = async (email, newVerificationCode) => {
  const [result] = await pool.query('UPDATE users SET verification_code = ? WHERE email = ?', [newVerificationCode, email]);
  return result.affectedRows;
};

module.exports = {
  createUserTable,
  findUserByEmail,
  createUser,
  updateUserEmailVerified,
  checkVerificationCode,
  updateVerificationCode
};
