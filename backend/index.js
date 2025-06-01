// METALWORKS/backend/index.js

// Import necessary modules
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); 
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const REACT_APP_FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';

// --- Middleware ---
const corsOptions = {
  origin: REACT_APP_FRONTEND_URL,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public_images_backend', express.static(path.join(__dirname, 'public/images')));


// --- Database Connection Pool ---
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'metalworks',
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

// --- Authentication Middleware (Placeholder - Needs Real Auth for Production) ---
const authenticateUser = (req, res, next) => {
  const userIdFromHeader = req.headers['temp-user-id'];

  if (userIdFromHeader && !isNaN(parseInt(userIdFromHeader))) {
    req.user = { CustomerID: parseInt(userIdFromHeader) };
    console.log(`Authenticated (temp) user: CustomerID ${req.user.CustomerID}`);
    return next(); 
  } else {
    const protectedPaths = ['/api/cart', '/api/user', '/api/orders'];
    const requiresAuth = protectedPaths.some(p => req.path.startsWith(p));

    if (requiresAuth) {
      console.warn(`WARN: Missing or invalid 'temp-user-id' header for protected route ${req.path}. Denying access.`);
      return res.status(401).json({ message: "User not identified or invalid user ID. Please send a valid 'temp-user-id' header or ensure you are logged in." });
    }
    
    console.warn(`WARN: No valid 'temp-user-id' header for ${req.path}. Proceeding without setting req.user from header for this route (if route doesn't strictly require it).`);
    return next();
  }
};


// --- API Routes ---

// AUTH Routes (Signup, Login) - These should NOT use authenticateUser middleware here.
app.post('/api/auth/signup', async (req, res) => { 
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
});

app.post('/api/auth/login', async (req, res) => { 
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
});

// PRODUCT Routes (Public)
app.get('/api/products', async (req, res) => { 
  let connection;
  try {
    connection = await dbPool.getConnection();
    const [products] = await connection.execute('SELECT * FROM `products`');
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to retrieve products.' });
  } finally {
    if (connection) connection.release();
  }
});
app.get('/api/products/:id', async (req, res) => { 
  const { id } = req.params;
  let connection;
  try {
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM `products` WHERE `ProductID` = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve product details.' });
  } finally {
    if (connection) connection.release();
  }
});
app.get('/api/products/search', async (req, res) => {
  const searchTerm = req.query.q; 
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
    return res.status(400).json({ message: 'Search term is required.' });
  }
  let connection;
  try {
    connection = await dbPool.getConnection();
    const query = `
      SELECT * FROM products 
      WHERE Name LIKE ? OR Description LIKE ? OR ItemType LIKE ? OR Material LIKE ?
      ORDER BY Name ASC
    `;
    const searchPattern = `%${searchTerm.trim()}%`; 
    const [results] = await connection.execute(query, [searchPattern, searchPattern, searchPattern, searchPattern]);
    console.log(`Search for "${searchTerm}" returned ${results.length} products.`);
    res.status(200).json(results); 
  } catch (error) {
    console.error('Error during product search:', error);
    res.status(500).json({ message: 'Failed to search for products.' });
  } finally {
    if (connection) connection.release();
  }
});

