const express = require("express");
const cors = require("cors");

const http = require("http");

const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const paymentRouter = require("./routes/payment");
const chatRouter = require("./routes/chat");

const initializeSocket = require("./utils/socket");

require("dotenv").config();

// require("./utils/cronJob");

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
app.use("/", paymentRouter);
app.use("/", chatRouter);

// express.json() is a middleware it convert json in request body to the javascripts object

// cookie parder middleware

const server = http.createServer(app);

initializeSocket(server);

connectDB()
  .then(() => {
    console.log("Database connections Successfull");
    server.listen(process.env.PORT, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected");
  });
