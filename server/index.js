import express from "express";

const app = express();
const port = 3000; //add your port here
const PUBLISHABLE_KEY = "pk_test_51Jtt8eEMuY92pwAJwTDN6wHwGDfahYbjBZgoOHItmMOShWBRjKpvxQkUtaB9E7iz1iALR3is3AS5xpM3ipVfcbe700aAzTID2V";
const SECRET_KEY = "sk_test_51Jtt8eEMuY92pwAJau4PxEGGveQstZwqsSKB2XLkY6a1kVhkmm5BdYSG7GAB7jhS3QWiyH1m1JnZ0HxNwb8W7Xvd00arivsaqW";
import Stripe from "stripe";

//Confirm the API version from your stripe dashboard
const stripe = Stripe(SECRET_KEY, { apiVersion: "2020-08-27" });

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099, //lowest denomination of particular currency
      currency: "usd",
      payment_method_types: ["card"], //by default
    });

    const clientSecret = paymentIntent.client_secret;

    res.json({
      clientSecret: clientSecret,
    });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
});
