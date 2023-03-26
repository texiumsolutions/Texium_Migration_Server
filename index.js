const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const xlsx = require("xlsx");
const fs = require("fs");
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
app.use(bodyParser.json());
app.use(express.json());

const uri =
  "mongodb+srv://texium_migration:CF4SLRt0yX0mKKha@cluster.mb6jarb.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const fileSchema = new mongoose.Schema({
  File_Name: String,
  File_Type: String,
  Description: String,
  Directory_Path: String,
  Files: Array,
  Uploaded_At: Date,
});
const File = mongoose.model("File", fileSchema);


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

    // Handle the POST request to upload file details
    app.post("/upload", (req, res) => {
      // Extract the directory path from the HTTP POST request
      const directoryPath = req.body.directoryPath;
      const selectedName = req.body.selectedName;
      const fileType = req.body.selectedValue;
      const description = req.body.value;

      // Scan the files under the given directory path
      const files = fs.readdirSync(directoryPath).map((file) => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        const fileExtension = path.extname(filePath).substr(1);
        const modifiedDate = stats.mtime;
        const createdDate = stats.birthtime;
        return {
          name: file,
          size: stats.size,
          type: fileExtension,
          modifiedDate: modifiedDate,
          createdDate: createdDate,
        };
      });

      const data = {
        File_Name: selectedName,
        File_Type: fileType,
        Description: description,
        Directory_Path: directoryPath,
        Files: files,
        Uploaded_At: new Date(),
      };

      testing.insertOne(data, (err, result) => {
        if (err) throw err;
      });

      // Send the file data to the React component
      res.json({ files });
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

    // Post data
    app.post("/testing", async (request, response) => {
      const newTesting = request.body;
      const testingInfo = await testing.insertOne(newTesting);
      response.send(testingInfo);
    });

    // Get single data
    app.get("/testing/:id", async (request, response) => {
      const id = request.params.id;
      const query = { _id: id };
      const result = await testing.findOne(query);
      console.log(result);
      response.json(result);
    });

    // update single data
    app.put("/testing/:id", async (request, response) => {
      const id = request.params.id;
      const updateData = request.body;
      console.log(updateData);
      const filter = { _id: id };
      console.log(filter);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          profileName: updateData.profileName,
          Description: updateData.Description,
          normalDate: updateData.normalDate,
          Run_Number: updateData.Run_Number,
          Type: updateData.Type,
          id: updateData.id,
        },
      };
      // console.log(updateDoc);
      try {
        const result = await testing.updateMany(filter, updateDoc, options);
        console.log(
          `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
        );
        response.send(result);
      } catch (error) {
        console.error("Update failed:", error);
        response.status(500).send(error);
      }
    });

    // Delete single data
    app.delete("/testing/:id", async (request, response) => {
      const id = request.params.id;
      const query = { _id: id };
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
