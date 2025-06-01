require('dotenv').config();
const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken'); // Uncomment if you implement JWT

const dbPool = require("../config/db-config")

// const JWT_SECRET = process.env.JWT_SECRET;

const signUp = async (req, res) => {
  const { firstName, lastName, userEmail, password } = req.body;
  if (!firstName || !lastName || !userEmail || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }
  let connection;
  try {
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute('SELECT `CustomerID` FROM `customer` WHERE `userEmail` = ?', [userEmail]);
    if (rows.length > 0) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [result] = await connection.execute(
      'INSERT INTO `customer` (`firstName`, `lastName`, `userEmail`, `password_hash`) VALUES (?, ?, ?, ?)',
      [firstName, lastName, userEmail, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'An error occurred during registration.' });
  } finally {
    if (connection) connection.release();
  }
}

const logIn = async (req, res) => {
  const { userEmail, password } = req.body;
  if (!userEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  let connection;
  try {
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute('SELECT `CustomerID`, `firstName`, `lastName`, `userEmail`, `password_hash`, `PhoneNumber` FROM `customer` WHERE `userEmail` = ?', [userEmail]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const user = rows[0];
    const passwordIsValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const userDataForFrontend = {
      CustomerID: user.CustomerID,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.userEmail,
      phone: user.PhoneNumber || ''
    };
    // IMPORTANT: Replace "fake-auth-token..." with actual JWT generation
    const token = "fake-auth-token-replace-with-real-jwt";
    res.status(200).json({ message: 'Login successful!', user: userDataForFrontend, token: token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login. Please try again.' });
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
    signUp,
    logIn
}