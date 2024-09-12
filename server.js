const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const HttpError = require("./util/http-error");
require("dotenv").config();
const cors = require("cors");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const paymentRoutes = require("./routes/payments");

const MONGODB_URI =
  "mongodb+srv://meghabhatt1108:npGzgr4Da2zxUZTW@cluster0.xzq3m9g.mongodb.net/ekart";
const app = express();

app.use(express.json());

//CORS middleware
app.use(
  cors({
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors()); // Enable preflight (OPTIONS) requests for all routes

app.use(bodyParser.json());
app.use("/uploads/images", express.static("uploads/images"));

app.use("/api/admin", adminRoutes);
app.use("/api", shopRoutes);
app.use("/api", authRoutes);
// app.use("/api/payment", paymentRoutes);
// app.use((req, res, next) => {
//   throw new HttpError("Couldn't find this route", 404);
// });
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log("Backend is running at port " + process.env.PORT);
    });
  })
  .catch((err) => console.log("errir at db", err));
