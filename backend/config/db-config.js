require('dotenv').config();
const mysql = require('mysql2/promise'); 

// --- Database Connection Pool ---
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'metalworks', // Using 'metalworks' as per this file
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});

dbPool.getConnection()
  .then(connection => {
    console.log('Successfully connected to the Metalworks database!');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err.stack);
  });

module.exports = dbPool