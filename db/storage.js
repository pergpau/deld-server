const Cloud = require('@google-cloud/storage')
const config = require('../config/config.js')

const { Storage } = Cloud
const storage = new Storage({
    keyFilename: config.google.service_key,
    projectId: 'del-d-280811'
})

module.exports = {
    storage: storage,
}