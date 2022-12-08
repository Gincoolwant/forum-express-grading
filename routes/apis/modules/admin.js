const express = require('express')
const router = express.Router()

const upload = require('../../../middleware/multer')
const adminController = require('../../../controllers/apis/admin-controller')

router.get('/restaurants/create', adminController.createRestaurant)
router.get('/restaurants/:id/edit', adminController.editRestaurant)
router.get('/restaurants/:id', adminController.getRestaurant)
router.put('/restaurants/:id', upload.single('image'), adminController.putRestaurant)
router.get('/restaurants', adminController.getRestaurants)
router.post('/restaurants', upload.single('image'), adminController.postRestaurant)
router.delete('/restaurants/:id', adminController.deleteRestaurant)

router.patch('/users/:id', adminController.patchUser)
router.get('/users', adminController.getUsers)

module.exports = router
