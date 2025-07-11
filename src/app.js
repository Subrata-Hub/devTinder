require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const User = require("./models/user");
const { validateSignupData } = require("./utils/validation");
const { userauth } = require("./middleware/auth");

const app = express();

// express.json() is a middleware it convert json in request body to the javascripts object
app.use(express.json());

// cookie parder middleware
app.use(cookieParser());

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

    // const isPasswordValidate = await bcrypt.compare(password, user.password);

    // offload isPasswordValidate logic into mongo schema method
    const isPasswordValidate = await user.validatePassword(password);
    if (isPasswordValidate) {
      // create JWT Token
      // const token = await jwt.sign({ _id: user._id }, "subrata$123@321", {
      //   expiresIn: "7d",
      // });

      // Offload this logic into mongo schema method

      const token = await user.getJWT();
      // Add the token to the cookie and send the responce back to the user
      res.cookie("token", token, {
        expires: new Date(Date.now() + 100 * 3600000),
      });
      res.send("Login successfull");
    } else {
      throw new Error("Invalid cradential");
    }
  } catch (error) {
    res.status(400).send("Error saving the user:" + error.message);
  }
});

app.get("/profile", userauth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(400).send("Error saving the user:" + error.message);
  }
});

app.post("/sentConnectionRequest", userauth, (req, res) => {
  const user = req.user;

  res.send(user.firstName + "sent conection request");
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
