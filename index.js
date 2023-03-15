const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const xlsx = require("xlsx");
const app = express();
const port = process.env.PORT || 5000;

const upload = multer({
  dest: "./uploads/",
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".xlsx", ".csv"];
    const ext = path.extname(file.originalname);
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only Excel files with the .xlsx & .csv extension are allowed!"
        )
      );
    }
  },
});

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
    const users = database.collection("users");
    const fileCollection = database.collection("sourceFileInfo");
    const testing = database.collection("testing");

    app.use("/static", express.static("uploads"));

    // File Upload
    app.post("/uploadFile", upload.single("avater"), (request, response) => {
      let newFileName = Date.now() + ".csv";

      fs.rename(
        `./uploads/${request.file.filename}`,
        `./uploads/${newFileName}`,
        function () {
          // Read the Excel file and convert it to CSV format
          const workbook = xlsx.readFile(`./uploads/${newFileName}`);
          const sheetName = workbook.SheetNames[0];
          const csv = xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]);

          // Write the CSV data to a new file
          const csvFileName = newFileName.replace(".xlsx", ".csv");
          fs.writeFile(`./uploads/${csvFileName}`, csv, (err) => {
            if (err) {
              console.log(err);
              response.status(500).json({
                success: false,
                message: "Unable to convert the file.",
              });
            } else {
              // Read the CSV data and add it to the database
              fs.readFile(`./uploads/${csvFileName}`, (err, data) => {
                if (err) {
                  console.log(err);
                  response.status(500).json({
                    success: false,
                    message: "Unable to read the file.",
                  });
                } else {
                  const fileId = new Date().getTime().toString();

                  const fileData = {
                    _id: fileId,
                    fileName: request.file.originalname,
                    newFileName: csvFileName,
                    filePath: `./uploads/${csvFileName}`,
                    createdAt: new Date(),
                    data: xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]),
                  };
                  // Add the file information and data to the database
                  fileCollection.insertOne(fileData, function (err, res) {
                    if (err) {
                      console.log(err);
                      response.status(500).json({
                        success: false,
                        message: "Unable to add file to the database.",
                      });
                    } else {
                      response.status(200).json({
                        success: true,
                        message: "File uploaded successfully!",
                      });
                    }
                  });
                }
              });
            }
          });
        }
      );
    });

    // Get all the data of files
    app.get("/sourceFileInfo", async (request, response) => {
      const query = {};
      const cursor = fileCollection.find(query);
      const fileInfo = await cursor.toArray();
      response.send(fileInfo);
    });

    // Get all the data of users
    app.get("/users", async (request, response) => {
      const query = {};
      const cursor = users.find(query);
      const userInfo = await cursor.toArray();
      response.send(userInfo);
    });

    // Get all the data of testing
    app.get("/testing", async (request, response) => {
      const query = {};
      const cursor = testing.find(query);
      const testingInfo = await cursor.toArray();
      response.send(testingInfo);
    });

    app.delete("/testing/:id", async (request, response) => {
      const id = request.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await testing.deleteOne(query);
      console.log(result);
      response.send(result);
    });

    console.log("Connected Before You Asked!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// Default Error
app.use((err, req, res, next) => {
  if (err) {
    res.status(500).send(err.message);
  } else {
    res.send("Uploaded Successfully!");
  }
});

app.get("/", (request, response) => {
  response.send("Running All The Time");
});

app.listen(port, () => {
  console.log(`I'm Walking in ${port} number street!`);
});
