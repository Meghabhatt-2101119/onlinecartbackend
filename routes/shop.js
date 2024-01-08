const express = require("express");

const {
  getLatestProducts,
  getSingleProduct,
  getCart,
  addToCart,
  updateCart,
  deleteItemFromCart,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getOrders,
  getOrderInvoice,
} = require("../controllers/shop");
const isAuth = require("../middlewares/is-Auth");

const router = express.Router();

router.get("/latest-products", getLatestProducts);

router.get("/get-product/:prodId", getSingleProduct);

router.get("/cart", isAuth, getCart);

router.patch("/cart/:productId", isAuth, addToCart);

router.patch("/updateCart", isAuth, updateCart);

router.delete("/cart/:productId", isAuth, deleteItemFromCart);

router.get("/get-address", isAuth, getAddresses);

router.patch("/add-address", isAuth, addAddress);

router.delete("/deleteaddress/:addressId", isAuth, deleteAddress);

router.patch("/updateaddress/:addressId", isAuth, updateAddress);

router.get("/orders", isAuth, getOrders);

router.get("/orders/:orderId", isAuth, getOrderInvoice);

module.exports = router;
