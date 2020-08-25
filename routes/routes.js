module.exports = app => {
  const userController = require("../controllers/userController");
  const itemController = require("../controllers/itemController");
  const appController = require("../controllers/appController");
  const { handleError } = require('./error.js')
  const { upload } = require('../routes/multer.js');

  var router = require("express").Router();

  // Item routes

  router.get("/items/:item_id", itemController.getItem);

  router.post("/items/new", itemController.newItem)

  router.post("/items/update/:item_id", itemController.updateItem)

  router.post("/items/delete/:item_id", itemController.deleteItem)

  router.get("/items/on_loan_by/user/:user_id", itemController.getLoanedItems);

  router.get("/search", itemController.searchItems);

  router.get("/items/:item_id/images", itemController.getItemImages);

  router.post("/items/:item_id/upload_images", upload.any(), itemController.newImages);

  router.post("/items/:item_id/delete_images", itemController.deleteImages)

  // User routes
  router.get("/user/id/:user_id", userController.getUser);

  router.get("/user/:user_id/trusted_by_user/", userController.seeTrustedByUser);

  router.get("/user/:user_id/trusts_user/", userController.seeTrustsUser);

  router.post("/user/:user_id/add_trusted_users/", userController.addTrustedUsers);

  router.post("/user/:user_id/delete_trusted_user/:untrusted_user", userController.deleteTrustedUser);

  router.get("/user/phone_number/:phone_number", userController.getUserByPhoneNumber);

  router.get("/user/id/:user_id/items", itemController.getUsersItems);

  router.post("/verify_phone", userController.verifyPhone)
  
  router.post("/logout", userController.logoutUser)

  router.post("/upload/avatar", upload.single('avatar'), userController.newAvatar);

  // App-level routes

  router.get("/categories", appController.getCategories);



  // Open routes

  router.post("/register", userController.newUser)

  router.post("/login", userController.loginUser)

  router.get("/verify/:validation_hash", userController.validateEmail)



  app.use('/', router);

  app.use((err, _req, res, _next) => {
    handleError(err, res);
  })
};