const { Router } = require("express")

const productsRouter = Router()

const controllers = require("../controllers/products-controllers")

// Route prefix /api/products
productsRouter.post('/', controllers.getProducts)
productsRouter.post('/:id', controllers.getProduct)

// Product Search Route (Refined to always return 200 with array)
productsRouter.get('/search', controllers.getSearchProducts)


module.exports = productsRouter