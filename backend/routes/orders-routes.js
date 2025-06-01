const { Router } = require("express")

const ordersRouter = Router()

const authenticateUser = require('../middlewares/auth-user-middleware')

const controllers = require("../controllers/orders-controllers")

// Protect the routes
// Make sures the user is properly authenticated before accessing the routes.
ordersRouter.use(authenticateUser)

// Route prefix /api/orders
ordersRouter.post('/', controllers.postOrder)
ordersRouter.get('/', controllers.getOrders) // Bag o ni nga route from "/api/user/orders/"

module.exports = ordersRouter