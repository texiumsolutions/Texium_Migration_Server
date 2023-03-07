const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const { response } = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://texium_migration:CF4SLRt0yX0mKKha@cluster.mb6jarb.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const database = client.db("Texium_Migration");
    const users = database.collection("user");
    const fileCollection = database.collection("sourceFileInfo");

    app.get("/sourceFileInfo", async (request, response) => {
      const query = { "Full Name": "Kai Le" };
      const cursor = fileCollection.find(query);
      const fileInfo = await cursor.toArray();
      response.send(fileInfo);
    });

    console.log("Connected Before You Asked!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (request, response) => {
  response.send("Running All The Time");
});

app.listen(port, () => {
  console.log(`I'm Walking in ${port} number street!`);
});
