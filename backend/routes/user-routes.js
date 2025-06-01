const { Router } = require("express")

const userRouter = Router()

const authenticateUser = require('../middlewares/auth-user-middleware')
const controllers = require("../controllers/user-controllers")

// Auth check
userRouter.use(authenticateUser)

// Route prefix /api/user
userRouter.get('/profile', controllers.getProfile)
userRouter.put('/profile', controllers.updateProfile)
userRouter.put('/password', controllers.updatePassword) // Changed from POST to PUT

/* 
    Moved route /api/user/orders to /api/orders
*/


// ADDRESS API Routes (Placeholders - require customer_addresses table and full implementation)
userRouter.get('/addresses', (req, res) => res.status(501).json({message: "Addresses GET not implemented"}));
userRouter.post('/addresses', (req, res) => res.status(501).json({message: "Addresses POST not implemented"}));
userRouter.put('/addresses/:addressId', (req, res) => res.status(501).json({message: "Addresses PUT not implemented"}));
userRouter.delete('/addresses/:addressId', (req, res) => res.status(501).json({message: "Addresses DELETE not implemented"}));
userRouter.put('/addresses/:addressId/default', (req, res) => res.status(501).json({message: "Set default address not implemented"}));


module.exports = userRouter