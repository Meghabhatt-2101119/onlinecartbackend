const express = require("express");

const {
  postLogin,
  postSignup,
  postReset,
  updatePassword,
} = require("../controllers/auth");

const {  body } = require("express-validator");

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").notEmpty().isAlpha().withMessage("Invalid name"),
    body("email")
      .notEmpty()
      .normalizeEmail()
      .isEmail()
      .withMessage("Invalid Email"),
    body("password")
      .notEmpty()
      .isStrongPassword()
      .isLength({ min: 8, max: 24 })
      .withMessage("Invalid password"),
  ],
  postSignup
);

router.post("/login", postLogin);

router.post("/reset", postReset);

router.patch("/update-password", updatePassword);

module.exports = router;
