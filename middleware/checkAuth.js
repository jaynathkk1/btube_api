const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    // console.log(req.headers.authorization.split(" ")[1]);
    const token = req.headers.authorization.split(" ")[1];
    await jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    console.log("Invalid Token");
    res.status(500).json({
      error: "Invalid Token",
    });
  }
};
