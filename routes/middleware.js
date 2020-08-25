const config = require("../config/config")
const redis = require('../db/redis.js');
const JWTR = require('jwt-redis').default;
const jwtr = new JWTR(redis);

async function verifyToken (token) {
  if (token) {
    try {
      const decoded = await jwtr.verify(token, config.jwt.secret)
      return decoded
    } catch {
      return null
    }
  }
};

const open_urls = ['/login', '/register', '/send_validation_sms', '/verify_phone']

async function authenticator (req, res, next) {
  if (open_urls.includes(req.url) || req.url.startsWith('/verify/')) {
    next()
  } else {
    const decoded = await verifyToken(req.get('Authorization'))
    if (decoded) {
      res.locals.user_id = decoded.user_id
      res.locals.decoded_token = decoded
      next()
    } else {
      res.status(401).send("Token authentication failed")
    }
  }
}

module.exports = {
  verifyToken: verifyToken,
  authenticator: authenticator,
  jwtr: jwtr
}
