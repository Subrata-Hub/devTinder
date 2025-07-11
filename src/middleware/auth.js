const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userauth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Token not valid");
    }

    const decodeObject = await jwt.verify(token, "subrata$123@321");

    const { _id } = decodeObject;
    const user = await User.findById(_id);

    if (!user) {
      throw new Error("User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(400).send("ERROR:" + error.message);
  }
};

module.exports = { userauth };
