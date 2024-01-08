const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: false,
    },
    email: {
      type: "String",
      required: true,
      unique: true,
    },
    password: {
      type: "String",
      required: true,
    },
    role: {
      type: String,
      required: false,
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: "Number",
          required: true,
        },
      },
    ],
    address: [
      {
        houseNo: {
          type: "Number",
          required: true,
        },
        street: {
          type: "String",
          required: true,
        },
        city: {
          type: "String",
          required: true,
        },
        pincode: {
          type: "Number",
          required: true,
        },
        contactNo: {
          type: "Number",
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

userSchema.methods.addToCart = function (prodId) {
  const existingProductIndex = this.cart.findIndex((p) => {
    return p.productId.toString() === prodId;
  });
  const updatedCartItems = [...this.cart];

  if (existingProductIndex >= 0) {
    updatedCartItems[existingProductIndex].quantity += 1;
  } else {
    updatedCartItems.push({ productId: prodId, quantity: 1 });
  }
  this.cart = updatedCartItems;
  return this.save();
};

userSchema.methods.updateCart = function (prodId, qty) {
  const existingProductIndex = this.cart.findIndex((p) => {
    return p.productId.toString() === prodId;
  });
  const updatedCartItems = [...this.cart];

  updatedCartItems[existingProductIndex].quantity += qty;
  this.cart = updatedCartItems;
  return this.save();
};

userSchema.methods.removeFromCart = function (prodId) {
  const updatedCart = this.cart.filter((p) => {
    return p.productId.toString() !== prodId;
  });

  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = [];
  return this.save();
};

userSchema.methods.setAddress = function (userAddress) {
  const updatedAddresses = [...this.address];
  updatedAddresses.push(userAddress);
  this.address = updatedAddresses;
  return this.save();
};

userSchema.methods.removeFromAddress = function (addressId) {
  const updatedAddress = this.address.filter((p) => {
    return p._id.toString() !== addressId;
  });

  this.address = updatedAddress;
  return this.save();
};

userSchema.methods.updateAddress = function (
  houseNo,
  street,
  city,
  pincode,
  contactNo,
  AddressId
) {
  // console.log(prodId, qty);
  const existingAddressIndex = this.address.findIndex((p) => {
    return p._id.toString() === AddressId;
  });
  const updatedAddressItems = [...this.address];
  updatedAddressItems[existingAddressIndex].houseNo = houseNo;
  updatedAddressItems[existingAddressIndex].street = street;
  updatedAddressItems[existingAddressIndex].city = city;
  updatedAddressItems[existingAddressIndex].contactNo = contactNo;
  updatedAddressItems[existingAddressIndex].pincode = pincode;

  return this.save();
};

module.exports = mongoose.model("User", userSchema);
