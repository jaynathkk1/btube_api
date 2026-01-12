const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors")

const app = express();
require("dotenv").config();

const userRoute = require("./routes/user");
const videoRoute = require("./routes/video");
const commentRoute = require("./routes/comment");

mongoose
  .connect(process.env.MONGO_URL)
  .then((res) => {
    console.log("Database connected...");
  })
  .catch((err) => console.log(err));

// other middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use("/user", userRoute);
app.use("/video", videoRoute);
app.use("/comment", commentRoute);

module.exports = app;
