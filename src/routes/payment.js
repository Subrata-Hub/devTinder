const express = require("express");
const axios = require("axios");

const { userauth } = require("../middleware/auth");
const Payment = require("../models/payment");
const { membershipAmound } = require("../utils/constant");
const User = require("../models/user");

const paymentRouter = express.Router();

async function generateAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await axios.post(
    `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

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

    // console.log(response.data);

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
    console.log("--- Webhook Received ---");
    const webhookEvent = req.body;
    console.log("Webhook event type:", webhookEvent.event_type);

    const accessToken = await generateAccessToken();
    const verifyResponse = await axios.post(
      `${process.env.PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
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

    const resource = webhookEvent.resource;

    if (!resource) {
      console.warn(
        "WARNING: Webhook event received without a 'resource' object."
      );
      return res.sendStatus(400); // Bad request if resource is missing
    }

    if (webhookEvent.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId =
        resource.supplementary_data?.related_ids?.order_id || resource.id;

      if (!orderId) {
        console.error(
          "ERROR: Could not extract orderId from PAYMENT.CAPTURE.COMPLETED webhook resource."
        );
        return res.sendStatus(400); // Bad request if orderId is missing
      }

      const status = resource.status;

      const updatedPayment = await Payment.findOneAndUpdate(
        { orderId: orderId }, // Assuming orderId is stored in your Payment model
        {
          status: status,
        },
        { new: true, upsert: false } // new: true returns the updated document
      );

      console.log(updatedPayment);

      if (updatedPayment) {
        const user = await User.findOneAndUpdate(
          { _id: updatedPayment.userId },
          { isPremium: true, membershipType: updatedPayment.membershipType },
          { new: true, upsert: false }
        );
      }

      console.log("--- Webhook processing complete. Sending 200 OK. ---");

      res.sendStatus(200);
    }

    if (webhookEvent.event_type === "PAYMENT.CAPTURE.DECLINED") {
      const orderId =
        resource.supplementary_data?.related_ids?.order_id || resource.id;

      try {
        await Payment.findOneAndUpdate(
          { orderId: orderId },
          { status: "DECLINED" },
          { new: true, upsert: false }
        );
      } catch (dbError) {
        console.error(
          "ERROR: Database update failed for PAYMENT.CAPTURE.DECLINED:",
          dbError.message
        );
        console.error("DB Error details:", dbError);
        return res
          .status(500)
          .json({ msg: "Database update failed for capture declined" });
      }

      return res
        .status(500)
        .json({ msg: "Database update failed for capture declined" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

module.exports = paymentRouter;
