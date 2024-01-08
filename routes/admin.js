const express = require("express");
const { body } = require("express-validator");

const {
  getProducts,
  postAddProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/admin");
const isAuth = require("../middlewares/is-Auth");
const upload = require("../middlewares/file-upload");

const router = express.Router();

router.get("/get-products", isAuth, getProducts);

router.post(
  "/add-product",
  [
    body("title")
      .notEmpty()
      .isAlpha()
      .withMessage("title should have alphabets only"),
    body("price").notEmpty().isNumeric(),
    body("description").notEmpty().isLength({ min: 5, max: 30 }),
  ],
  isAuth,
  upload.single("imageUrl"),
  postAddProduct
);

router.put(
  "/update-product/:prodId",
  isAuth,
  upload.single("imageUrl"),
  updateProduct
);

router.delete("/delete-product/:prodId", isAuth, deleteProduct);

module.exports = router;
