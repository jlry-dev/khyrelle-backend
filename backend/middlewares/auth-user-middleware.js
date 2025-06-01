// --- Authentication Middleware (Placeholder - Updated for stricter checking) ---
const authenticateUser = (req, res, next) => {
  const userIdFromHeader = req.headers['temp-user-id'];

  if (userIdFromHeader && !isNaN(parseInt(userIdFromHeader))) {
    req.user = { CustomerID: parseInt(userIdFromHeader) };
    console.log(`Authenticated (temp) user: CustomerID ${req.user.CustomerID}`);
    return next(); // User identified, proceed to the route
  } else {
    // Define paths that strictly require user identification via this middleware
    const protectedPaths = ['/api/cart', '/api/user', '/api/orders'];
    const requiresAuth = protectedPaths.some(p => req.path.startsWith(p));

    if (requiresAuth) {
      console.warn(`WARN: Missing or invalid 'temp-user-id' header for protected route ${req.path}. Denying access.`);
      return res.status(401).json({ message: "User not identified or invalid user ID. Please send a valid 'temp-user-id' header or ensure you are logged in." });
    }
    
    // For other paths that might use this middleware optionally or are public
    console.warn(`WARN: No valid 'temp-user-id' header for ${req.path}. Proceeding without setting req.user from header for this route (if route doesn't strictly require it).`);
    return next();
  }
};

module.exports = authenticateUser