const stripe = require("stripe")(process.env.STRIPE_API_KEY);

const User = require("../models/user");
const Order = require("../models/order");
const HttpError = require("../util/http-error");

let endpointSecret;
//  endpointSecret =("whsec_8eb7e921e2e2be3a8f6fa80038ad1128440fdaf3db4ee325f9221c2e0acb4652");

const placeorder = async (paymentIntent) => {
  try {
    const customer = await stripe.customers.retrieve(paymentIntent.customer);
    console.log(customer.metadata);
    const user = await User.findOne({ _id: customer.metadata.userId });
    const expandUser = await user.populate("cart.productId");
    const products = expandUser.cart;
    const address = user.address.find((address) => {
      return address._id.toString() === customer.metadata.addressId;
    });
    const order = new Order({
      address: address,
      userId: customer.metadata.userId,
      products: products,
    });
    await order.save();
    await user.clearCart();
    return order;
  } catch (err) {
    return new HttpError(err.message, 500);
  }
};
exports.postCheckout = async (req, res, next) => {
  const addressId = req.body.addressId;
  const user = await req.user.populate("cart.productId");
  const products = user.cart;
  let total = 0;
  products.forEach((p) => (total += p.quantity * p.productId.price));

  const customer = await stripe.customers.create({
    metadata: {
      addressId: addressId,
      userId: req.user._id.toString(),
    },
  });
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "INR",
      customer: customer.id,
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    next(new HttpError(err.message, 500));
  }
};

exports.postWebhook = async (req, res, next) => {
  let event = req.body;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = req.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      try {
        const order = await placeorder(paymentIntent);
        res.send("Order place successfully");
      } catch (err) {
        next(new HttpError(err.message, 500));
      }
      break;

    case "payment_method.attached":
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
};
