const { forwardTo } = require('prisma-binding')
const { hasPermission } = require('../utils')

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // check if there is a current user id
    if (!ctx.request.userId) {
      return null
    }

    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info
    )
  },

  async users(parent, args, ctx, info) {
    // check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You should be logged in to do this')
    }
    // check if the user has the permission
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])
    // if they focus, query all the users
    return ctx.db.query.users({}, info)
  },

  async order(parent, args, ctx, info) {
    // 1. make sure they are logged in
    if (!ctx.request.userId) {
      throw new Error('You arent logged in')
    }
    // 2. Query the current order
    const order = await ctx.db.query.order(
      {
        where: { id: args.id },
      },
      info
    )
    // 3. Check is they have permissions to see this order
    const ownsOrder = order.user.id === ctx.request.userId
    const hasPermissionsToSeeOrder = ctx.request.user.permissions.includes(
      'ADMIN'
    )
    if (!ownsOrder || !hasPermissionsToSeeOrder) {
      throw new Error('You cant see this bud')
    }
    // 4. Return the order
    return order
  },

  async orders(parent, args, ctx, info) {
    const { userId } = ctx.request
    if (!userId) {
      throw new Error('You arent logged in')
    }

    return ctx.db.query.orders(
      {
        where: {
          user: { id: userId },
        },
      },
      info
    )
  },
}

module.exports = Query
