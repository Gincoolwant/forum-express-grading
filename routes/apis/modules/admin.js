const express = require('express')
const router = express.Router()

const upload = require('../../../middleware/multer')

const adminController = require('../../../controllers/apis/admin-controller')
const { apiErrorHandler } = require('../../../middleware/error-handler')

router.get('/restaurants', adminController.getRestaurants)
router.post('/restaurants', upload.single('image'), adminController.postRestaurant)
router.delete('/restaurants/:id', adminController.deleteRestaurant)
router.use('/', apiErrorHandler)

module.exports = router
