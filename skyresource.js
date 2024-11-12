const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const axios = require("axios")
// var serverKey ="AAAAacxJ7gg:APA91bH8Unpz1fEt_zrLDnEdEJ9-tRIDnYOCOC5HcpFCvP1JJ6cuuZmOCDW0g7trS8qQN2p-tCKPutJu_xn_t7vaypSTb3HxrRJCnPzwwZDeyA_HlOquVfwsP4BXm31GXaBMqDAq6U9a";

const DB_CONNECT = require("./db/db");
require("dotenv").config();

const userRouters = require("./routes/userRoutes");
const functionRouters = require("./routes/functionRoutes");
const fundingRoutes = require("./routes/fundingRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

const cardRouters = require("./routes/cardRoutes");
const { fundingModel } = require("./models/fundingModel");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const PORT = process.env.PORT || 8100;
new DB_CONNECT();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.use(process.env.API_URL, userRouters);
app.use(process.env.API_URL, functionRouters);
app.use(process.env.API_URL, fundingRoutes);
app.use(process.env.API_URL, meetingRoutes);
app.use(process.env.API_URL, cardRouters);
const endpointSecret =
  "whsec_c4fe73134658757f54675fa80da4eeb967f227353a0620236c98618d6fbfe821";

  app.post(
    "/api/v1/webhook",
    express.raw({ type: "application/json" }),
    async (request, response) => {
      const sig = request.headers["stripe-signature"];
      let event;
  
      try {
        // Verify the webhook signature
        console.log("this is signature>>>>>>>>>>>",sig)
        // event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
        // console.log("Webhook verified successfully:", event);
  
        // Handle the event based on the event type
        switch (request.body.type) {
          case "checkout.session.async_payment_failed": {
            const checkoutSessionAsyncPaymentFailed = request.body.data.object;
            console.log("Payment failed:", checkoutSessionAsyncPaymentFailed);
            break;
          }
  
          case "checkout.session.async_payment_succeeded": {
            const checkoutSessionAsyncPaymentSucceeded = request.body.data.object;
            console.log("Payment succeeded:", checkoutSessionAsyncPaymentSucceeded);
            break;
          }
  
          case "checkout.session.completed": {
            const checkoutSessionCompleted = request.body.data.object;
            console.log("Checkout session completed:", checkoutSessionCompleted);
  
            // Extract user ID and checkout ID (fetch token)
            const appUserId = checkoutSessionCompleted.metadata?.userId; // Assume userId is in metadata
            const fetchToken = checkoutSessionCompleted.id; // Checkout session ID
            console.log("this is all id's>>>>>>>>>>>>>>>>>>", appUserId, fetchToken)
            if (!appUserId) {
              throw new Error("User ID is missing from metadata");
            }
  
            // Update funding model with payment status
            const fundId = checkoutSessionCompleted.metadata?.fundId;
            console.log("this is all id's>>>>>>>>>>>>>>>>>>", fundId)

            if (fundId) {
              await fundingModel.updateOne(
                { _id: fundId },
                {
                  $set: {
                    status: "accepted",
                    paymentStatus: "accepted",
                  },
                }
              );
            }
  
            // Prepare request body for RevenueCat API
            const revenueCatData = {
              app_user_id: appUserId,
              fetch_token: fetchToken,
            };
  
            try {
              // Make a request to RevenueCat API to add the receipt
              const revenueCatResponse = await axios.post(
                "https://api.revenuecat.com/v1/receipts",
                revenueCatData,
                {
                  headers: {
                    "Content-Type": "application/json",
                    "X-Platform": "stripe",
                    Authorization: "Bearer strp_FduUnMuHeMznmiZMVIgqTFShurF",
                  },
                }
              );
  
              console.log("RevenueCat receipt added successfully:", revenueCatResponse.data);
            } catch (error) {
              console.error("Error adding receipt to RevenueCat:", error.message);
              // Optionally handle this error or respond accordingly
            }
            break;
          }
  
          case "checkout.session.expired": {
            const checkoutSessionExpired = event.data.object;
            console.log("Session expired:", checkoutSessionExpired);
            break;
          }
  
          default:
            console.log(`Unhandled event type ${event.type}`);
        }
  
        // Return a 200 response to acknowledge receipt of the event
        response.status(200).send();
      } catch (error) {
        console.error("Error handling webhook event:", error);
        response.status(500).send(`Server Error: ${error.message}`);
      }
    }
  );
  

const server = require("http").createServer(app);

server.listen(PORT, () => {
  console.log("Server up on Port ", PORT);
});

// Log memory usage every minute
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.log(
    `Memory Usage - RSS: ${memoryUsage.rss}, Heap Total: ${memoryUsage.heapTotal}, Heap Used: ${memoryUsage.heapUsed}`
  );
}, 60000);
