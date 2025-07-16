const express = require("express");
const cors = require("cors");

const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

// express.json() is a middleware it convert json in request body to the javascripts object

// cookie parder middleware

connectDB()
  .then(() => {
    console.log("Database connections Successfull");
    app.listen(process.env.PORT, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected");
  });
