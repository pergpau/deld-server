const db = require("../db/database.js")
const bcrypt = require('bcrypt');
const config = require('../config/config.js');
const { jwtr } = require('../routes/middleware.js');
const { apiError } = require('../routes/error.js');

module.exports = {
    getUserByID: async (user_id) => {
        const query = 'SELECT * FROM users WHERE user_id = $1'
        const result = await db.query(query, [user_id])
        return result.rows[0]
    },

    createUser: async (user_data) => {
        
        user_data["password"] = module.exports.encryptPassword(user_data["password"])
        const user_data_array = []
        Object.values(user_data).forEach((value) => {
            user_data_array.push(value)
        })
        const query = `INSERT INTO users (username, first_name, last_name, email, phone, password_hash)
                        VALUES ($1, $2, $3, $4, $5, $6)`
        try {
            await db.query(query, user_data_array)
            await db.query(`UPDATE users SET avatar_url = CONCAT('https://randomuser.me/api/portraits/men/', users.user_id ,'.jpg');`)
        } catch (err) {
            throw err
        }
    },

    encryptPassword: (raw_password) => {
        return bcrypt.hashSync(raw_password, 10)
    },

    checkUsernamePassword: async (login_data) => {

        const username = login_data['username']
        const password = login_data['password']
        const query = `SELECT * FROM users WHERE username = $1`
        const result = await db.query(query, [username])

        if (result.rows.length > 0) {
            if (bcrypt.compareSync(password, result.rows[0]['password_hash'])) {
                return result.rows[0]
            } else {
                console.log("Password doesn't match.")
                return null
            }
        } else {
            console.log(`User ${username} not found.`)
            return null
        }
    },

    generateJWTToken: async (user_id) => {
        const payload = {
            user_id: user_id
        }
        const token = jwtr.sign(payload, config.jwt.secret, { expiresIn: '365d' })
        return token
    },

    getTrustedUsers: async (user_id) => {

        const query = `WITH trustees AS 
                        (SELECT t1.trusted_id
                        FROM trust as t1
                        WHERE t1.truster_id = $1
                        UNION
                        SELECT t2.trusted_id
                        FROM trust AS t1
                        INNER JOIN trust AS t2 ON t1.trusted_id = t2.truster_id
                        WHERE t1.truster_id = 1)
                        SELECT * FROM users AS u
                        INNER JOIN trustees ON trustees.trusted_id = u.user_id
                        ;`
        const result = await db.query(query, [user_id])

        if (result.rows.length > 0) {
            return result.rows
        } else {
            console.log("No results.")
            return null
        }
    },
    getPossibleLenders: async (user_id) => {

        const query = `WITH circle1 AS (
                        SELECT t1.truster_id AS circle1_ids
                        FROM trust AS t1
                        WHERE t1.trusted_id = $1),
                        
                        circle2 AS (
                        SELECT t2.truster_id AS circle2_ids
                        FROM trust AS t2
                        WHERE t2.trusted_id IN (SELECT circle1_ids FROM circle1)),
                        
                        circle3 AS (
                        SELECT t3.truster_id AS circle3_ids
                        FROM trust AS t3
                        WHERE t3.trusted_id IN (SELECT circle2_ids FROM circle2))
                        
                        SELECT array_agg(user_id)
                        FROM (
                        SELECT u.user_id
                        FROM users AS u
                        WHERE u.circles >= 1 AND u.user_id IN (SELECT * FROM circle1)
                        UNION
                        SELECT u.user_id
                        FROM users AS u
                        WHERE u.circles >= 2 AND u.user_id IN (SELECT * FROM circle2)
                        UNION
                        SELECT u.user_id
                        FROM users AS u
                        WHERE u.circles >= 3 AND u.user_id IN (SELECT * FROM circle3)
                        ) AS ids`

        let result = await db.query(query, [user_id])
        result = result.rows[0]['array_agg']
        result = result.filter(val => val !== user_id)

        if (result.length > 0) {
            return result
        } else {
            console.log("No results.")
            return null
        }
    }
}