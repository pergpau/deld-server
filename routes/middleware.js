const config = require("../config/config")
const redis = require('../db/redis.js');
const JWTR = require('jwt-redis').default;
const jwtr = new JWTR(redis);

async function verifyToken (token) {
  if (token != null && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length).trimLeft();
  }
  if (token) {
    try {
      const decoded = await jwtr.verify(token, config.jwt.secret)
      return decoded
    } catch {
      return null
    }
  }
};

async function authenticator (req, res, next) {
  if (req.url == '/login' || req.url == '/register') {
    next()
  } else {
    const decoded = await verifyToken(req.get('Authorization'))
    if (decoded) {
      res.locals.user_id = decoded.user_id;
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
