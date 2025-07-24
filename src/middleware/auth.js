const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { validateUserEmailField } = require("../utils/validation");
const validator = require("validator");

const userauth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).send("You are not login");
    }

    const decodeObject = await jwt.verify(token, process.env.JWT_SECRET);

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

const isUserExit = async (req, res, next) => {
  try {
    if (!validateUserEmailField(req)) {
      throw new Error("Invalid reset request");
    }

    const userEmailId = req.body.emailId;

    if (!validator.isEmail(userEmailId)) {
      throw new Error("Email not valid");
    }

    const findUer = await User.findOne({ emailId: userEmailId });

    if (!findUer) {
      throw new Error(
        `No user Found for this ${userEmailId} . Please try again with other email.`
      );
    }

    req.user = findUer;
    next();
  } catch (error) {
    res.status(404).send("ERROR:" + error.message);
  }
};

const authorizationCheck = async (req, res, next) => {
  try {
    const user = req.user;

    const submitedcode = req.body.code;

    if (!user || !user.passwordResetCode || !user.passwordResetExpires) {
      throw new Error("Invalid reset request. Please start over.");
    }

    if (user.passwordResetExpires < Date.now()) {
      throw new Error("Code has expired. Please request a new one.");
    }

    const isValidCode = user.passwordResetCode === submitedcode;

    if (!isValidCode) {
      throw new Error("The code you entered is not valid.");
    }

    // Clear the reset fields after successful verification
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    next();
  } catch (error) {
    res.status(401).send("Authorization Error: " + error.message);
  }
};

module.exports = { userauth, isUserExit, authorizationCheck };
