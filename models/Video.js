const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
    _id:{type:mongoose.Schema.Types.ObjectId},
    title:{type:String,required:true},
    description:{type:String,required:true},
    user_id:{type:String,required:true},
    videoUrl:{type:String,required:true},
    videoId:{type:String,required:true},
    thumbnailUrl:{type:String,required:true},
    thumbnailId:{type:String,required:true},
    category:{type:String,required:true},
    tags:[{type:String}],
    views:{type:Number,default:0},
    likes:{type:Number,default:0},
    dislikes:{type:Number,required:true,default:0},
    likedBy:[{type:mongoose.Types.ObjectId,ref:"User"}],
    dislikedBy:[{type:mongoose.Types.ObjectId,ref:"User"}],
    viewedBy:[{type:mongoose.Types.ObjectId,ref:"User"}],
    
},{
    timestamps:true
})

module.exports = mongoose.model("Video",VideoSchema);