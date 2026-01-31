/** @format */

const { initSocket } = require("./rooms");
const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
const server = http.createServer(app);
initSocket(server);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(3000, () => {
  console.log("server is running at http://localhost:3000");
});
