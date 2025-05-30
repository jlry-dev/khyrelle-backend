// METALWORKS/backend/index.js

// Import necessary modules
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const authenticateUser = (req, res, next) => {

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

// --- API Routes ---

// Signup Route
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
    const [rows] = await connection.execute('SELECT * FROM `customer` WHERE `userEmail` = ?', [userEmail]);
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

// Get All Products Route
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

// Get Single Product by ID Route
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

// Create New Order Route
app.post('/api/orders', async (req, res) => {
  const customerId = 1; // !!! PLACEHOLDER - REPLACE with actual authenticated user ID logic !!!
  
  const {
    items, 
    paymentMethod, // This is the string like "Cash On Delivery" from frontend
    finalTotal, 
    isRushOrder 
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item.' });
  }
  if (!paymentMethod || finalTotal === undefined) {
    return res.status(400).json({ message: 'Payment method and total amount are required.' });
  }

  let connection;
  try {
    connection = await dbPool.getConnection();
    await connection.beginTransaction();

    // 1. Insert into 'order' table
    const orderDate = new Date().toISOString().slice(0, 10); 
    const rushOrderText = isRushOrder ? '1' : '0';
    const approvalStatus = 'Pending'; 

    const [orderResult] = await connection.execute(
      'INSERT INTO `order` (`CustomerID`, `OrderDate`, `RushOrder`, `ApprovalStatus`, `TotalCost`) VALUES (?, ?, ?, ?, ?)',
      [customerId, orderDate, rushOrderText, approvalStatus, finalTotal]
    );
    const newOrderId = orderResult.insertId;

    // 2. Insert into 'item' table for each cart item
    for (const cartItem of items) {
      const itemTotalCost = (Number(cartItem.unitPrice) || 0) * (cartItem.quantity || 1);
      const placeholderPricingTierID = 0; 
      
      // ASSUMPTION: Your 'item' table has a 'ProductID' column.
      await connection.execute(
        'INSERT INTO `item` (`OrderID`, `PricingTierID`, `UnitPrice`, `TotalCost`, `Quantity`, `ProductID`) VALUES (?, ?, ?, ?, ?, ?)',
        [newOrderId, placeholderPricingTierID, cartItem.unitPrice, itemTotalCost, cartItem.quantity, cartItem.productId]
      );
    }

    // 3. Insert into the existing 'paymentmethod' table
    // The 'paymentMethod' string from frontend goes into the 'Details' column.
    // ASSUMPTIONS for `paymentmethod` table from your metalworks.sql:
    //   - `PaymentMethodID` (PK) is set to AUTO_INCREMENT in your live database. (CRITICAL)
    //   - `PaymentID` (INT NOT NULL): Using newOrderId here to link to the order.
    //   - `Address` (TEXT NOT NULL): Using a placeholder as it's not provided for this order-specific payment entry.
    const paymentAddressPlaceholder = "Order Payment - Address N/A"; 
    await connection.execute(
      'INSERT INTO `paymentmethod` (`CustomerID`, `PaymentID`, `Details`, `Address`) VALUES (?, ?, ?, ?)',
      [customerId, newOrderId, paymentMethod, paymentAddressPlaceholder] 
      // `PaymentMethodID` is omitted, relying on AUTO_INCREMENT.
    );

    await connection.commit();
    res.status(201).json({ 
      message: 'Order placed successfully!', 
      orderDetails: { 
        orderId: newOrderId, 
        customerId: customerId,
        orderDate: orderDate,
        totalAmount: finalTotal,
        paymentMethod: paymentMethod,
        itemCount: items.length 
      } 
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error placing order:', error); // THIS LOG IS CRITICAL FOR DEBUGGING
    res.status(500).json({ message: 'Failed to place order. Please check server logs.' });
  } finally {
    if (connection) connection.release();
  }
});


// --- Placeholder Cart API Routes ---
// In backend index.js
app.get('/api/cart', authenticateUser, async (req, res) => {
    const customerId = req.user.CustomerID; // Get CustomerID from authenticated user
    let connection;
    try {
        connection = await dbPool.getConnection();
        // Join cart_items with products to get full details
        const [items] = await connection.execute(
            `SELECT ci.ID as CartItemID, ci.ProductID, ci.Quantity, ci.RushOrder,
                    p.Name, p.Price as UnitPrice, p.ImagePath, p.Description, p.ItemType, p.Material
             FROM cart_items ci
             JOIN products p ON ci.ProductID = p.ProductID
             WHERE ci.CustomerID = ?`,
            [customerId]
        );
        res.status(200).json(items);
    } catch (error) {
        console.error(`Error fetching cart for CustomerID ${customerId}:`, error);
        res.status(500).json({ message: 'Failed to retrieve cart.' });
    } finally {
        if (connection) connection.release();
    }
});if (req.headers.temp_user_id) { // Temporary way to pass user ID for testing
       req.user = { CustomerID: parseInt(req.headers.temp_user_id) };
       next();
   } else {
       // For now, default to user 1 if no header, but ideally this should be an error
       console.warn("WARN: No temp_user_id header. Defaulting to CustomerID 1 for cart operations. Implement proper auth!");
       req.user = { CustomerID: 1 }; 
       next();
       // Or send error: return res.status(401).json({ message: "User not authenticated for cart operation." });
   }
// ... (other placeholder cart routes remain the same) ...
app.post('/api/cart/items', async (req, res) => {
    res.status(501).json({ message: `Cart POST not fully implemented.` });
});
app.put('/api/cart/items/:cartDbId', async (req, res) => {
    res.status(501).json({ message: `Cart PUT for item ${req.params.cartDbId} not fully implemented.` });
});
app.delete('/api/cart/items/:cartDbId', async (req, res) => {
    res.status(501).json({ message: `Cart DELETE for item ${req.params.cartDbId} not fully implemented.` });
});


// --- Default Route ---
app.get('/', (req, res) => {
  res.send('Welcome to the Metalworks API!');
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${REACT_APP_FRONTEND_URL}`);
});
