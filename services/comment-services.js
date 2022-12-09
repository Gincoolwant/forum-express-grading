const assert = require('assert')
const { Restaurant, User, Comment } = require('../models')

const commentServices = {
  postComment: (req, cb) => {
    const { restaurantId, text } = req.body
    const userId = req.user.id
    assert(text, 'Comment text is required')
    return Promise.all([
      User.findByPk(userId),
      Restaurant.findByPk(restaurantId)
    ])
      .then(([user, restaurant]) => {
        assert(user, "User didn't exist!")
        assert(restaurant, "User didn't exist!")

        return Comment.create({
          text,
          restaurantId,
          userId
        })
      })
      .then(createdComment => cb(null, { comment: createdComment }))
      .catch(err => cb(err))
  },
  deleteComment: (req, cb) => {
    return Comment.findByPk(req.params.id)
      .then(comment => {
        assert(comment, "Comment didn't exist!")
        return comment.destroy()
      })
      .then(deletedComment => cb(null, { comment: deletedComment }))
      .catch(err => cb(err))
  }
}

module.exports = commentServices
