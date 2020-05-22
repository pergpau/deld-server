const App = require('../services/appService');

module.exports = {
    getCategories: async (req, res, next) => {
        const parent_id = item_id = req.params.item_id
        try {
            const category_map = await App.getCategories(parent_id)
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