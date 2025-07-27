const express = require("express");
const axios = require("axios");

const { userauth } = require("../middleware/auth");
const Payment = require("../models/payment");
const { membershipAmound } = require("../utils/constant");
const User = require("../models/user");

const paymentRouter = express.Router();

async function generateAccessToken() {
  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + "/v1/oauth2/token",
    method: "post",
    data: "grant_type=client_credentials",
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_CLIENT_SECRET,
    },
  });

  return response.data.access_token;
}

paymentRouter.post("/payment/create", userauth, async (req, res) => {
  try {
    const user = req.user;
    const membershipType = req.body.membershipType;
    if (!user || !membershipType) return;
    const accessToken = await generateAccessToken();

    console.log(accessToken);

    console.log(membershipAmound[membershipType]);

    // const { firstName, lastName, emailId, phoneNumber, location } = user;

    const response = await axios({
      url: process.env.PAYPAL_BASE_URL + "/v2/checkout/orders",
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
        prefer: "return=representation",
      },
      // data: JSON.stringify({
      //   intent: "CAPTURE",
      //   purchase_units: [
      //     {
      //       items: [
      //         {
      //           name: "Node.js Complete Course",
      //           description: "Node.js Complete Course with Express and MongoDB",
      //           quantity: 1,
      //           unit_amount: {
      //             currency_code: "USD",
      //             value: "100.00",
      //           },
      //         },
      //       ],

      //       amount: {
      //         currency_code: "USD",
      //         value: "100",
      //         breakdown: {
      //           item_total: {
      //             currency_code: "USD",
      //             value: "100",
      //           },
      //         },
      //       },
      //     },
      //   ],

      //   application_context: {
      //     return_url: process.env.BASE_URL + "/payment/complete-order",
      //     cancel_url: process.env.BASE_URL + "/payment/cancel-order",
      //     shipping_preference: "NO_SHIPPING",
      //     user_action: "PAY_NOW",
      //     brand_name: "tinderVibe",
      //   },
      // }),

      data: {
        intent: "CAPTURE",
        purchase_units: [
          {
            items: [
              {
                name: "tinderVibe",
                description: "Connect to other developer",
                quantity: 1,
                unit_amount: {
                  currency_code: "USD",
                  value: membershipAmound[membershipType],
                },
              },
            ],

            amount: {
              currency_code: "USD",
              value: membershipAmound[membershipType],
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: membershipAmound[membershipType],
                },
              },
            },
          },
        ],

        // payer: {
        //   email_address: emailId,

        //   name: {
        //     given_name: firstName,
        //     surname: lastName,
        //   },
        //   phone: {
        //     phone_number: {
        //       national_number: phoneNumber.replace(/\D/g, ""),
        //     },
        //   },

        //   address: {
        //     country_code: "IN",
        //   },
        // },

        // application_context: {
        //   return_url: process.env.BASE_URL + "/payment/complete-order",
        //   cancel_url: process.env.BASE_URL + "/payment/cancel-order",
        //   shipping_preference: "NO_SHIPPING",
        //   user_action: "PAY_NOW",
        //   brand_name: "tinderVibe",
        // },
        membershipType: membershipType,
      },
    });

    console.log(response.data);

    const payment = new Payment({
      userId: user._id,
      orderId: response?.data?.id,
      status: response?.data?.status,
      membershipType: membershipType,
      purchase_units: response?.data?.purchase_units,
      payer: response?.data?.payer,
      links: response?.data?.links,
      payment_source: response?.data?.payment_source,
    });

    const savedPayment = await payment.save();

    // const redirectUrl = savedPayment.links.find(
    //   (link) => link.rel === "approve"
    // ).href;

    // res.redirect(redirectUrl);

    res.status(201).send({ savedPayment });
  } catch (error) {
    console.log(error);
  }
});

paymentRouter.post("/payment/capture", userauth, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId" });
    }

    const accessToken = await generateAccessToken();

    const captureResponse = await axios({
      url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // const captureData = captureResponse.data;

    // // Example: Extract details for DB
    // const orderDetails = {
    //   paypalOrderId: captureData.id,
    //   status: captureData.status,
    //   payer: captureData.payer,
    //   purchase_units: captureData.purchase_units,
    // };

    // console.log(captureData);

    res.status(200).send(captureResponse?.data);
  } catch (error) {
    console.error("Order capture failed:", error?.response?.data || error);
    res.status(500).json({ error: "Order capture failed" });
  }
});

paymentRouter.post("/payment/webhook", express.json(), async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const verifyResponse = await axios.post(
      "https://api.paypal.com/v1/notifications/verify-webhook-signature",
      {
        transmission_id: req.headers["paypal-transmission-id"],
        transmission_time: req.headers["paypal-transmission-time"],
        cert_url: req.headers["paypal-cert-url"],
        auth_algo: req.headers["paypal-auth-algo"],
        transmission_sig: req.headers["paypal-transmission-sig"],
        webhook_id: process.env.WEBHOOK_ID,
        webhook_event: req.body,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (verifyResponse.data.verification_status !== "SUCCESS") {
      return res.sendStatus(400);
    }

    const webhookEvent = req.body;
    console.log("Received webhook:", webhookEvent.event_type);

    const resource = webhookEvent.resource;

    if (webhookEvent.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId =
        resource.supplementary_data?.related_resources[0]?.order?.id ||
        resource.custom_id; // Get order ID
      const status = resource.status; // e.g., "COMPLETED"
      const amount = resource.amount.value;
      const currency = resource.amount.currency_code;
      const payerEmail = resource.payer?.email_address;
      const payerId = resource.payer?.payer_id;

      const updatedPayment = await Payment.findOneAndUpdate(
        { orderId: orderId }, // Assuming orderId is stored in your Payment model
        {
          status: status,

          // You might want to store more details from 'resource'
          // e.g., resource: webhookEvent.resource
        },
        { new: true, upsert: false } // new: true returns the updated document
      );

      const user = await User.findOneAndUpdate(
        { _id: updatedPayment.userId },
        { isPremium: true, membershipType: updatedPayment.membershipType },
        { new: true, upsert: false }
      );
    }

    if (webhookEvent.event_type === "PAYMENT.CAPTURE.DECLINED") {
    }

    // PAYMENT.CAPTURE.COMPLETED
    // PAYMENT.CAPTURE.DECLINED
    // CHECKOUT.ORDER.APPROVED
    // PAYMENT.ORDER.CANCELLED
    // CHECKOUT.ORDER.APPROVED

    res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

module.exports = paymentRouter;
