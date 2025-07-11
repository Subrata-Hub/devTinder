const express = require("express");
const { userauth } = require("../middleware/auth");
const validator = require("validator");
const {
  validateEditProfileData,
  validateProfilePasswordData,
} = require("../utils/validation");
const bcrypt = require("bcrypt");

const profileRoute = express.Router();

profileRoute.get("/profile/view", userauth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(400).send("Error saving the user:" + error.message);
  }
});

profileRoute.patch("/profile/edit", userauth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid edit request");
    }

    const logedInUser = req.user;
    Object.keys(req.body).forEach((key) => (logedInUser[key] = req.body[key]));

    await logedInUser.save();
    res.json({
      message: `${logedInUser.firstName}, your profile update successfully`,
      data: logedInUser,
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

profileRoute.patch("/profile/password", userauth, async (req, res) => {
  try {
    if (!validateProfilePasswordData(req)) {
      throw new Error("Invalid edit request");
    }
    const user = req.user;

    const isValidPassword = validator.isStrongPassword(req.body.password);

    if (!isValidPassword) {
      throw new Error("Enter a strong password: " + req.body.password);
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);

    user.password = passwordHash;

    await user.save();

    res.send("Password update successfully");
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

module.exports = profileRoute;
