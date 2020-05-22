const db = require("../db/database.js")
const bcrypt = require('bcrypt');
const config = require('../config/config.js');
const { jwtr } = require('../routes/middleware.js');
const { apiError } = require('../routes/error.js');
const crypto = require("crypto");
const nodemailer = require("nodemailer");

module.exports = {
    getUserByID: async (user_id) => {
        const query = 'SELECT * FROM users WHERE user_id = $1'
        const result = await db.query(query, [user_id])
        return result.rows[0]
    },

    validateNewUser: (user_data) => {
        const username = user_data.username
        console.log(username)
        if (!username) { throw new apiError(400, 'Brukernavn mangler') }
        if (username.length < 6) { throw new apiError(400, 'Ugyldig brukernavn. Brukernavn må ha 6 tegn eller mer') }
        if (!/^[0-9a-zA-Z]+$/.test(username)) { throw new apiError(400, 'Ugyldig brukernavn. Kun bokstaver og tall er tillatt') }

        const first_name = user_data.first_name
        if (!first_name) { throw new apiError(400, 'Fornavn mangler') }

        const last_name = user_data.last_name
        if (!last_name) { throw new apiError(400, 'Etternavn mangler') }

        const email = user_data.email
        if (!email) { throw new apiError(400, 'E-post-adresse mangler') }
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) { throw new apiError(400, 'Ugyldig e-post-adresse') }

        const phone = user_data.phone
        if (!phone) { throw new apiError(400, 'Telefonnummer mangler') }
        if (!/^[0-9/+]+$/.test(phone)) { throw new apiError(400, 'Ugyldig telefonnummer. Kun tall og + er tillatt') }

        const password = user_data.password
        if (!password) { throw new apiError(400, 'Passord mangler') }
        if (password.length < 6) { throw new apiError(400, 'Ugyldig passord. Passordet må ha 6 tegn eller mer') }

        return true
    },
    createUser: async (user_data) => {

        user_data["password"] = module.exports.encryptPassword(user_data["password"])
        user_data["validation_hash"] = crypto.randomBytes(20).toString('hex')

        const user_data_array = []
        Object.values(user_data).forEach((value) => {
            user_data_array.push(value)
        })
        const query = `INSERT INTO users (username, first_name, last_name, email, phone, password_hash, validation_hash)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)`
        try {
            await db.query(query, user_data_array)
            await db.query(`UPDATE users SET avatar_url = CONCAT('https://randomuser.me/api/portraits/men/', users.user_id ,'.jpg');`)
            return user_data
        } catch (err) {
            throw err
        }
    },
    sendVerificationEmail: async (user_data) => {
        //let testAccount = await nodemailer.createTestAccount();

        
        /* let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        }); */

        let transporter = nodemailer.createTransport({
            host: "smtp-relay.sendinblue.com",
            port: 587,
            secure: false, 
            auth: {
                user: config.email.user,
                pass: config.email.password,
            },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Del-D" <admin@test.no>', // sender address
            to: user_data.email, // list of receivers
            subject: "Bekreft e-post-adresse", // Subject line
            html: "Velkommen til Del-D! <br> <a href='https://deldet-stage.netlify.app/verify/" + user_data.validation_hash + "'>Klikk her for å bekrefte e-post-adresse</a>",
        });

    },

    validateEmail: async (validation_hash) => {
        console.log(validation_hash)
        const query = `UPDATE users
                        SET validated_email = true, validation_hash = ''
                        WHERE validation_hash = $1
                        ;
                        `
        const result = await db.query(query, [validation_hash])
        console.log(result.rowCount)
        if (result.rowCount == 0) {
            throw new apiError(404, "Verification code does not match")
        }
    },

    encryptPassword: (raw_password) => {
        return bcrypt.hashSync(raw_password, 10)
    },

    checkUsernamePassword: async (login_data) => {

        const username = login_data['username']
        const password = login_data['password']
        const query = `SELECT * FROM users WHERE username = $1 AND validated_email = true`
        const result = await db.query(query, [username])

        if (result.rows.length > 0) {
            if (bcrypt.compareSync(password, result.rows[0]['password_hash'])) {
                return result.rows[0]
            } else {
                console.log("Password doesn't match.")
                return null
            }
        } else {
            console.log(`User ${username} not found or e-mail not validated.`)
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