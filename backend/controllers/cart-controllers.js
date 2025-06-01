require('dotenv').config();

const dbPool = require("../config/db-config")

const getCart = async (req, res) => {
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not properly authenticated for cart." });
    const customerId = req.user.CustomerID;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [cartDbItems] = await connection.execute(
            `SELECT ci.ID as CartItemID, ci.ProductID, ci.Quantity, ci.Price as UnitPrice, ci.RushOrder,
                    p.Name, p.ImagePath, p.Description, p.ItemType, p.Material, p.Stock
             FROM cart_items ci JOIN products p ON ci.ProductID = p.ProductID WHERE ci.CustomerID = ?`,
            [customerId]
        );
        res.status(200).json(cartDbItems);
    } catch (error) {
        console.error(`Error fetching cart for CustomerID ${customerId}:`, error);
        res.status(500).json({ message: 'Failed to retrieve cart.' });
    } finally { if (connection) connection.release(); }
}

const deleteCart = async (req, res) => {
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not properly authenticated for cart." });
    const customerId = req.user.CustomerID;
    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.execute('DELETE FROM `cart_items` WHERE `CustomerID` = ?', [customerId]);
        res.status(200).json({ message: 'Cart cleared successfully.' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Failed to clear cart.' });
    } finally { if (connection) connection.release(); }
}

const postCartItem = async (req, res) => {
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not properly authenticated for cart." });
    const customerId = req.user.CustomerID;
    const { productId, quantity, unitPrice, rushOrder } = req.body;
    if (productId === undefined || quantity === undefined || unitPrice === undefined || rushOrder === undefined) {
        return res.status(400).json({ message: 'Product ID, quantity, unit price, and rush order status are required.' });
    }
    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) return res.status(400).json({ message: 'Quantity must be a positive number.' });
    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();
        const [existingItems] = await connection.execute(
            'SELECT * FROM `cart_items` WHERE `CustomerID` = ? AND `ProductID` = ? AND `RushOrder` = ?',
            [customerId, productId, rushOrder ? 1 : 0]
        );
        let cartItemId; let finalQuantity = numQuantity; let actionMessage = ''; let statusCode = 200;
        if (existingItems.length > 0) {
            const existingItem = existingItems[0]; finalQuantity = existingItem.Quantity + numQuantity;
            cartItemId = existingItem.ID;
            await connection.execute('UPDATE `cart_items` SET `Quantity` = ? WHERE `ID` = ? AND `CustomerID` = ?', [finalQuantity, cartItemId, customerId]);
            actionMessage = 'Cart item quantity updated.';
        } else {
            const [result] = await connection.execute(
                'INSERT INTO `cart_items` (`CustomerID`, `ProductID`, `Quantity`, `Price`, `RushOrder`) VALUES (?, ?, ?, ?, ?)',
                [customerId, productId, finalQuantity, parseFloat(unitPrice), rushOrder ? 1 : 0]
            );
            cartItemId = result.insertId; actionMessage = 'Item added to cart.'; statusCode = 201;
        }
        await connection.commit();
        const [itemDetails] = await connection.execute(
             `SELECT ci.ID as CartItemID, ci.ProductID, ci.Quantity, ci.Price as UnitPrice, ci.RushOrder,
                     p.Name, p.ImagePath, p.Description, p.ItemType, p.Material, p.Stock
              FROM cart_items ci JOIN products p ON ci.ProductID = p.ProductID WHERE ci.ID = ? AND ci.CustomerID = ?`, [cartItemId, customerId]
        );
        if (itemDetails.length === 0) throw new Error("Failed to retrieve item details after cart operation.");
        res.status(statusCode).json({ message: actionMessage, item: itemDetails[0] });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error adding/updating cart item:', error);
        res.status(500).json({ message: 'Failed to process cart item.' });
    } finally { if (connection) connection.release(); }
}

const updateCartItem = async (req, res) => {
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not properly authenticated for cart." });
    const customerId = req.user.CustomerID;
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    if (quantity === undefined || parseInt(quantity) <= 0) return res.status(400).json({ message: 'Valid quantity is required.' });
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute(
            'UPDATE `cart_items` SET `Quantity` = ? WHERE `ID` = ? AND `CustomerID` = ?',
            [parseInt(quantity), cartItemId, customerId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "Cart item not found or user mismatch." });
        const [updatedItemDetails] = await connection.execute(
             `SELECT ci.ID as CartItemID, ci.ProductID, ci.Quantity, ci.Price as UnitPrice, ci.RushOrder,
                     p.Name, p.ImagePath, p.Description, p.ItemType, p.Material, p.Stock
              FROM cart_items ci JOIN products p ON ci.ProductID = p.ProductID WHERE ci.ID = ? AND ci.CustomerID = ?`, [cartItemId, customerId]
        );
        res.status(200).json({ message: 'Cart item quantity updated.', item: updatedItemDetails[0] });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Failed to update cart item.' });
    } finally { if (connection) connection.release(); }
}

const deleteCartItem = async (req, res) => {
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not properly authenticated for cart." });
    const customerId = req.user.CustomerID;
    const { cartItemId } = req.params;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM `cart_items` WHERE `ID` = ? AND `CustomerID` = ?',
            [cartItemId, customerId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "Cart item not found or user mismatch." });
        res.status(200).json({ message: 'Item removed from cart.' });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ message: 'Failed to remove item from cart.' });
    } finally { if (connection) connection.release(); }
}

module.exports = {
    getCart,
    deleteCart,
    postCartItem,
    updateCartItem,
    deleteCartItem
}