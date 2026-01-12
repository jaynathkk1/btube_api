const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true ,ref:"User"},
    videoId: { type: String, required: true },
    commentText: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Comment", CommentSchema);
