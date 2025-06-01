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
            'SELECT CustomerID, firstName, lastName, userEmail, PhoneNumber, AvatarURL FROM `customer` WHERE `CustomerID` = ?',
            [customerId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User profile not found.' });
        const userProfile = rows[0];
        res.status(200).json({
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            email: userProfile.userEmail,
            phone: userProfile.PhoneNumber || '',
            avatarUrl: userProfile.AvatarURL || ''
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
        const [updatedRows] = await connection.execute(
             'SELECT CustomerID, firstName, lastName, userEmail, PhoneNumber, AvatarURL FROM `customer` WHERE `CustomerID` = ?',
            [customerId]
        );
        const updatedProfile = updatedRows[0];
        res.status(200).json({
            message: 'Profile updated successfully.',
            user: {
                firstName: updatedProfile.firstName,
                lastName: updatedProfile.lastName,
                email: updatedProfile.userEmail,
                phone: updatedProfile.PhoneNumber || '',
                avatarUrl: updatedProfile.AvatarURL || ''
            }
        });
    } catch (error) {
        console.error(`Error updating profile for CustomerID ${customerId}:`, error);
        res.status(500).json({ message: 'Failed to update profile.' });
    } finally { if (connection) connection.release(); }
}

const updateAvatar = async (req, res) => {
    if (!req.user || !req.user.CustomerID) {
        return res.status(401).json({ message: "User not properly authenticated." });
    }
    const customerId = req.user.CustomerID;
    const { avatarUrl } = req.body;

    if (typeof avatarUrl !== 'string') {
        return res.status(400).json({ message: "Avatar URL must be a string." });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute(
            'UPDATE `customer` SET `AvatarURL` = ? WHERE `CustomerID` = ?',
            [avatarUrl.trim() || null, customerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ message: 'Avatar updated successfully.', avatarUrl: avatarUrl.trim() || null });
    } catch (error) {
        console.error(`Error updating avatar for CustomerID ${customerId}:`, error);
        res.status(500).json({ message: 'Failed to update avatar.' });
    } finally {
        if (connection) connection.release();
    }
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

const getAddresses = async (req, res) => {
    if (!req.user || !req.user.CustomerID) {
        return res.status(401).json({ message: "User not authenticated." });
    }
    const customerId = req.user.CustomerID;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [addresses] = await connection.execute(
            'SELECT * FROM `customer_addresses` WHERE `CustomerID` = ? ORDER BY `IsDefault` DESC, `AddressID` ASC',
            [customerId]
        );
        res.status(200).json(addresses);
    } catch (error) {
        console.error(`Error fetching addresses for CustomerID ${customerId}:`, error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(501).json({message: "Addresses feature not fully set up (table missing)."});
        }
        res.status(500).json({ message: 'Failed to retrieve addresses.' });
    } finally {
        if (connection) connection.release();
    }
}

const postAddresses = async (req, res) => {
    if (!req.user || !req.user.CustomerID) {
        return res.status(401).json({ message: "User not authenticated." });
    }
    const customerId = req.user.CustomerID;
    const { Nickname, RecipientName, ContactPhone, Line1, Line2, City, Region, PostalCode, Country, IsDefault } = req.body;

    if (!RecipientName || !ContactPhone || !Line1 || !City || !PostalCode || !Country) {
        return res.status(400).json({ message: 'Recipient name, phone, address line 1, city, postal code, and country are required.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();

        if (IsDefault) { // If this new address is set to default, unset others
            await connection.execute(
                'UPDATE `customer_addresses` SET `IsDefault` = FALSE WHERE `CustomerID` = ?',
                [customerId]
            );
        }

        const [result] = await connection.execute(
            'INSERT INTO `customer_addresses` (`CustomerID`, `Nickname`, `RecipientName`, `ContactPhone`, `Line1`, `Line2`, `City`, `Region`, `PostalCode`, `Country`, `IsDefault`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [customerId, Nickname || null, RecipientName, ContactPhone, Line1, Line2 || null, City, Region || null, PostalCode, Country, IsDefault ? 1 : 0]
        );
        const newAddressId = result.insertId;
        await connection.commit();

        const [newAddress] = await connection.execute('SELECT * FROM `customer_addresses` WHERE `AddressID` = ?', [newAddressId]);
        res.status(201).json({ message: 'Address added successfully.', address: newAddress[0] });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error adding address for CustomerID ${customerId}:`, error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(501).json({message: "Addresses feature not fully set up (table missing)."});
        }
        res.status(500).json({ message: 'Failed to add address.' });
    } finally {
        if (connection) connection.release();
    }
}

const updateAddress = async (req, res) => {
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not authenticated." });
    const customerId = req.user.CustomerID;
    const { addressId } = req.params;
    const { Nickname, RecipientName, ContactPhone, Line1, Line2, City, Region, PostalCode, Country, IsDefault } = req.body;

    if (!RecipientName || !ContactPhone || !Line1 || !City || !PostalCode || !Country) {
        return res.status(400).json({ message: 'Required address fields are missing.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();

        if (IsDefault) { 
            await connection.execute(
                'UPDATE `customer_addresses` SET `IsDefault` = FALSE WHERE `CustomerID` = ? AND `AddressID` != ?',
                [customerId, addressId]
            );
        }

        const [result] = await connection.execute(
            'UPDATE `customer_addresses` SET `Nickname`=?, `RecipientName`=?, `ContactPhone`=?, `Line1`=?, `Line2`=?, `City`=?, `Region`=?, `PostalCode`=?, `Country`=?, `IsDefault`=? WHERE `AddressID` = ? AND `CustomerID` = ?',
            [Nickname || null, RecipientName, ContactPhone, Line1, Line2 || null, City, Region || null, PostalCode, Country, IsDefault ? 1 : 0, addressId, customerId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Address not found or user mismatch." });
        }

        await connection.commit();
        const [updatedAddress] = await connection.execute('SELECT * FROM `customer_addresses` WHERE `AddressID` = ?', [addressId]);
        res.status(200).json({ message: "Address updated successfully", address: updatedAddress[0] });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error updating address ${addressId} for CustomerID ${customerId}:`, error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(501).json({message: "Addresses feature not fully set up (table missing)."});
        }
        res.status(500).json({ message: 'Failed to update address.' });
    } finally {
        if (connection) connection.release();
    }
}

const deleteAddress = async (req, res) => {
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not authenticated." });
    const customerId = req.user.CustomerID;
    const { addressId } = req.params;

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [addressCheck] = await connection.execute(
            'SELECT `IsDefault` FROM `customer_addresses` WHERE `AddressID` = ? AND `CustomerID` = ?',
            [addressId, customerId]
        );

        if (addressCheck.length === 0) {
            return res.status(404).json({ message: "Address not found or user mismatch." });
        }

        const [result] = await connection.execute(
            'DELETE FROM `customer_addresses` WHERE `AddressID` = ? AND `CustomerID` = ?',
            [addressId, customerId]
        );

        if (result.affectedRows === 0) {
             return res.status(404).json({ message: "Address not found or user mismatch (already deleted?)." });
        }
        res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
        console.error(`Error deleting address ${addressId} for CustomerID ${customerId}:`, error);
         if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(501).json({message: "Addresses feature not fully set up (table missing)."});
        }
        res.status(500).json({ message: 'Failed to delete address.' });
    } finally {
        if (connection) connection.release();
    }
}

const updateAddressDefault = async (req, res) => {
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not authenticated." });
    const customerId = req.user.CustomerID;
    const { addressId } = req.params;

    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();

        await connection.execute(
            'UPDATE `customer_addresses` SET `IsDefault` = FALSE WHERE `CustomerID` = ?',
            [customerId]
        );

        const [result] = await connection.execute(
            'UPDATE `customer_addresses` SET `IsDefault` = TRUE WHERE `AddressID` = ? AND `CustomerID` = ?',
            [addressId, customerId]
        );
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Address not found or user mismatch." });
        }

        await connection.commit();
        res.status(200).json({ message: "Address set as default successfully" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error setting address ${addressId} as default for CustomerID ${customerId}:`, error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(501).json({message: "Addresses feature not fully set up (table missing)."});
        }
        res.status(500).json({ message: 'Failed to set default address.' });
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    getProfile,
    updateProfile,
    updateAvatar,
    updatePassword,
    getAddresses,
    postAddresses,
    updateAddress,
    deleteAddress,
    updateAddressDefault
}