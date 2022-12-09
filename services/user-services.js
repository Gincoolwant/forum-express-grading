const { Restaurant, User, Comment } = require('../models')
const { imgurFileHandler } = require('../helpers/file-helpers')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const assert = require('assert')

const userServices = {
  signUp: (req, cb) => {
    if (req.body.password !== req.body.passwordCheck) throw new Error('Password do not match!')
    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('The email already exist.')
        return bcrypt.hash(req.body.password, 10)
      })
      .then(hash => {
        return User.create({
          name: req.body.name,
          email: req.body.email,
          password: hash
        })
      })
      .then(newUser => cb(null, newUser))
      .catch(err => cb(err))
  },
  signIn: (req, res, next) => {
    try {
      const userData = req.user.toJSON()
      delete userData.password
      const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' })
      res.json({
        status: 'success',
        data: {
          token,
          user: userData
        }
      })
    } catch (err) {
      next(err)
    }
  },
  getUser: (req, cb) => {
    return Promise.all([
      Comment.findAndCountAll({
        where: { userId: req.params.id },
        include: Restaurant,
        order: [['created_at', 'DESC']],
        raw: true,
        nest: true
      }),
      User.findByPk(req.params.id, {
        raw: true,
        nest: true
      })
    ])
      .then(([comments, user]) => {
        delete user.password
        assert(user, "User didn't exist!")
        cb(null, { user, comments })
      })
      .catch(err => cb(err))
  },
  editUser: (req, cb) => {
    return User.findByPk(req.params.id, {
      raw: true
    })
      .then(user => {
        delete user.password
        assert(user, "User didn't exist!")
        cb(null, { user })
      })
      .catch(err => cb(err))
  },
  putUser: (req, cb) => {
    const { name } = req.body
    assert(name, 'User name is required!')
    const { file } = req
    return Promise.all([
      imgurFileHandler(file),
      User.findByPk(req.params.id)
    ])
      .then(([filePath, user]) => {
        if (!user) throw new Error("Restaurant didn't exist!")
        return user.update({
          name,
          image: filePath || user.image
        })
      })
      .then(updatedUser => {
        updatedUser = updatedUser.toJSON()
        delete updatedUser.password
        cb(null, updatedUser)
      })
      .catch(err => cb(err))
  },
  getTopUsers: (req, cb) => {
    // 撈出所有 User 與 followers 資料
    return User.findAll({
      include: [{
        model: User,
        as: 'Followers',
        attributes: {
          exclude: ['password']
        }
      }],
      attributes: {
        exclude: ['password']
      }
    })
      .then(users => {
        // 整理 users 資料，把每個 user 項目都拿出來處理一次，並把新陣列儲存在 users 裡
        const result = users
          .map(user => ({
            ...user.toJSON(),
            followerCount: user.Followers.length,
            isFollowed: req.user.Followings.some(f => f.id === user.id)
          }))
          .sort((a, b) => b.followerCount - a.followerCount)
        cb(null, { users: result })
      })
      .catch(err => cb(err))
  }
}

module.exports = userServices
