require('dotenv').config();
const bcrypt = require('bcrypt');

const dbPool = require("../config/db-config")

const getProfile = async (req, res) => { 
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not properly authenticated." });
    const customerId = req.user.CustomerID;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [rows] = await connection.execute(
            'SELECT CustomerID, firstName, lastName, userEmail, PhoneNumber FROM `customer` WHERE `CustomerID` = ?',
            [customerId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User profile not found.' });
        const userProfile = rows[0];
        res.status(200).json({
            firstName: userProfile.firstName, lastName: userProfile.lastName,
            email: userProfile.userEmail, phone: userProfile.PhoneNumber || ''
        });
    } catch (error) {
        console.error(`Error fetching profile for CustomerID ${customerId}:`, error);
        res.status(500).json({ message: 'Failed to retrieve user profile.' });
    } finally { if (connection) connection.release(); }
}

const updateProfile = async (req, res) => { 
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not properly authenticated." });
    const customerId = req.user.CustomerID;
    const { firstName, lastName, phone } = req.body;
    if (!firstName || !lastName) return res.status(400).json({ message: 'First name and last name are required.' });
    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.execute(
            'UPDATE `customer` SET `firstName` = ?, `lastName` = ?, `PhoneNumber` = ? WHERE `CustomerID` = ?',
            [firstName, lastName, phone || null, customerId]
        );
        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
        console.error(`Error updating profile for CustomerID ${customerId}:`, error);
        res.status(500).json({ message: 'Failed to update profile.' });
    } finally { if (connection) connection.release(); }
}

const updatePassword = async (req, res) => { 
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not properly authenticated." });
    const customerId = req.user.CustomerID;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new password are required.' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 chars.' });
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [rows] = await connection.execute('SELECT password_hash FROM `customer` WHERE `CustomerID` = ?', [customerId]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
        const user = rows[0];
        const currentPasswordIsValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!currentPasswordIsValid) return res.status(401).json({ message: 'Incorrect current password.' });
        const saltRounds = 10;
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await connection.execute(
            'UPDATE `customer` SET `password_hash` = ? WHERE `CustomerID` = ?',
            [newHashedPassword, customerId]
        );
        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error(`Error changing password for CustomerID ${customerId}:`, error);
        res.status(500).json({ message: 'Failed to change password.' });
    } finally { if (connection) connection.release(); }
}

module.exports = {
    getProfile,
    updateProfile,
    updatePassword
}