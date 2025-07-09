const mongoose = require("mongoose");

const connectDB = async () => {
  //   await mongoose.connect(
  //     "mongodb+srv://sguchhaitdev:Wdsr8RVAk85NPDC8@cluster0.q2agvgm.mongodb.net/devtinder"
  //   );

  await mongoose.connect(process.env.DB_HOST);
};

module.exports = connectDB;
