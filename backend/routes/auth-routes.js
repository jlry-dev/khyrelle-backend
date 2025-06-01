const { Router } = require("express")


const authRouter = Router()

const controllers = require("../controllers/auth-controllers")

// Route prefix /api/auth

authRouter.post('/signup', controllers.signUp)
authRouter.post('/login', controllers.logIn)

module.exports = authRouter