const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const HttpError = require("./util/http-error");
require("dotenv").config();
const port = process.env.PORT || 4000;

const MONGODB_URI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.mvrwaim.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const paymentRoutes = require("./routes/payments");

app.use(bodyParser.json());
app.use("/uploads/images", express.static("uploads/images"));

//CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/api/admin", adminRoutes);
app.use("/api", shopRoutes);
app.use("/api", authRoutes);
app.use("/api/payment", paymentRoutes);

app.use((req, res, next) => {
  res.send("Backend is live");
});

app.use((req, res, next) => {
  throw new HttpError("Couldn't find this route", 404);
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.status || 500);
  res.json({ message: error.message || "An unknown error occurred" });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(port, "localhost", () => {
      console.log("Backend is running at port " + port);
    });
  })
  .catch((err) => console.log(err));
