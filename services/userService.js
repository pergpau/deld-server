const db = require("../db/database.js")
const bcrypt = require('bcrypt');
const config = require('../config/config.js');
const { jwtr } = require('../routes/middleware.js');
const { apiError } = require('../routes/error.js');
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const format = require('pg-format');
const { firebase } = require('../db/firebase.js')
const { storage } = require('../db/storage.js')


module.exports = {
    getUserByID: async (user_id) => {
        const query = 'SELECT * FROM users WHERE user_id = $1'
        const result = await db.query(query, [user_id])
        return result.rows[0]
    },

    validateNewUser: (user_data) => {
        /* const username = user_data.username
        console.log(username)
        if (!username) { throw new apiError(400, 'Brukernavn mangler') }
        if (username.length < 6) { throw new apiError(400, 'Ugyldig brukernavn. Brukernavn må ha 6 tegn eller mer') }
        if (!/^[0-9a-zA-Z]+$/.test(username)) { throw new apiError(400, 'Ugyldig brukernavn. Kun bokstaver og tall er tillatt') } */
        const email = user_data.email
        if (!email) { throw new apiError(400, 'E-post-adresse mangler') }
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) { throw new apiError(400, 'Ugyldig e-post-adresse') }

        const first_name = user_data.first_name
        if (!first_name) { throw new apiError(400, 'Fornavn mangler') }

        const last_name = user_data.last_name
        if (!last_name) { throw new apiError(400, 'Etternavn mangler') }

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
        const query = `INSERT INTO users (email, first_name, last_name, phone, password_hash, validation_hash)
                        VALUES ($1, $2, $3, $4, $5, $6)`
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
            host: "smtp.eu.mailgun.org",
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
            html: "Velkommen til Del-D! <br> <a href='https://del-d.no/verify/" + user_data.validation_hash + "'>Klikk her for å bekrefte e-post-adresse</a>",
        });

        console.log("Message sent: %s", info.messageId);

        /* const mg = new Mailgun({
            apiKey: config.email.apikey,
            domain: 'sandbox36e58a2a2f9f4506bc338fc3fecb8edc.mailgun.org',
            host: 'api.mailgun.net'
        })
        console.log(mg) */

        /* var mailgun = require('mailgun-js')
        var mg = mailgun.client({ username: 'api', key: config.email.apikey, url: 'https://api.eu.mailgun.net' });
        mg.messages.create('mail.del-d.no', {
            from: "Excited User <admin@mail.del-d.no>",
            to: user_data.email,
            subject: "Hello",
            html: "<html>Hi world/html>",
            "o:tag": 'tag me dood',
        })

            .then(msg => console.log(msg)) // logs response data
            .catch(err => console.log(err)); // logs any error */
        /* const email = {
            from: 'admin@del-d.no',
            to: user_data.email,
            subject: 'Bekreft e-post-adresse',
            html: "Velkommen til Del-D! <br> <a href='https://del-d.no/verify/" +
                user_data.validation_hash + "'>Klikk her for å bekrefte e-post-adresse</a>"
        }
        try {
            await mg.messages().send(email)
        } catch (error) {
            console.log(error)
        } */

    },

    validateEmail: async (validation_hash) => {
        console.log(validation_hash)
        const query = `UPDATE users
                        SET validated_email = true, validation_hash = ''
                        WHERE validation_hash = $1
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

        const email = login_data['email']
        const password = login_data['password']
        const query = `SELECT * FROM users 
                        WHERE email = $1 AND validated_email = true AND validated_phone = true`
        try {
            const result = await db.query(query, [email])
            if (result.rows.length > 0) {
                if (bcrypt.compareSync(password, result.rows[0]['password_hash'])) {
                    return result.rows[0]
                } else {
                    console.log("Password doesn't match.")
                    return null
                }
            } else {
                console.log(`User ${email} not found or e-mail not validated.`)
                return null
            }
        } catch (err) {
            throw err
        }
    },

    generateJWTToken: async (user_id) => {
        const payload = {
            user_id: user_id
        }
        const token = jwtr.sign(payload, config.jwt.secret, { expiresIn: '30d' })
        return token
    },

    destroyToken: async (token) => {
        try {
            await jwtr.destroy(token.jti)
        } catch (err) {
            throw err
        }
    },
    /* getTrustedUsers: async (user_id, circles) => {

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
        let query = `WITH trusted_users AS 
                        (SELECT t1.trusted_id
                        FROM trust as t1
                        WHERE t1.truster_id = $1)`

        if (circles == 2) {
            query += `UNION
            SELECT t2.trusted_id
            FROM trust AS t1
            INNER JOIN trust AS t2 ON t1.trusted_id = t2.truster_id
            WHERE t1.truster_id = 1)`
        }
        query += `SELECT user_id, first_name, last_name, avatar_url FROM users AS u
        INNER JOIN trusted_users ON trusted_users.trusted_id = u.user_id
        `

        try {
            const result = await db.query(query, [user_id])
            return result.rows

        } catch (err) {
            throw err
        }
    }, */

    getTrustedUsers: async (user_id, circles) => {

        const query = `WITH circle1 AS (
            SELECT t1.trusted_id AS user_id, 1 AS circle
            FROM trust AS t1
            WHERE t1.truster_id = $1),
            
            circle2 AS (
            SELECT t2.trusted_id AS user_id, 2 AS circle
            FROM trust AS t2
            WHERE t2.truster_id IN (SELECT user_id FROM circle1)
            AND t2.trusted_id NOT IN (SELECT user_id FROM circle1)
            ),
            
            circle3 AS (
            SELECT t3.trusted_id AS user_id, 3 AS circle
            FROM trust AS t3
            WHERE t3.truster_id IN (SELECT user_id FROM circle2)
            AND t3.trusted_id NOT IN (SELECT user_id FROM circle2 UNION SELECT user_id FROM circle1)
            )

            SELECT u.user_id, first_name, last_name, avatar_url, a.circle 
            FROM users AS u
            INNER JOIN 
            (
                SELECT user_id, circle
                FROM circle1
                UNION
                SELECT user_id, circle
                FROM circle2
                UNION
                SELECT user_id, circle
                FROM circle3
            ) AS a ON u.user_id = a.user_id
            WHERE u.user_id != $1
            ORDER BY first_name ASC`

        try {
            const result = await db.query(query, [user_id])
            const filtered_result = module.exports.filterUnique(result.rows, 'user_id')
            return filtered_result

        } catch (err) {
            throw err
        }
    },

    getTrustsUser: async (user_id) => {

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
            WHERE t3.trusted_id IN (SELECT circle2_ids FROM circle2)),
            
            all_users AS (
            SELECT user_id, circle
            FROM (
            SELECT u.user_id, 1 AS circle
            FROM users AS u
            WHERE u.circles >= 1 AND u.user_id IN (SELECT circle1_ids FROM circle1)
            UNION
            SELECT u.user_id, 2 AS circle
            FROM users AS u
            WHERE u.circles >= 2 AND u.user_id IN (SELECT circle2_ids FROM circle2)
            UNION
            SELECT u.user_id, 3 AS circle
            FROM users AS u
            WHERE u.circles >= 3 AND u.user_id IN (SELECT circle3_ids FROM circle3)
            ) AS subquery)
            SELECT u.user_id, first_name, last_name, avatar_url, a.circle 
            FROM users AS u
            INNER JOIN all_users AS a ON a.user_id = u.user_id`

        try {
            const result = await db.query(query, [user_id])
            const filtered_result = module.exports.filterUnique(result.rows, 'user_id')
            return filtered_result
        } catch (err) {
            throw err
        }
    },
    getUserByPhoneNumber: async (phone_number) => {
        console.log(phone_number)
        let query = `SELECT user_id, first_name, last_name, avatar_url
                        FROM users AS u
                        WHERE phone = $1`

        try {
            const result = await db.query(query, [phone_number])
            return result.rows
        } catch (err) {
            throw err
        }
    },
    getPossibleLenders: async (user_id) => {

        try {
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
                WHERE u.circles >= 1 AND u.user_id IN (SELECT circle1_ids FROM circle1)
                UNION
                SELECT u.user_id
                FROM users AS u
                WHERE u.circles >= 2 AND u.user_id IN (SELECT circle2_ids FROM circle2)
                UNION
                SELECT u.user_id
                FROM users AS u
                WHERE u.circles >= 3 AND u.user_id IN (SELECT circle3_ids FROM circle3)
                ) AS ids`

            let result = await db.query(query, [user_id])
            result = result.rows[0]['array_agg']
            if (result) {
                result = result.filter(val => val !== user_id)
                if (result.length > 0) {
                    return result
                }
            } else {
                console.log("No results.")
                return null
            }

        } catch (err) {
            throw err
        }
    },
    addTrustedUsers: async (user_id, new_trusted_users) => {
        const array = new_trusted_users.map(trusted_id => [user_id, trusted_id])
        const query = format(`INSERT INTO trust (truster_id, trusted_id)
                        VALUES %L`, array)
        console.log(query)
        try {
            const result = await db.query(query)
            return result.rows
        } catch (err) {
            throw err
        }
    },
    deleteTrustedUser: async (user_id, untrusted_user) => {

        const query = `DELETE FROM trust
                        WHERE truster_id = $1 AND trusted_id = $2`
        try {
            await db.query(query, [user_id, untrusted_user])
        } catch (err) {
            throw err
        }
    },
    filterUnique (array, property) {
        const unique = array.map(element => element[property])
            .map((element, index, final) => final.indexOf(element) === index && index)
            .filter((element) => array[element]).map(element => array[element]);

        return unique;
    },
    uploadAvatar: async (file, user_id) => {
        console.log(file)
        const bucket = storage.bucket('del-d-avatars')
        const blob = bucket.file('users/' + user_id + '/avatar');
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype
            }
        });
        blobStream.on("error", err => {
            throw err
        });
        blobStream.on("finish", () => {
            console.log("success")
        });
        blobStream.end(file.buffer);
    },
    verifyPhoneByToken: async (token) => {
        try {
            const decoded_token = await firebase.auth().verifyIdToken(token)
            return decoded_token.phone_number
        } catch (err) {
            throw err
        }
    },
    updatePhoneVerifed: async (phone) => {
        try {
            const query = `UPDATE users SET validated_phone = true
            WHERE phone = $1`
            await db.query(query, [phone])
        } catch (err) {
            throw err
        }
    },
}