const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const config = require("./config/config.js");
const fs = require('fs');
const sqlscript = fs.readFileSync("./sqlscript.sql").toString()
const db = require("./db/database.js")

const { authenticator } = require('./routes/middleware.js');

const app = express();

/* var corsOptions = {
  origin: "http://f365fc81.ngrok.io/"
};
 */
//app.use(cors(corsOptions));
app.use(cors());
//  app.options(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(authenticator)

db.query(sqlscript)

require("./routes/routes.js")(app);

app.get('/', (req, res) => {
  res.send("Her blir det liv, rairai");
});

const port = config.app.port;
app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});