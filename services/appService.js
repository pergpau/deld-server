const db = require("../db/database")

module.exports = {
    getCategories: async (parent_id) => {
        var query = 'SELECT * FROM categories WHERE 1=1'
        var categories = {}
        
        try {
            if (parent_id) {
                query += 'AND parent_id = ?'
                var result = await db.query(query, [parent_id])
            } else {
                var result = await db.query(query)
            }
            console.log(result.rows)
            categories['data'] = result.rows
            categories['map'] = result.rows.reduce((map, obj) => {
                map[obj.category_id] = obj.category_title;
                return map;
            }, {});
            console.log(categories)
            return categories

        } catch (error) {
            throw error
        }
    }
}