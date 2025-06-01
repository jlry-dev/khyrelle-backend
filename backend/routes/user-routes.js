const { Router } = require("express")

const userRouter = Router()

const authenticateUser = require('../middlewares/auth-user-middleware')
const controllers = require("../controllers/user-controllers")

// Auth check
userRouter.use(authenticateUser)

// Route prefix /api/user
userRouter.get('/profile', controllers.getProfile)
userRouter.put('/profile', controllers.updateProfile)
userRouter.put('/avatar', controllers.updateAvatar)
userRouter.put('/password', controllers.updatePassword) // Changed from POST to PUT

// ADDRESS API Routes
userRouter.get('/addresses', controllers.getAddresses);
userRouter.post('/addresses', controllers.postAddresses);
userRouter.put('/addresses/:addressId', controllers.updateAddress);
userRouter.delete('/addresses/:addressId', controllers.deleteAddress);
userRouter.put('/addresses/:addressId/default', controllers.updateAddressDefault);


/* NOTE:
    Moved route /api/user/orders to /api/orders
*/



module.exports = userRouter