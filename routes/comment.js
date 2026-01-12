const express = require("express");
const checkAuth = require("../middleware/checkAuth");
const mongoose = require("mongoose");
const Router = express.Router();
const jwt = require("jsonwebtoken");
const Comment = require("../models/Comment");

// Add Comment on Unique Video
Router.post("/new-comment/:videoId", checkAuth, async (req, res) => {
  try {
    const verifiedUser = await jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );
    const newComment = Comment({
      _id: new mongoose.Types.ObjectId(),
      userId: verifiedUser._id,
      videoId: req.params.videoId,
      commentText: req.body.commentText,
    });
    const comment = await newComment.save();
    res.status(200).json({
      newComment: comment,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});
// get all comment by
Router.get("/:videoId", async (req, res) => {
  try {
    const comments = await Comment.find({
      videoId: req.params.videoId,
    }).populate("userId", "channelName logoUrl");
    res.status(200).json({
      commentList: comments,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
// Edit Comment on Unique Video
Router.put("/:commentId", checkAuth, async (req, res) => {
  try {
    const verifiedUser = await jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );

    const comment = await Comment.findById(req.params.commentId);

    if (comment.userId != verifiedUser._id) {
      return res.status(500).json({
        message: "Don'nt edit comment",
      });
    }
    comment.commentText=req.body.commentText;
    const updatedComment=await comment.save();
    res.status(200).json({
        updatdComment:updatedComment
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
  console.log("add Comment");
});
// Delete Comment on Unique Video
Router.delete("/:commentId",checkAuth,async (req, res) => {
try {
    const verifiedUser = await jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );

    const comment = await Comment.findById(req.params.commentId);

    if (comment.userId != verifiedUser._id) {
      return res.status(500).json({
        message: "Don'nt edit comment",
      });
    }
    await Comment.findByIdAndDelete(req.params.commentId);
    res.status(200).json({
        message:'Success'
    })
    res.status(200).json({
        updatdComment:updatedComment
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }});

module.exports = Router;
