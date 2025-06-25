const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(
  "mongodb+srv://kishorekumar20101999:1Bg3cvGVAY8PV9Er@cluster0.yalqjox.mongodb.net/",
  {
    dbName: "gridApp",
  }
);

const BoxSchema = new mongoose.Schema({
  index: Number,
  value: String,
  owner: String,
});

const Box = mongoose.model("Box", BoxSchema);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("get-grid", async () => {
    const boxes = await Box.find();
    socket.emit("grid-data", boxes);
  });

  socket.on("update-box", async ({ index, value }) => {
    let box = await Box.findOne({ index });
    if (!box) {
      box = new Box({ index, value });
    } else {
      box.value = value;
    }
    await box.save();
    io.emit("grid-data", await Box.find());
  });

  socket.on("drag-drop", async ({ from, to }) => {
    const fromBox = await Box.findOne({ index: from });
    const toBox = await Box.findOne({ index: to });

    if (!fromBox) return;

    if (toBox) {
      const tempValue = fromBox.value;
      fromBox.value = toBox.value;
      toBox.value = tempValue;

      await fromBox.save();
      await toBox.save();
    } else {
      fromBox.index = to;
      await fromBox.save();
    }

    io.emit("grid-data", await Box.find());
  });

  socket.on("clear-all", async () => {
    await Box.deleteMany();
    io.emit("grid-data", []);
  });
});

server.listen(4000, () => console.log("Server running on port 4000"));
