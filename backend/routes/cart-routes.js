const { Router } = require("express")

const cartRouter = Router()

const authenticateUser = require('../middlewares/auth-user-middleware')
const controllers = require("../controllers/cart-controllers")

// Auth checker
cartRouter.use(authenticateUser)

// Route prefix /api/cart
cartRouter.get('/', controllers.getCart)
cartRouter.delete('/', controllers.deleteCart)

cartRouter.post('/items', controllers.postCartItem)
cartRouter.put('/items/:cartItemId', controllers.updateCartItem)
cartRouter.delete('/items/:cartItemId', controllers.deleteCartItem)



module.exports = cartRouter