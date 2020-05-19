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
            if (!user_data.password) {throw new apiError(404, "Password missing")}
            await Users.createUser(user_data)
            res.status(201).send("User created")
        }
        catch (err) {
            next(err)  
        }
    },
    
    loginUser: async (req, res) => {
        try {
            console.log("trying to log in")
            const login_data = req.body
            const result = await Users.checkUsernamePassword(login_data)
            if (result) {
                const token = await Users.generateJWTToken(result.user_id)
                const user = {
                    user_id: result.user_id,
                    username: result.username,
                    first_name: result.first_name,
                    avatar_url: result.avatar_url
                }
                res.status(200).send({ token: token, user: user});
            } else {
                res.status(401).send("Username or password doesn't match")
            }
        }
        catch (e) {
            console.log(e.message)
            res.status(500).send("Server error")
        }
    },

    seeTrusted: async (req, res) => {
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
        catch (e) {
            console.log(e.message)
            res.status(500).send("Server error")
        }
    },
    getPossibleLenders: async (req, res) => {
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
        catch (e) {
            console.log(e.message)
            res.status(500).send("Server error")
        }
    },


}