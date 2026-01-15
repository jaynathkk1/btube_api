const express = require("express");
const mongoose = require("mongoose");
const Router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const jwt = require("jsonwebtoken");
const checkAuth = require("../middleware/checkAuth");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

Router.post("/singup", async (req, res) => {
  try {
    const users = await User.find({ email: req.body.email });
    if (users.length > 0) {
      return res.status(500).json({
        error: "Email Already registered",
      });
    }
    const hashCode = await bcrypt.hash(req.body.password, 10);
    const uploadImage = await cloudinary.uploader.upload(
      req.files.logo.tempFilePath
    );

    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      channelName: req.body.channelName,
      email: req.body.email,
      phone: req.body.phone,
      password: hashCode,
      logoUrl: uploadImage.secure_url,
      logoId: uploadImage.public_id,
    });
    const user = await newUser.save();
    res.status(200).json({
      newUser: user,
    });
    console.log(hashCode, uploadImage);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

Router.post("/login", async (req, res) => {
  const user = await User.find({ email: req.body.email });
  try {
    if (user.length == 0) {
      return res.status(500).json({
        error: "Email is not  registered...",
      });
    }

    const isvalid = await bcrypt.compare(req.body.password, user[0].password);
    if (!isvalid) {
      return res.status(500).json({
        error: "Password is Invalid ",
      });
    }

    const token = await jwt.sign(
      {
        _id: user[0]._id,
        channelName: user[0].channelName,
        email: user[0].email,
        phone: user[0].phone,
        logoId: user[0].logoId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "365d",
      }
    );
    res.status(200).json({
      _id: user[0]._id,
      channelName: user[0].channelName,
      email: user[0].email,
      phone: user[0].phone,
      logoId: user[0].logoId,
      logoUrl: user[0].logoUrl,
      token: token,
      subscribe: user[0].subscribers,
      subcribeChannel: user[0].subcribedChannels,
    });
    console.log(isvalid);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Something is wrong",
    });
  }
});
//Subscriber channel api
Router.put("/subscribe/:userBId", checkAuth, async (req, res) => {
  try {
    const userA = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );
    const userB = await User.findById(req.params.userBId);
    if (userB.subscribedBy.includes(userA._id)) {
      return res.status(500).json({
        message: "Already Subscribed",
      });
    }
    // if(video.likedBy.includes(verifiedUser._id)){
    //   video.likes-=1;
    //   video.likedBy=video.likedBy.filter(userId=>userId.toString()!=verifiedUser._id)
    // }
    userB.subscribers += 1;
    userB.subscribedBy.push(userA._id);
    await userB.save();
    const userAFullInfo = await User.findById(userA._id);
    userAFullInfo.subcribedChannels.push(userB._id);
    userAFullInfo.save();
    res.status(200).json({
      message: "Ohh wow Subscribed...",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

// unsubscribe channel api
Router.put("/unsubscribe/:userBId", checkAuth, async (req, res) => {
  try {
    const userA = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );
    const userB = await User.findById(req.params.userBId);
    if (userB.subscribedBy.includes(userA._id)) {
      userB.subscribers -= 1;
      userB.subscribedBy = userB.subscribedBy.filter(
        (userId) => userId.toString() != userA._id
      );
      await userB.save();
      const userAFullInfo = await User.findById(userA._id);
      userAFullInfo.subcribedChannels = userAFullInfo.subcribedChannels.filter(userId => userId.toString() != userB._id);
      userAFullInfo.save();
      res.status(200).json({
        messsage: "Ohh No Unsubscribed",
      });
    } else {
      return res.status(500).json({
        message: "Ohh Not Subscribe",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = Router;
