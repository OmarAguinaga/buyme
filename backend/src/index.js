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

server.express.use(async (req, res, next) => {
  // if there arent any users skip this
  if (!req.userId) return next()
  const user = await db.query.user(
    { where: { id: req.userId } },
    '{ id, permissions, email, name }'
  )
  req.user = user
  next()
})

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  deets => {}
)
