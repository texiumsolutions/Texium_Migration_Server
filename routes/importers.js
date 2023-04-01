const express = require("express");
const router = express.Router();
const getSourceFileInfo = require("../controllers/importers");

router.route("/").get(getSourceFileInfo);

module.exports = router;
