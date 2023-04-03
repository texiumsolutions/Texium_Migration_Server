const mysql = require("mysql");

// ~~~~~~~~~~~~~~~~
// MySQL connection
// ~~~~~~~~~~~~~~~~
const db = mysql.createConnection({
  host: "localhost",
  user: "sqluser",
  password: "password",
  database: "texium_migration",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

const postConnectionWithDatabase = (req, res) => {
  const { ipValue, userNameValue, passwordValue, databaseValue } = req.body
  console.log(ipValue);
  console.log(userNameValue);
  console.log(passwordValue);
  console.log(databaseValue);
  // res.send(inputValue);
};

const getSourceFileInfo = async (req, res) => {
  const sqlSelect = "SELECT * FROM employee;";
  db.query(sqlSelect, (err, result) => {
    res.send(result);
  });
};

module.exports = getSourceFileInfo;
module.exports = postConnectionWithDatabase;
