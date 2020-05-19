const App = require('../services/appService');

module.exports = {
    getCategories: async (req, res, next) => {
        try {
            const category_map = await App.getCategories(res.locals.user_id)
            if (category_map) {
                res.status(200).send(category_map)
            } else {
                res.status(404).send("No categories found")
            }
        }
        catch (err) {
            next(err)
        }
    }
}