const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const HttpError = require("../util/http-error");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "meghabhatt1108@gmail.com",
    pass: "llcnkotnnynyxubj",
  },
});

exports.postSignup = async (req, res, next) => {
  const valResult = validationResult(req);
  if (!valResult.isEmpty()) {
    return next(new HttpError(valResult.errors[0].msg, 422));
  }
  const { name, email, password } = req.body;

  //1) Check if the user already exists or not
  const user = await User.findOne({ email: email });
  if (user) {
    return next(new HttpError("User Already exists!!", 409));
  }

  //2) Encrypt the password of the user
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Internal Server Error", 500));
  }

  //3) Store the email and password in the database
  try {
    const users = await User.find();
    let role = "customer";
    if (users.length == 0) {
      role = "admin";
    }
    await User.create({
      email: email,
      password: hashedPassword,
      role: role,
    });
    res.status(200).send({ message: "Account created successfully" });
  } catch (err) {
    next(new HttpError("Internal Server Error", 500));
  }
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  //1) Check whether the email exists or not
  const user = await User.findOne({ email: email });
  if (!user) {
    return next(new HttpError("Invalid email or password", 401));
  }

  //2)To check the password is correct or not
  try {
    const doMatches = await bcrypt.compare(password, user.password);
    if (doMatches) {
      //Creating JWT
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_KEY,
        {
          expiresIn: Date.now() + 3600000,
        }
      );
      res.status(200).json({ token: token, role: user.role });
    } else {
      return next(new HttpError("Invalid email or password", 401));
    }
  } catch (err) {
    next(new HttpError("Internal Server Error", 500));
  }
};

exports.postReset = async (req, res, next) => {
  const email = req.body.email;

  //1) Check Whether the email exists or not
  let user = await User.findOne({ email: email });
  if (!user) {
    return next(new HttpError("You don't have an account with us", 422));
  }

  //2) Generate the random token
  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      return next(new HttpError("Internal Server Error", 500));
    }
    const token = buffer.toString("hex");

    //3) Set the token and expiration in user instance
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    try {
      await user.save();

      //4) Send mail to the user along with token
      await transporter.sendMail({
        from: "meghabhatt1108@gmail.com",
        to: email,
        subject: "Reset Password",
        html: `<h1>You have requested for Password Reset</h1>
            <p>Click on this <a href='${process.env.FRONTEND_URL}set-password?userId=${user._id}&token=${token}'>link</a> to update password</p>`,
      });
      res
        .status(200)
        .json({ message: "Reset Password mail sent successfully" });
    } catch (err) {
      next(new HttpError("Internal Server Error", 500));
    }
  });
};

exports.updatePassword = async (req, res, next) => {
  const { password, token, userId } = req.body;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  });

  if (!user) {
    return next(new HttpError("Session Timeout", 409));
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Internal Server Error", 500));
  }

  try {
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiration: null,
    });
    res.status(200).json({ message: "password updated successfully" });
  } catch (err) {
    next(new HttpError("Internal Server Error", 500));
  }
};
