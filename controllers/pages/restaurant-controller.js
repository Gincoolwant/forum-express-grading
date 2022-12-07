const { Restaurant, Category, Comment, User } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikeUsers' }
      ],
      order: [[{ model: Comment }, 'created_at', 'DESC']]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        const isFavorite = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLike = restaurant.LikeUsers.some(l => l.id === req.user.id)

        restaurant.increment('viewCounts', { by: 1 })
        res.render('admin/restaurant', { restaurant: restaurant.toJSON(), isFavorite, isLike })
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        return res.render('dashboard', { restaurant })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        include: [Category],
        order: [['createdAt', 'DESC']],
        limit: 10,
        raw: true,
        nest: true
      }),
      Comment.findAll({
        include: [User, Restaurant],
        order: [['createdAt', 'DESC']],
        limit: 10,
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', { restaurants, comments })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      include: [{ model: User, as: 'FavoritedUsers' }]
    })
      .then(restaurants => {
        const FavoritedRestaurantsId = (req.user && req.user.FavoritedRestaurants.map(fr => fr.id)) || []
        const result = restaurants.map(r => ({
          ...r.toJSON(),
          isFavorite: FavoritedRestaurantsId.includes(r.id),
          favoritedCount: r.FavoritedUsers.length
        }))
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
          .slice(0, 10)
        res.render('top-restaurants', { restaurants: result })
      })
      .catch(err => next(err))
  }
}

module.exports = restaurantController
