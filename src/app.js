const express = require("express");

const app = express();

app.use("/test", (req, res) => {
  res.send("Hellow from test1");
});

app.use((req, res) => {
  res.send("Hell from servee");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
