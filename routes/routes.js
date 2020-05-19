module.exports = app => {
  const userController = require("../controllers/userController");
  const itemController = require("../controllers/itemController");
  const appController = require("../controllers/appController");
  const { handleError } = require('./error.js')

  var router = require("express").Router();

  router.get("/user/id/:user_id", userController.getUser);

  router.get("/user/trusted/", userController.seeTrusted);

  router.post("/register", userController.newUser)

  router.post("/login", userController.loginUser)

  router.get("/user/id/:user_id/items", itemController.getUsersItems);

  router.get("/items/:item_id", itemController.getItem);

  router.post("/items/new", itemController.newItem)

  router.post("/items/update/:item_id", itemController.updateItem)

  router.post("/items/delete/:item_id", itemController.deleteItem)

  router.get("/items/on_loan_by/user/:user_id", itemController.getLoanedItems);

  router.get("/search", itemController.searchItems);

  router.get("/categories", appController.getCategories);

  app.use('/', router);

  app.use((err, _req, res, _next) => {
    handleError(err, res);
  })
};