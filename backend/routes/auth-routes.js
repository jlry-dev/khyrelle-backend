const { Router } = require("express")
// const jwt = require('jsonwebtoken'); // Uncomment if you implement JWT

const authRouter = Router()

// const JWT_SECRET = process.env.JWT_SECRET;
const controllers = require("../controllers/auth-controllers")

// Route prefix /api/auth

authRouter.post('/signup', controllers.signUp)
authRouter.post('/login', controllers.logIn)

module.exports = authRouter