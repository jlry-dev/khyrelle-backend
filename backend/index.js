// METALWORKS/backend/index.js

// Import necessary modules
require('dotenv').config();
const express = require('express');
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

const ROUTERS = require('./routes/index-routes')

// --- API Routes ---

// AUTH Routes - PUBLIC
app.use('/api/auth', ROUTERS.authRouter)

// PRODUCT Routes - PUBLIC
app.use('/api/products', ROUTERS.productsRouter)

// ORDERS Route - PROTECTED
app.use('/api/orders', ROUTERS.ordersRouter)

// USER-SPECIFIC CART API Routes - PROTECTED
app.use('/api/cart', ROUTERS.cartRouter)

// USER PROFILE & DASHBOARD API Routes - PROTECTED
app.use('/api/user', ROUTERS.userRouter)



// --- Default Route & Start Server ---
app.get('/', (req, res) => {
  res.send('Welcome to the Metalworks API!');
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${REACT_APP_FRONTEND_URL}`);
});