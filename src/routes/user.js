const express = require("express");
const { userauth } = require("../middleware/auth");

const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const userRouter = express.Router();

const USER_SAFE_DATA = [
  "firstName",
  "lastName",
  "photoUrl",
  "age",
  "gender",
  "skills",
  "about",
];

userRouter.get("/user/requests/received", userauth, async (req, res) => {
  try {
    const logedinUser = req.user;
    const connectionRequests = await ConnectionRequest.find({
      toUserId: logedinUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAFE_DATA);

    res.json({ message: "Data fetch Successfully", data: connectionRequests });
  } catch (error) {
    res.status(400).send("ERROR:" + error.message);
  }
});

userRouter.get("/user/connections", userauth, async (req, res) => {
  try {
    const logedinUser = req.user;

    const userConnections = await ConnectionRequest.find({
      $or: [
        { toUserId: logedinUser._id, status: "accepted" },
        { fromUserId: logedinUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    const data = userConnections.map((doc) => {
      if (doc.fromUserId._id.toString() === logedinUser._id.toString()) {
        return doc.toUserId;
      }
      return doc.fromUserId;
    });

    res.json({ data });
  } catch (error) {
    res.status(400).send("ERROR:" + error.message);
  }
});

userRouter.get("/feed", userauth, async (req, res) => {
  try {
    const logedinUser = req.user;

    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: logedinUser._id }, { toUserId: logedinUser._id }],
    }).select("fromUserId toUserId");

    const hideUserFromFeed = new Set();

    connectionRequests.forEach((req) => {
      hideUserFromFeed.add(req.fromUserId.toString());
      hideUserFromFeed.add(req.toUserId.toString());
    });

    const toTalUsers = await User.countDocuments({
      $and: [
        { _id: { $nin: Array.from(hideUserFromFeed) } },
        { _id: { $ne: logedinUser._id } },
      ],
    });

    let totalUserToShowingUserFeed = 0;

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUserFromFeed) } },
        { _id: { $ne: logedinUser._id } },
      ],
    })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    totalUserToShowingUserFeed = totalUserToShowingUserFeed + users?.length;

    const availableUserToShowingUserFeed =
      toTalUsers - totalUserToShowingUserFeed;

    res.send({ availableUsers: availableUserToShowingUserFeed, users });
  } catch (error) {
    res.status(400).send("ERROR:" + error.message);
  }
});

module.exports = userRouter;