// ORDER Route (Requires authentication)
app.post('/api/orders', authenticateUser, async (req, res) => { 
  if (!req.user || !req.user.CustomerID) {
    return res.status(401).json({ message: "User authentication failed for order placement." });
  }
  const customerId = req.user.CustomerID; 
  const { items: itemsInPayload, paymentMethod, finalTotal, isRushOrder, messageForSeller, deliveryAddress } = req.body;

  if (!itemsInPayload || itemsInPayload.length === 0) return res.status(400).json({ message: 'Order must contain at least one item.' });
  if (!paymentMethod || finalTotal === undefined) return res.status(400).json({ message: 'Payment method and total amount are required.' });
  if (!deliveryAddress || !deliveryAddress.line1 || !deliveryAddress.city || !deliveryAddress.postalCode || !deliveryAddress.country || !deliveryAddress.recipientName || !deliveryAddress.contactPhone) {
    return res.status(400).json({ message: 'Complete delivery address including recipient name and phone is required.' });
  }

  let connection;
  try {
    connection = await dbPool.getConnection();
    await connection.beginTransaction();
    const orderDate = new Date().toISOString().slice(0, 10); 
    const rushOrderText = isRushOrder ? '1' : '0';
    const approvalStatus = 'Pending'; 
    
    const [orderResult] = await connection.execute(
      'INSERT INTO `order` (`CustomerID`, `OrderDate`, `RushOrder`, `ApprovalStatus`, `TotalCost`, `OrderNotes`, `ShippingRecipientName`, `ShippingAddressLine1`, `ShippingAddressLine2`, `ShippingCity`, `ShippingPostalCode`, `ShippingCountry`, `ShippingContactPhone`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ customerId, orderDate, rushOrderText, approvalStatus, finalTotal, messageForSeller || null, 
        deliveryAddress.recipientName, deliveryAddress.line1, deliveryAddress.line2 || null, 
        deliveryAddress.city, deliveryAddress.postalCode, deliveryAddress.country, deliveryAddress.contactPhone
      ]
    );
    const newOrderId = orderResult.insertId;

    for (const cartItem of itemsInPayload) {
      const itemTotalCost = (Number(cartItem.unitPrice) || 0) * (cartItem.quantity || 1);
      const placeholderPricingTierID = 0; 
      await connection.execute(
        'INSERT INTO `item` (`OrderID`, `PricingTierID`, `UnitPrice`, `TotalCost`, `Quantity`, `ProductID`) VALUES (?, ?, ?, ?, ?, ?)',
        [newOrderId, placeholderPricingTierID, cartItem.unitPrice, itemTotalCost, cartItem.quantity, cartItem.productId]
      );
    }
    
    const paymentAddressPlaceholder = "Order Payment - Address N/A"; 
    const placeholderOriginalPaymentID = newOrderId; 
    await connection.execute(
      'INSERT INTO `paymentmethod` (`CustomerID`, `OrderID`, `PaymentID`, `Details`, `Address`) VALUES (?, ?, ?, ?, ?)',
      [customerId, newOrderId, placeholderOriginalPaymentID, paymentMethod, paymentAddressPlaceholder] 
    );

    await connection.commit();
    res.status(201).json({ 
      message: 'Order placed successfully!', 
      orderDetails: { 
        orderId: newOrderId, customerId, orderDate, totalAmount: finalTotal,
        paymentMethod, itemCount: itemsInPayload.length 
      } 
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error placing order:', error); 
    res.status(500).json({ message: 'Failed to place order. Please check server logs for specific database errors.' });
  } finally {
    if (connection) connection.release();
  }
});


// USER-SPECIFIC CART API Routes (all use authenticateUser)
app.get('/api/cart', authenticateUser, async (req, res) => { 
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
});
app.post('/api/cart/items', authenticateUser, async (req, res) => { 
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
});
app.put('/api/cart/items/:cartItemId', authenticateUser, async (req, res) => { 
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
});
app.delete('/api/cart/items/:cartItemId', authenticateUser, async (req, res) => { 
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
});
app.delete('/api/cart', authenticateUser, async (req, res) => { 
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
});


// USER PROFILE & DASHBOARD API Routes
app.get('/api/user/profile', authenticateUser, async (req, res) => { 
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
});
app.put('/api/user/profile', authenticateUser, async (req, res) => { 
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
});
app.post('/api/user/password', authenticateUser, async (req, res) => { 
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
});
app.get('/api/user/orders', authenticateUser, async (req, res) => { 
    if (!req.user || !req.user.CustomerID) return res.status(401).json({ message: "User not properly authenticated." });
    const customerId = req.user.CustomerID;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [orders] = await connection.execute(
            'SELECT OrderID, OrderDate, TotalCost, ApprovalStatus as Status FROM `order` WHERE `CustomerID` = ? ORDER BY OrderDate DESC',
            [customerId]
        );
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [items] = await connection.execute(
                `SELECT i.Quantity, i.UnitPrice, p.Name as ProductName, p.ImagePath, p.ProductID 
                 FROM item i JOIN products p ON i.ProductID = p.ProductID WHERE i.OrderID = ?`,
                [order.OrderID]
            );
            return { 
                id: order.OrderID, date: order.OrderDate, total: order.TotalCost, status: order.Status,
                items: items.map(it => ({
                    id: it.ProductID, name: it.ProductName, price: it.UnitPrice, quantity: it.Quantity,
                    imagePath: it.ImagePath 
                }))
            };
        }));
        res.status(200).json(ordersWithItems);
    } catch (error) {
        console.error(`Error fetching order history for CustomerID ${customerId}:`, error);
        res.status(500).json({ message: 'Failed to retrieve order history.' });
    } finally { if (connection) connection.release(); }
});

// ADDRESS API Routes (Placeholders - require customer_addresses table and full implementation)
app.get('/api/user/addresses', authenticateUser, (req, res) => res.status(501).json({message: "Addresses GET not implemented"}));
app.post('/api/user/addresses', authenticateUser, (req, res) => res.status(501).json({message: "Addresses POST not implemented"}));
app.put('/api/user/addresses/:addressId', authenticateUser, (req, res) => res.status(501).json({message: "Addresses PUT not implemented"}));
app.delete('/api/user/addresses/:addressId', authenticateUser, (req, res) => res.status(501).json({message: "Addresses DELETE not implemented"}));
app.put('/api/user/addresses/:addressId/default', authenticateUser, (req, res) => res.status(501).json({message: "Set default address not implemented"}));


// --- Default Route & Start Server ---
app.get('/', (req, res) => {
  res.send('Welcome to the Metalworks API!');
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${REACT_APP_FRONTEND_URL}`);
});
