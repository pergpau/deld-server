const multer = require('multer');

var storage = multer.memoryStorage()

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
    }
})

module.exports = {
    upload: upload
}
