// let's go!
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: 'variables.env' })

const createServer = require('./createServer')
const db = require('./db')

const server = createServer()

// express middleware to handle cookies JWT
server.express.use(cookieParser())

// decode the JWT so we can get the user id on each request
server.express.use((req, res, next) => {
  const { token } = req.cookies
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET)
    req.userId = userId
    // put the user id onto the req for furure requests to access
  }
  next()
})
// todo express middleware to populate current user

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  deets => {}
)
