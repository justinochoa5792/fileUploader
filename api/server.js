import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import fs from "fs";
import { Buffer } from "buffer";
import md5 from "md5";
const app = express();

app.use(bodyParser.raw({ type: "application/octet-stream", limit: "100mb" }));
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use("/uploads", express.static("uploads"));

app.post("/upload", (req, res) => {
  const { name, size, currentChunk, totalChunks } = req.query;
  const ext = name.split(".").pop();
  const data = req.body.toString().split(",")[1];
  const buffer = new Buffer(data, "base64");
  const firstChunk = parseInt(currentChunk) === 0;
  const lastChunk = parseInt(currentChunk) === parseInt(totalChunks) - 1;
  const tmpFilename = "tmp_" + md5(name + req.ip) + "." + ext;
  if (firstChunk && fs.existsSync("./uploads/" + tmpFilename)) {
    fs.unlinkSync("./uploads/" + tmpFilename);
  }
  fs.appendFileSync("./uploads/" + tmpFilename, buffer);
  if (lastChunk) {
    const finalFilename = md5(Date.now()).substr(0, 6) + "." + ext;
    fs.renameSync("./uploads/" + tmpFilename, "./uploads/" + finalFilename);
    res.json({ finalFilename });
  } else {
    res.json("ok");
  }
});

app.listen(4000);
