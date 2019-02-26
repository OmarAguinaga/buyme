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
}

module.exports = Query
