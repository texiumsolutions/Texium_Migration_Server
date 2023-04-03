const express = require("express");
const router = express.Router();
const getSourceFileInfo = require("../controllers/addMySQL");
const postConnectionWithDatabase = require("../controllers/addMySQL");

router.route("/getEmployee").get(getSourceFileInfo);
router.route("/addMySQL").post(postConnectionWithDatabase);

module.exports = router;
