const db = require("../db/database")

module.exports = {
    getCategories: async () => {
        const query = 'SELECT * FROM categories'
        try {
            const result = await db.query(query)
            console.log(result.rows)
            const category_map = result.rows.reduce((map, obj) => {
                map[obj.category_id] = obj.category_title;
                return map;
            }, {});
            console.log(category_map)
            return category_map

        } catch (error) {
            throw error
        }
    }
}