const express = require("express");
const { userauth } = require("../middleware/auth");

const profileRoute = express.Router();

profileRoute.get("/profile", userauth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(400).send("Error saving the user:" + error.message);
  }
});

module.exports = profileRoute;
