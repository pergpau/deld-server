const Items = require('../services/itemService');
const Users = require('../services/userService');
const { apiError } = require('../routes/error.js');

module.exports = {
    getUsersItems: async (req, res, next) => {
        try {
            const items = await Items.getAllUserItems(res.locals.user_id)
            if (items) {
                res.status(200).send(items)
            } else {
                res.status(404).send("No items found")
            }
        }
        catch (err) {
            next(err)
        }
    },

    getItem: async (req, res, next) => {
        try {
            const item_id = req.params.item_id
            const item = await Items.getItemByID(item_id)
            if (item) {
                res.status(200).send(item)
            } else {
                res.status(404).send(`No item with ID ${item_id} found.`)
            }
        }
        catch (err) {
            next(err)
        }
    },
    newItem: async (req, res, next) => {
        try {
            const item_data = req.body
            item_data['user_id'] = res.locals.user_id
            new_item = await Items.newItem(item_data)
            res.status(200).send(new_item)
        }
        catch (err) {
            next(err)
        }
    },
    updateItem: async (req, res, next) => {
        try {
            const item_data = req.body
            item_data['user_id'] = res.locals.user_id
            console.log(item_data.user_id, item_data.owner)
            if (item_data.user_id != item_data.owner) {
                throw new apiError(401, 'User ID and owner ID does not match')
            }
            await Items.updateItem(item_data)
            res.status(200).send("Element added")
        }
        catch (err) {
            next(err)
        }
    },
    deleteItem: async (req, res, next) => {
        try {
            const item_data = req.body
            item_data['user_id'] = res.locals.user_id
            console.log(item_data.user_id, item_data.owner)
            if (item_data.user_id != item_data.owner) {
                throw new apiError(401, 'User ID and owner ID does not match')
            }
            await Items.deleteItem(item_data)
            res.status(200).send("Item deleted")
        }
        catch (err) {
            next(err)
        }
    },

    getLoanedItems: async (req, res, next) => {
        try {
            const items = await Items.getLoanedItems(res.locals.user_id)
            if (items) {
                res.status(200).send(items)
            } else {
                res.status(404).send(`No items currently on loan`)
            }
        }
        catch (err) {
            next(err)
        }
    },

    searchItems: async (req, res, next) => {
        try {
            const searchstring = req.query.q ? req.query.q : ''
            const user_id = res.locals.user_id
            const trustees = await Users.getPossibleLenders(user_id)
            const results = await Items.searchItems(searchstring, trustees)
            if (results) {
                res.status(200).send(results)
            } else {
                res.status(404).send(`No items matching ${searchstring} found.`)
            }
        }
        catch (err) {
            next(err)
        }
    },
    getItemImages: async (req, res, next) => {
        try {
            const item_id = req.params.item_id
            const images = await Items.getImages(item_id)
            console.log(images)
            res.status(200).send(images)
        }
        catch (err) {
            next(err)
        }
    },
    newImages: async (req, res, next) => {
        const user_id = res.locals.user_id
        const item_id = parseInt(req.params.item_id)
        const item_id_array = Array(req.files.length).fill([item_id])
        try {
            const item = await Items.getItemByID(item_id)
            if (item.owner != user_id) {
                throw new apiError(401, 'User ID and owner ID does not match')
            }
            const image_ids = await Items.insertImages(item_id_array)
            await Items.uploadImages(req.files, item_id, image_ids)
            res.status(200).send("New image(s) uploaded")
        } catch (err) {
            next(err)
        }
    },
    deleteImages: async (req, res, next) => {
        const user_id = res.locals.user_id
        const item_id = parseInt(req.params.item_id)
        const image_ids = req.body
        try {
            const item = await Items.getItemByID(item_id)
            if (item.owner != user_id) {
                throw new apiError(401, 'User ID and owner ID does not match')
            }
            const deleted_image_ids = await Items.deleteImagesFromDB(image_ids.map(image_id => [image_id]))
            await Items.deleteImagesFromBucket(item_id, image_ids)
            res.status(200).send({message: "Image(s) deleted", ids: deleted_image_ids})
        } catch (err) {
            next(err)
        }
    },
}