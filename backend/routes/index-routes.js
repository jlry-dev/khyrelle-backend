const authRouter = require('./auth-routes')
const cartRouter = require('./cart-routes')
const ordersRouter = require('./orders-routes')
const productsRouter = require('./products-routes')
const userRouter = require('./user-routes')

module.exports = {
    authRouter,
    cartRouter,
    ordersRouter,
    productsRouter,
    userRouter
}
