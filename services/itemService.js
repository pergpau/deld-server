const db = require("../db/database")
const { storage } = require('../db/storage.js')
const format = require('pg-format');

// Spørring for images som array
/* CASE 
WHEN i.item_id IN (SELECT item_id FROM images) THEN 
        (SELECT array_agg(image_id) FROM images AS img
        WHERE i.item_id = img.item_id)
ELSE array[]::int[]
END AS images, */

module.exports = {

    getAllUserItems: async (user_id) => {

        const query = `SELECT i.item_id, i.item_type, i.owner, i.category_id, i.title, 
                        i.description, u.first_name AS loaned_to_name, l.last_loaned_date,
                        i.author, i.rating, i.created_on, 
                        CASE 
                            WHEN l.loaned_to IS NULL THEN false
                            WHEN l.loaned_to IS NOT NULL THEN true
                        END AS on_loan
                        FROM items AS i
                        LEFT OUTER JOIN loans AS l ON i.item_id = l.item_id
                        LEFT OUTER JOIN users AS u ON l.loaned_to = u.user_id
                        WHERE owner = $1`
        const results = await db.query(query, [user_id])

        return results.rows
    },

    getLoanedItems: async (user_id) => {
        const query = `SELECT i.item_id, i.item_type, i.owner, i.category_id, i.title, 
                        i.description, l.last_loaned_date, 
                        l.loaned_to, u.first_name AS loaned_from_name, i.created_on,
                        u.first_name, u.avatar_url AS owner_avatar_url,
                        CASE 
                            WHEN l.loaned_to IS NULL THEN false
                            WHEN l.loaned_to IS NOT NULL THEN true
                        END AS on_loan
                        FROM items AS i
                        INNER JOIN loans AS l ON i.item_id = l.item_id
                        INNER JOIN users AS u ON i.owner = u.user_id
                        WHERE l.loaned_to = $1`
        try {
            const result = await db.query(query, [user_id])
            return result.rows
        } catch (err) {
            throw err
        }
    },

    getItemByID: async (item_id) => {
        const query = 'SELECT * FROM items WHERE item_id = $1'
        const result = await db.query(query, [item_id])
        return result.rows[0]
    },
    newItem: async (item_data) => {
        const item_type = item_data.item_type
        const owner = item_data.user_id
        const category_id = item_data.category_id
        const title = item_data.title
        const description = item_data.description
        const author = item_data.author
        const rating = item_data.rating

        const query = `INSERT INTO items (item_type, owner, category_id, title, description, author, rating)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING *
                        ;
                        `
        const result = await db.query(query, [item_type, owner, category_id, title, description, author, rating])
        return result.rows[0]
    },

    updateItem: async (item_data) => {
        const item_id = item_data.item_id
        const item_type = item_data.item_type
        const owner = item_data.user_id
        const category_id = item_data.category_id
        const title = item_data.title
        const description = item_data.description
        const author = item_data.author
        const rating = item_data.rating

        const query = `UPDATE items
                        SET item_type = $1, category_id = $2, title = $3, description = $4, author = $5, rating = $6
                        WHERE item_id = $7 AND owner = $8 
                        ;
                        `
        const result = await db.query(query, [item_type, category_id, title, description, author, rating, item_id, owner])
        return result.rows[0]
    },
    deleteItem: async (item_data) => {
        const item_id = item_data.item_id
        const owner = item_data.user_id

        const query = `DELETE FROM items
                        WHERE item_id = $1 AND owner = $2 
                        ;
                        `
        const result = await db.query(query, [item_id, owner])
        return result.rows[0]
    },


    searchItems: async (searchstring, trustees) => {
        const query = `SELECT i.item_id, i.item_type, i.owner, i.category_id, i.title,
                        i.description, u.first_name,
                        CASE 
                            WHEN l.loaned_to IS NULL THEN false
                            WHEN l.loaned_to IS NOT NULL THEN true
                        END AS on_loan
                        FROM items AS i
                        LEFT OUTER JOIN loans AS l ON i.item_id = l.item_id
                        INNER JOIN users AS u ON i.owner = u.user_id
                        WHERE i.owner = ANY($1::int[]) AND (lower(i.title)
                        LIKE '%' || $2 || '%' OR lower(i.description) LIKE '%' || $2 || '%')
                        ORDER BY
                        CASE
                            WHEN lower(i.title) LIKE $2 THEN 1
                            WHEN lower(i.title) LIKE $2 || '%' THEN 2
                            WHEN lower(i.title) LIKE '%' || $2 THEN 3
                            WHEN lower(i.description) LIKE $2 THEN 4
                            WHEN lower(i.description) LIKE $2 || '%' THEN 5
                            WHEN lower(i.description) LIKE '%' || $2  THEN 6
                            ELSE 7
                        END;`
        //const result = await db.query(query, [1,searchstring])
        try {
            const result = await db.query(query, [trustees, searchstring.toLowerCase()])
            return result.rows
        } catch (err) {
            throw err
        }
    },
    getImages: async (item_id) => {
        const query = `SELECT array_agg(image_id) 
                        FROM images AS img
                        WHERE img.item_id = $1`
        //const result = await db.query(query, [1,searchstring])
        try {
            const result = await db.query(query, [item_id])
            return result.rows[0]['array_agg'] || []
        } catch (err) {
            throw err
        }
    },
    insertImages: async (item_ids) => {
        console.log(item_ids)
        const query = format(`WITH ids AS (INSERT INTO images (item_id) VALUES %L 
                        RETURNING image_id) SELECT array_agg(image_id) FROM ids`, item_ids)
        console.log(query)
        try {
            const result = await db.query(query)
            return result.rows[0]['array_agg']
        } catch (err) {
            throw err
        }

    },
    uploadImages: async (files, item_id, image_ids) => {
        console.log(files)
        const bucket = storage.bucket('del-d-items')
        try {
            for (let i = 0; i < files.length; i++) {
                let blob = bucket.file('item/' + item_id + '/' + image_ids[i]);
                let blobStream = blob.createWriteStream({
                    metadata: {
                        contentType: files[i].mimetype
                    }
                });
                blobStream.on("error", err => {
                    console.log(err)
                });
                blobStream.on("finish", () => {
                    console.log("success")
                });
                blobStream.end(files[i].buffer);
            }
        } catch (err) {
            throw err
        }
    },
    deleteImagesFromDB: async (image_ids) => {

        const query = format(`DELETE FROM images
                        WHERE image_id IN (%L)
                        RETURNING image_id`, image_ids)
        try {
            const deleted_image_ids = await db.query(query)
            return deleted_image_ids.rows
        } catch (err) {
            throw err
        }

    },
    deleteImagesFromBucket: async (item_id, image_ids) => {
        console.log(image_ids)
        const bucket = storage.bucket('del-d-items')
        try {
            for (image_id of image_ids) {
                await bucket.deleteFiles({ prefix: 'item/' + item_id + '/' + image_id });
                console.log("Bucket image " + image_id + ' deleted.')
            }
        } catch (err) {
            throw err
        }

    },



}