const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://texium_solution_migration:6Q2XCyWLPAmYkwfF@cluster.mb6jarb.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
client.connect((err) => {
  const collection = client.db("test").collection("devices");
  console.log("shohan ami asi to!");
  // perform actions on the collection object
  client.close();
});

app.get("/", (request, response) => {
  response.send("Running All The Time");
});

app.listen(port, () => {
  console.log("I'm Walking!");
});
