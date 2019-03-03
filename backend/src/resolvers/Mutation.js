const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomBytes } = require('crypto')
const { promisify } = require('util')
const { transport, makeANiceEmail } = require('../mail.js')
const { hasPermission } = require('../utils')

const oneYear = 1000 * 60 * 60 * 24 * 365

const Mutations = {
  async createItem(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that!')
    }

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // This is how we create relationships between the Item and the User
          user: {
            connect: {
              id: ctx.request.userId,
            },
          },
          ...args,
        },
      },
      info
    )

    return item
  },

  updateItem(parent, args, ctx, info) {
    // firs take a copy of the updates
    const updates = { ...args }
    // remove the ID from the updates
    delete updates.id
    // run the update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    )
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id }
    // find the item
    const item = await ctx.db.query.item({ where }, `{ id title user { id } }`)
    // check if they own that item, or have the permissions
    const ownsItem = item.user.id === ctx.request.userId
    const hasPemissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN', 'ITEMDELETE'].includes(permission)
    )

    if (!ownsItem && hasPermission) {
      throw new Error('You are not allowed')
    }

    // delete it
    return ctx.db.mutation.deleteItem({ where }, info)
  },

  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase()
    // hash password
    const password = await bcrypt.hash(args.password, 10)
    // create the user in the db
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] },
        },
      },
      info
    )
    // create the JWT token for them
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
    // set a cookie on response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: oneYear, // 1 year
    })
    // finally we return the user to the browser
    return user
  },

  async signin(parent, { email, password }, ctx, info) {
    // check if there is a user with this email
    const user = await ctx.db.query.user({ where: { email } })
    if (!user) {
      throw new Error(`No such user found for email ${email}`)
    }

    // check is the password is correct
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      throw new Error(`Invalid password!`)
    }

    // generate the JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
    // set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: oneYear, // 1 year
    })
    // return the user

    return user
  },

  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token')
    return { message: 'Goodbye' }
  },

  async requestReset(parent, args, ctx, info) {
    // check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } })
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`)
    }
    // set a reset token and expiry on that user
    const randomBytesPromisified = promisify(randomBytes)
    const resetToken = (await randomBytesPromisified(20)).toString('hex')
    const resetTokenExpiry = Date.now() + 3600000 // one hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry },
    })
    // email then that reset token
    const mailRes = await transport.sendMail({
      from: 'omar.aguinaga94@gmail.com',
      to: user.email,
      subject: 'Your password reset token',
      html: makeANiceEmail(`Your password reset token is here!
      \n\n
      <a href='${
        process.env.FRONTEND_URL
      }/reset?resetToken=${resetToken}'>Click here to reset</a>`),
    })
    // return the msg
    return { message: 'Thanks' }
  },

  async resetPassword(parent, args, ctx, info) {
    // check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error('Your password do not match')
    }
    // check if its a legit reset token
    // check if it is expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    })
    if (!user) {
      throw new Error(`This token is either invalid or expired`)
    }
    // hash their new password
    const password = await bcrypt.hash(args.password, 10)
    // save the new password to the user and remove  the old reset token
    const updatedUser = await ctx.db.mutation.updateUser({
      where: {
        email: user.email,
      },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })
    // generate the jwt
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET)
    // set the jwt cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: oneYear,
    })
    // return the new user
    return updatedUser
  },

  async updatePermissions(parent, args, ctx, info) {
    // check if they are logged in
    if (!ctx.request.userId)
      throw new Error('You should be logged in to do this')
    // query the current user
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId,
        },
      },
      info
    )
    // check if they have permissions to do this
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE'])
    // update the permissions
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions,
          },
        },
        where: {
          id: args.userId,
        },
      },
      info
    )
  },

  async addToCart(parent, args, ctx, info) {
    // 1. make sure they are signed in
    const { userId } = ctx.request
    if (!userId) throw new Error('You must be logged in!')
    // 2. query the users current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id },
      },
    })
    // 3. check if that item is already in their cart and increment by 1 it it is
    if (existingCartItem) {
      console.log('this item is already in the cart')
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 },
        },
        info
      )
    }
    // 4. it it is not create a fresh cartItem for that user
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId },
          },
          item: {
            connect: { id: args.id },
          },
        },
      },
      info
    )
  },
}

module.exports = Mutations
