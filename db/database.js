const { Pool } = require('pg');
const config = require("../config/config.js");
const { apiError, SQLError } = require('../routes/error.js');

const pool = new Pool({
  host: config.db.host,
  user: config.db.user,
  port: config.db.port,
  database: config.db.name,
  password: config.db.password,
});

module.exports = {
  query: async (text, params, callback) => {
    try {
      const start = Date.now()
      const result = await pool.query(text, params, callback)
      const duration = Date.now() - start
      console.log('executed query', { text, duration, rows: result.rowCount })
      return result
    }
    catch (err) {
      console.log(err.stack)
      throw new SQLError(500, "Database error", err.message)
    }
  },
}
