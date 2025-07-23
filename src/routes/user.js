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
  "city",
  "location",
  "hobbies",
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // --- 1. Find users to exclude (same as before) ---
    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: logedinUser._id }, { toUserId: logedinUser._id }],
    }).select("fromUserId toUserId");

    const hideUserFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hideUserFromFeed.add(req.fromUserId.toString());
      hideUserFromFeed.add(req.toUserId.toString());
    });
    // Also add the logged-in user themselves
    hideUserFromFeed.add(logedinUser._id.toString());

    // --- 2. Define Query Filters ---

    // Base filters that apply to all searches
    const baseFilters = {
      _id: { $nin: Array.from(hideUserFromFeed) },
      gender: { $ne: logedinUser.gender },
      age: { $gte: logedinUser.age - 5, $lte: logedinUser.age + 5 },
    };

    // Specific matching criteria (your original `$or` block)
    // We add `|| []` to prevent errors if hobbies/skills are undefined.
    const specificMatching = {
      $or: [
        { city: { $eq: logedinUser.city } },
        {
          $expr: {
            $gte: [
              {
                $size: {
                  $setIntersection: ["$hobbies", logedinUser.hobbies || []],
                },
              },
              2,
            ],
          },
        },
        {
          $expr: {
            $gte: [
              {
                $size: {
                  $setIntersection: ["$skills", logedinUser.skills || []],
                },
              },
              2,
            ],
          },
        },
      ],
    };

    // --- 3. Execute Query with Fallback Logic ---

    // Combine base and specific filters for the primary query
    const primaryQuery = { ...baseFilters, ...specificMatching };

    let users = await User.find(primaryQuery)
      .select(USER_SAFE_DATA) // Assuming USER_SAFE_DATA is defined
      .skip(skip)
      .limit(limit);

    let totalUsers = await User.countDocuments(primaryQuery);

    // If the specific query finds no one (and it's the first page),
    // run a broader, fallback query.
    if (users.length === 0 && page === 1) {
      console.log("No specific matches found. Using fallback query.");
      // The fallback query just uses the base filters (age, gender, etc.)
      const fallbackQuery = baseFilters;

      users = await User.find(fallbackQuery)
        .select(USER_SAFE_DATA)
        .skip(skip)
        .limit(limit);

      totalUsers = await User.countDocuments(fallbackQuery);
    }

    // --- 4. Send Response ---
    const availableUsers = totalUsers > 0 ? totalUsers - users.length : 0;
    res.send({ availableUsers, users });
  } catch (error) {
    res.status(400).send("ERROR:" + error.message);
  }
});

module.exports = userRouter;
