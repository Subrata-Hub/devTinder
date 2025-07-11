const express = require("express");
const { userauth } = require("../middleware/auth");

const requestRouter = express.Router();

requestRouter.post("/sentConnectionRequest", userauth, (req, res) => {
  const user = req.user;

  res.send(user.firstName + "sent conection request");
});

module.exports = requestRouter;
