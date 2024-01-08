const express = require("express");

const router = express.Router();

const { postCheckout, postWebhook } = require("../controllers/payments");

const isAuth = require("../middlewares/is-Auth");

router.post("/checkout", isAuth, postCheckout);

router.post("/webhook", express.raw({ type: "application/json" }), postWebhook);

module.exports = router;
