const express = require('express')
const router = express.Router()
const restController = require('../../controllers/apis/restaurant-controller')
const passport = require('passport')
const userController = require('../../controllers/apis/user-controller')
const admin = require('./modules/admin')

router.use('/admin', admin)
router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)
router.get('/restaurants', restController.getRestaurants)

module.exports = router
