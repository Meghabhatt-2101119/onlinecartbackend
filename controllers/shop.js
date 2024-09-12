const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

const Product = require("../models/product");
const Order = require("../models/order");
const HttpError = require("../util/http-error");

exports.getLatestProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: "desc" });
    const updatedProducts = products.map((product) => {
      return {
        ...product._doc, // Spread the product document properties
        imageUrl: product.imageUrl.replace(/\\/g, "/"), // Replace backslashes with forward slashes
      };
    });
    res.status(200).json({ products: products });
  } catch (err) {
    next(new HttpError("Internal Server Error", 500));
  }
};

exports.getSingleProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.prodId);
    res.status(200).json({ product: product });
  } catch (err) {
    next(new HttpError("Internal Server Error", 500));
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const user = await req.user.populate("cart.productId");
    const cartItems = user.cart;
    res.status(200).json({ cartItems: cartItems });
  } catch (err) {
    next(new HttpError("Internal Server Error", 500));
  }
};

exports.addToCart = async (req, res, next) => {
  const prodId = req.params.productId;
  try {
    await req.user.addToCart(prodId);
    res.status(200).json({ message: "Product added successfully" });
  } catch (err) {
    next(new HttpError("Internal Server Error", 500));
  }
};

exports.updateCart = async (req, res, next) => {
  try {
    await req.user.updateCart(req.body.productId, req.body.quantity);

    res.status(200).json({ message: "Cart updated successfully" });
  } catch (err) {
    next(new HttpError("Internal Server Error", 500));
  }
};

exports.deleteItemFromCart = async (req, res, next) => {
  const prodId = req.params.productId;
  try {
    await req.user.removeFromCart(prodId);
    res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (err) {
    next(new HttpError("Internal Server Error", 500));
  }
};

exports.getAddresses = (req, res, next) => {
  const addresses = req.user.address;
  if (!addresses) {
    throw new HttpError("Unable to fetch addresses", 500);
  }
  res.status(200).json({ addresses: addresses });
};

exports.addAddress = async (req, res, next) => {
  try {
    console.log(req.body);
    const response = await req.user.setAddress(req.body);
    res.status(200).json({ message: "Address added successfully" });
  } catch (err) {
    next(new HttpError(err.message, 500));
  }
};

exports.updateAddress = async (req, res, next) => {
  const addressId = req.params.addressId;
  const { houseNo, street, city, pincode, contactNo } = req.body;

  try {
    await req.user.updateAddress(
      houseNo,
      street,
      city,
      pincode,
      contactNo,
      addressId
    );

    res.status(200).json({ message: "Address updated successfully" });
  } catch (err) {
    next(new HttpError(err.message, 500));
  }
};

exports.deleteAddress = async (req, res, next) => {
  AddressId = req.params.addressId;
  try {
    await req.user.removeFromAddress(AddressId);

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (err) {
    next(new HttpError(err.message, 500));
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id });
    res.status(200).json({ orders: orders });
  } catch (err) {
    next(new HttpError("Internal server Error", 500));
  }
};

exports.getOrderInvoice = async (req, res, next) => {
  const orderId = req.params.orderId;

  let order;
  try {
    order = await Order.findById(orderId);
    if (!order) {
      return next(new HttpError("No Order Found!", 404));
    }
  } catch (err) {
    return next(new HttpError("Internal Server Error", 500));
  }

  const invoiceName = "Invoice-" + orderId + ".pdf";
  const invoicePath = path.join(
    __dirname,
    "..",
    "data",
    "invoices",
    invoiceName
  );

  if (!fs.existsSync(invoicePath)) {
    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.fontSize(26).text("Invoice", {
      underline: true,
    });
    pdfDoc.text("---------------------");

    let totalPrice = 0;
    order.products.forEach((prod) => {
      totalPrice += prod.quantity * prod.productId.price;
      pdfDoc
        .fontSize(14)
        .text(
          prod.productId.title +
            " - " +
            prod.quantity +
            " x " +
            prod.productId.price
        );
    });
    pdfDoc.text("---");
    pdfDoc.fontSize(20).text("Total Price: Rs." + totalPrice);

    pdfDoc.end();
  }

  try {
    const file = fs.createReadStream(invoicePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=" + invoiceName);
    file.pipe(res);
  } catch (err) {
    next(new HttpError("Internal Server Error", 500));
  }
};
