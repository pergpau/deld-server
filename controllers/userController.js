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
            console.log(login_data.username + ' trying to log in')
            const result = await Users.checkUsernamePassword(login_data)
            if (result) {
                const token = await Users.generateJWTToken(result.user_id)
                const user = {
                    user_id: result.user_id,
                    username: result.username,
                    first_name: result.first_name,
                    avatar_url: result.avatar_url
                }
                res.status(200).send({ token: token, user: user });
            } else {
                res.status(401).send("Username or password doesn't match")
            }
        }
        catch (err) {
            next(err)
        }
    },

    seeTrusted: async (req, res, next) => {
        try {
            const user_id = 1
            //const circles = 1
            const result = await Users.getTrustedUsers(user_id)
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(401).send("No people in your trust circles")
            }
        }
        catch (err) {
            next(err)
        }
    },
    getPossibleLenders: async (req, res, next) => {
        try {
            const user_id = res.locals.user_id
            console.log(user_id)
            const result = await Users.getPossibleLenders(user_id)
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(401).send("No results")
            }
        }
        catch (err) {
            next(err)
        }
    },


}