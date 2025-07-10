require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const connectDB = require("./config/database");
const User = require("./models/user");
const { validateSignupData } = require("./utils/validation");

const app = express();

app.use(express.json());

app.post("/signup", async (req, res) => {
  try {
    // validate the data
    validateSignupData(req);
    const { firstName, lastName, emailId, password } = req.body;
    // hash the password
    // const {password} = req.body
    const passwordHash = await bcrypt.hash(password, 10);
    // creating a new instance of the user models
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });
    await user.save();

    res.send("User created successfully");
  } catch (err) {
    res.status(400).send("Error saving the user:" + err.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId: emailId });

    if (!user) {
      throw new Error("Invalid cradential");
    }

    const isValidate = await bcrypt.compare(password, user.password);
    if (isValidate) {
      res.send("Login successfull");
    } else {
      throw new Error("Invalid cradential");
    }
  } catch (error) {
    res.status(400).send("Error saving the user:" + error.message);
  }
});

// Get user by email

app.get("/user", async (req, res) => {
  try {
    const useremailId = req.body.emailId;
    const user = await User.findOne({ emailId: useremailId });

    if (!user) {
      res.status(404).send("User not found");
    } else {
      res.send(user);
    }
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
});

// Update user data off the user

app.patch("/user/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const data = req.body;

  try {
    const ALLOWED_UPDATE = ["photoUrl", "about", "gender", "skills", "age"];

    const isUpdateAllowed = Object.keys(data).every((k) =>
      ALLOWED_UPDATE.includes(k)
    );

    if (!isUpdateAllowed) {
      throw new Error("Update not allowed");
      // res.status(400).send("Update not allowed")
    }

    if (data?.skills.length > 10) {
      throw new Error("Skill can not be more than 10");
    }
    await User.findByIdAndUpdate({ _id: userId }, data, {
      returnDocument: "after",
      runValidators: true,
    });
    res.send("User updated successfully");
  } catch (error) {
    res.status(400).send("Update failed:" + error.message);
  }
});

// Delete api - DELETE/user - Delete user

app.delete("/user", async (req, res) => {
  const userId = req.body.userId;
  try {
    const user = await User.findByIdAndDelete(userId);
    res.send("User deleted successfully");
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
});

// Feed api - GET/feed - get all the user from DB
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
});

connectDB()
  .then(() => {
    console.log("Database connections Successfull");
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected");
  });
