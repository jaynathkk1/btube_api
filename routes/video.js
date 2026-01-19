const express = require("express");
const checkAuth = require("../middleware/checkAuth");
const Router = express.Router();
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const Video = require("../models/Video");
const mongoose = require("mongoose");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

//Upload Video
Router.post("/upload", checkAuth, async (req, res) => {
  console.log(req.body);
  if (!req.files || !req.files.video || !req.files.thumbnail) {
    return res.status(400).json({
      error: "Missing video or thumbnail file",
    });
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const uploadedVideo = await cloudinary.uploader.upload(
      req.files.video.tempFilePath,
      {
        resource_type: "video",
      }
    );
    const uploadedThumbnail = await cloudinary.uploader.upload(
      req.files.thumbnail.tempFilePath
    );
    const newVideo = new Video({
      _id: new mongoose.Types.ObjectId(),
      title: req.body.title,
      description: req.body.description,
      user_id: user._id,
      videoUrl: uploadedVideo.secure_url,
      videoId: uploadedVideo.public_id,
      thumbnailUrl: uploadedThumbnail.secure_url,
      thumbnailId: uploadedThumbnail.public_id,
      category: req.body.category,
      tags: req.body.tags.split(","),
    });
    const newUploadedVideo = await newVideo.save();

    res.status(200).json({
      newVideo: newUploadedVideo,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err.message,
    });
  }
});
//Update Video
Router.put("/:videoId", checkAuth, async (req, res) => {
  try {
    const verifiedUser = await jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );

    const video = await Video.findById(req.params.videoId);
    if (video.user_id == verifiedUser._id) {
      ///update Video details
      if (req.files) {
        await cloudinary.uploader.destroy(video.thumbnailId);
        const updatedThumbanil = await cloudinary.uploader.upload(
          req.files.thumbnail.tempFilePath
        );
        const updatedData = {
          title: req.body.title,
          description: req.body.description,
          category: req.body.category,
          tags: req.body.tags.split(","),
          thumbnailUrl: updatedThumbanil.secure_url,
          thumbnailId: updatedThumbanil.public_id,
        };
        const updatedVideoDetail = await Video.findByIdAndUpdate(
          req.params.videoId,
          { new: true }
        );
        res.status(200).json({
          updatedVideo: updatedVideoDetail,
        });
      } else {
        const updatedData = {
          title: req.body.title,
          description: req.body.description,
          category: req.body.category,
          tags: req.body.tags.split(","),
        };
        const updatedVideoDetail = await Video.findByIdAndUpdate(
          req.params.videoId,
          updatedData,
          { new: true }
        );
        res.status(200).json({
          updatedVideo: updatedVideoDetail,
        });
      }
    } else {
      return res.status(500).json({
        message: "You Don'nt have permission",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

//get own video
Router.get("/own-video",checkAuth,async(req,res)=>{
  try {
    const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1],process.env.JWT_SECRET);
    const videos = await Video.find({user_id:verifiedUser._id}).populate("user_id", "channelName logoUrl");
    res.status(200).json({
      videos:videos
    })

  } catch (error) {
    console.log(err);
    res.status(500).json({
      error: err.message,
    });
  }
})


Router.get("/videos", async (req, res) => {
    const title = req.query.title || "";
    const sort = req.query.sort || "old";  
    const category = req.query.category || "All";  
    const page = parseInt(req.query.page) || 1;   
    const ITEM_PER_PAGE = 2;
    
    const query = { title: { $regex: title, $options: "i" } };
    if (category !== "All") {
        query.category = category;
    }
    
    try {
        const skip = (page - 1) * ITEM_PER_PAGE;
        const count = await Video.countDocuments(query);
        console.log(`Total videos: ${count}`);
        
        const videosdata = await Video.find(query).sort({ datecreated: sort === "new" ? -1 : 1 }).populate("").limit(ITEM_PER_PAGE).skip(skip);
        const pageCount = Math.ceil(count / ITEM_PER_PAGE);
        
        res.status(200).json({
            Pagination: {
                currentPage: page,
                totalPages: pageCount,
                totalCount: count,
                itemsPerPage: ITEM_PER_PAGE,
                hasNext: page < pageCount,
                hasPrev: page > 1
            },
            videosdata
        });
    } catch (error) {  
        console.error('Pagination error:', error);
        res.status(500).json({
            error: error.message,
        });
    }
});

Router.get("/:videoId",checkAuth,async(req,res)=>{
  try {
    const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1],process.env.JWT_SECRET);
    const videos = await Video.findById(req.params.videoId);
    res.status(200).json({
      videos:videos
    })

  } catch (error) {
    console.log(err);
    res.status(500).json({
      error: err.message,
    });
  }
})

//Delete Video
Router.delete("/:videoId", checkAuth, async (req, res) => {
  try {
    const verifiedUser = await jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );
    console.log(verifiedUser);
    const video = await Video.findById(req.params.videoId);
    console.log(verifiedUser);

    if (video.user_id == verifiedUser._id) {
      //deleted video
      await cloudinary.uploader.destroy(video.videoId,{resource_type:"video"});
      await cloudinary.uploader.destroy(video.thumbnailId);
      const deletedResponse = await Video.findByIdAndDelete(req.params.videoId);
      res.status(200).json({
        deletedResponse:deletedResponse
      })
    } else {
      return res.status(500).json({
        message: "Aukat se bahar...",
      });
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      error: err.message,
    });
  }
});
//Like Video
Router.put("/like/:videoId",checkAuth,async(req,res)=>{
  try {
    const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1],process.env.JWT_SECRET);
        const video = await Video.findById(req.params.videoId);
        console.log(video);
        if(video.likedBy.includes(verifiedUser._id)){
          return res.status(500).json({
            message:"Already Liked"
          })
        }
        if(video.dislikedBy.includes(verifiedUser._id)){
          video.dislikes-=1;
          video.dislikedBy=video.dislikedBy.filter(userId=>userId.toString()!=verifiedUser._id)
        }

        video.likes+=1;
        video.likedBy.push(verifiedUser._id);
        await video.save();
        res.status(200).json({
          message:"WOW Liked..."
        })
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      error: err.message,
    });
  }
})
// disLike video
Router.put("/dislike/:videoId",checkAuth,async(req,res)=>{
  try {
    const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1],process.env.JWT_SECRET);
        const video = await Video.findById(req.params.videoId);
        console.log(video);
        if(video.dislikedBy.includes(verifiedUser._id)){
          return res.status(500).json({
            message:"Already disLiked"
          })
        }
        if(video.likedBy.includes(verifiedUser._id)){
          video.likes-=1;
          video.likedBy=video.likedBy.filter(userId=>userId.toString()!=verifiedUser._id)
        }
        video.dislikes+=1;
        video.dislikedBy.push(verifiedUser._id);
        await video.save();
        res.status(200).json({
          message:"Ohh disLiked..."
        })
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      error: err.message,
    });
  }
})
// views video count increase
Router.put("/views/:videoId",async(req,res)=>{
  try {
    const video = await Video.findById(req.params.videoId);
    video.views+=1;
    await video.save();
    res.status(200).json({
      message:"Video Viewed..."
    })
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
})
module.exports = Router;
