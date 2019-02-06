// let's go!
require('dotenv').config({ path: 'variables.env' })

const createServer = require('./createServer')
const db = require('./db')

const server = createServer()

// todo express middleware to handle cookies JWT
// todo express middleware to populate current user

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  deets => {
    console.log(`server running on localhost:${deets.port}`)
  }
)
