const Users = require('../services/userService.js');
const { apiError } = require('../routes/error.js');


module.exports = {
    getUser: async (req, res, next) => {
        try {
            const user = await Users.getUserByID(res.locals.user_id)
            if (user) {
                res.status(200).send(user)
            } else {
                res.status(404).send("User not found")
            }
        }
        catch (err) {
            next(err)
        }
    },

    newUser: async (req, res, next) => {
        try {
            const user_data = req.body
            const validated = Users.validateNewUser(user_data)
            if (validated) {
                const new_user_data = await Users.createUser(user_data)
                await Users.sendVerificationEmail(new_user_data)
                res.status(201).send("User created")
            }
        }
        catch (err) {
            next(err)
        }
    },

    validateEmail: async (req, res, next) => {
        try {
            const validation_hash = req.params.validation_hash
            await Users.validateEmail(validation_hash)
            res.status(201).send("E-mail adress confirmed")
        }
        catch (err) {
            next(err)
        }
    },

    loginUser: async (req, res, next) => {
        try {
            const login_data = req.body
            console.log(login_data.email + ' trying to log in')
            const result = await Users.checkUsernamePassword(login_data)
            if (result) {
                const token = await Users.generateJWTToken(result.user_id)
                const user = {
                    user_id: result.user_id,
                    email: result.email,
                    first_name: result.first_name,
                    avatar_url: result.avatar_url
                }
                res.status(200).send({ token: token, user: user });
            } else {
                res.status(401).send("E-mail or password doesn't match")
            }
        }
        catch (err) {
            next(err)
        }
    },
    logoutUser: async (req, res, next) => {
        try {
            const token = res.locals.decoded_token
            await Users.destroyToken(token)
            res.status(200).send('Logged out');
        }
        catch (err) {
            next(err)
        }
    },

    seeTrustedByUser: async (req, res, next) => {
        try {
            const user_id = res.locals.user_id
            const circles = 1
            const result = await Users.getTrustedUsers(user_id, circles)
            res.status(200).send(result)
        }
        catch (err) {
            next(err)
        }
    },
    seeTrustsUser: async (req, res, next) => {
        try {
            const user_id = res.locals.user_id
            const circles = 1
            const result = await Users.getTrustsUser(user_id, circles)
            res.status(200).send(result)
        }
        catch (err) {
            next(err)
        }
    },
    getUserByPhoneNumber: async (req, res, next) => {
        try {
            const phone_number = req.params.phone_number
            const result = await Users.getUserByPhoneNumber(phone_number)
            res.status(200).send(result)
        }
        catch (err) {
            next(err)
        }
    },
    getPossibleLenders: async (req, res, next) => {
        try {
            const user_id = res.locals.user_id
            const result = await Users.getPossibleLenders(user_id)
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(404).send("No results")
            }
        }
        catch (err) {
            next(err)
        }
    },
    addTrustedUsers: async (req, res, next) => {
        try {
            const user_id = res.locals.user_id
            const new_trusted_users = req.body
            const result = await Users.addTrustedUsers(user_id, new_trusted_users)
            res.status(200).send("New trust relationships created")
        }
        catch (err) {
            next(err)
        }
    },
    deleteTrustedUser: async (req, res, next) => {
        try {
            const user_id = res.locals.user_id
            const untrusted_user = req.params.untrusted_user
            console.log(untrusted_user)
            await Users.deleteTrustedUser(user_id, untrusted_user)
            res.status(200).send("User is no longer trusted")

        }
        catch (err) {
            next(err)
        }
    },
    newAvatar: async (req, res, next) => {
        const user_id = res.locals.user_id
        try {
            await Users.uploadAvatar(req.file, user_id)
            res.status(200).send("New avatar uploaded")
        } catch (err) {
            next(err)
        }
    },
    verifyPhone: async (req, res, next) => {
        const token = req.body.token
        try {
            const phone = await Users.verifyPhoneByToken(token)
            await Users.updatePhoneVerifed(phone)
            console.log("sending")
            res.status(200).send("Phone number verified")
        } catch (err) {
            next(err)
        }
    },
}