const express = require("express");
const { userauth } = require("../middleware/auth");
const { validateEditProfileData } = require("../utils/validation");

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

module.exports = profileRoute;
