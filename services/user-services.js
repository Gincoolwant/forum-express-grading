const { User } = require('../models')
const bcrypt = require('bcryptjs')

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
  }
}

module.exports = userServices
