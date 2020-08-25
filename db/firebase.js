const admin = require("firebase-admin");
const config = require('../config/config.js')

const serviceAccount = config.google.firebase_service_key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://del-d-280811.firebaseio.com"
});

module.exports = {
    firebase: admin,
}