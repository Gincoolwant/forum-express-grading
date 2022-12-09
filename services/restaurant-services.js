const { Restaurant, Category, User, Comment } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const restaurantServices = {
  getRestaurants: (req, cb) => {
    const categoryId = Number(req.query.categoryId) || ''
    const DEFAULT_LIMIT = 9
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    return Promise.all([
      Restaurant.findAndCountAll({
        include: Category,
        where: { // 新增查詢條件
          ...categoryId ? { categoryId } : {} // 檢查 categoryId 是否為空值
        },
        limit, // fetch limit筆資料
        offset, // skip offset筆資料
        nest: true,
        raw: true
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        const indexDescriptionLength = 50
        const FavoritedRestaurantsId = req.user?.FavoritedRestaurants ? req.user.FavoritedRestaurants.map(fr => fr.id) : []
        const LikeRestaurantsId = req.user?.LikeRestaurants ? req.user?.LikeRestaurants.map(lr => lr.id) : []
        const data = restaurants.rows.map(r => ({
          ...r,
          description: r.description ? r.description.substring(0, indexDescriptionLength) : [],
          isFavorite: FavoritedRestaurantsId.includes(r.id),
          isLike: LikeRestaurantsId.includes(r.id)
        }))
        return cb(null, {
          restaurants: data,
          categories,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => cb(err))
  },
  getRestaurant: (req, cb) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: { model: User, attributes: { exclude: ['password'] } } },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikeUsers' }
      ],
      order: [[{ model: Comment }, 'created_at', 'DESC']]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        const isFavorite = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLike = restaurant.LikeUsers.some(l => l.id === req.user.id)

        return restaurant.increment('viewCounts', { by: 1 })
          .then(restaurant => restaurant.reload())
          .then(restaurant => cb(null, { restaurant: restaurant.toJSON(), isFavorite, isLike }))
      })
      .catch(err => cb(err))
  },
  getDashboard: (req, cb) => {
    return Restaurant.findByPk(req.params.id, {
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        return cb(null, { restaurant })
      })
      .catch(err => cb(err))
  },
  getFeeds: (req, cb) => {
    return Promise.all([
      Restaurant.findAll({
        include: [Category],
        order: [['createdAt', 'DESC']],
        limit: 10,
        raw: true,
        nest: true
      }),
      Comment.findAll({
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          Restaurant],
        order: [['createdAt', 'DESC']],
        limit: 10,
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        cb(null, { restaurants, comments })
      })
      .catch(err => cb(err))
  },
  getTopRestaurants: (req, cb) => {
    return Restaurant.findAll({
      include: [
        { model: User, as: 'FavoritedUsers', attributes: { exclude: ['password'] } }
      ]
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
        cb(null, { restaurants: result })
      })
      .catch(err => cb(err))
  }
}

module.exports = restaurantServices
