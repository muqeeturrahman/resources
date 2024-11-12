const bcrypt = require("bcrypt");
const connect = require("../db/db");
const { sendEmail, sendEmailForm } = require("../config/utils");
const { User, UserContactsModel, UserCard } = require("../models/User");
const { deviceModel } = require("../models/deviceModel.js")
const { deleteRequestModel } = require("../models/deleteAccountRequestModel");
const { documentModel } = require("../models/documentModel.js")
const { SubscriptionModel } = require("../models/User");
const { questionsModel } = require("../models/questionsModel.js")
const { Content } = require("../models/ContentModel");
const { fundingModel } = require("../models/fundingModel");
const { uploadFiles } = require("../config/s3");
const cron = require('node-cron');
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_KEY);
require("dotenv").config();
var moment = require("moment");
const {
  MainEvent,
  Alarams,
  SubEvents,
  TemplatEevent,
  TemplatSubEevent,
  GeneralAlarm,
} = require("../models/CreateEvents");
const { accessTokenValidator } = require("../config/accessTokenValidator");
const { saveNetworkImage } = require("../config/saveNetworkImage");
const { push_notifications, send_notifications } = require("../config/push_notification.js");
const { uploadFile } = require("../config/s3");

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const fs = require("fs");

const AWS = require("aws-sdk");

// Configure AWS with your credentials and region
AWS.config.update({
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWS_REGION,
});

// Create an S3 instance
const s3 = new AWS.S3();
const CronJob = require("cron").CronJob;

// const fast2sms = require('fast-two-sms')
const smssid = process.env.SMS_SID;
const sms_auth_token = process.env.SMS_AUTH_TOKEN;
let userId;
let globalAuthId; // Define a global variable to store authId

// Set the authId whenever it becomes available, such as during user authentication

// Middleware to set userId from req.user
const setUserIdMiddleware = (req, res, next) => {
  globalAuthId = req.user._id; // Assuming userId is available in req.user
  console.log('Set userId:', globalUserId);

  next();
};

// Use the middleware in your application
router.use(setUserIdMiddleware);
// const twilio = require("twilio")(smssid, sms_auth_token, {
//     lazyLoading: true
// })

// User sign up
const signUp = async (req, res) => {
  try {
    if (!req.body.full_name) {
      return res
        .status(400)
        .send({ status: 0, message: "User  Name field is required" });
    } else if (!req.body.user_email) {
      return res.status(400).send({ status: 0, message: "Email is required" });
    } else if (!req.body.user_password) {
      return res
        .status(400)
        .send({ status: 0, message: "User Password field is required" });
    }
    // if (!req.body.user_phone) {
    //   return res
    //     .status(400)
    //     .send({ status: 0, message: "User Phone Number field is required" });
    // } else
    else {
      const userFind = await User.findOne({ user_email: req.body.user_email, isDeleted: false });
      if (userFind) {
        return res
          .status(400)
          .send({ status: 0, message: "User alrready exists" });
      }

      var user;
      const verificationCode = Math.floor(1000 + Math.random() * 9000);
      console.log("api is hitting till there 0");


      user = new User(req.body);
      user.user_verification_code = verificationCode;
      user = await user.save();
      await user.generateAuthToken();

      console.log("api is hitting till there 1");

      // const verificationCode = Math.floor(1000 + Math.random() * 9000);
      // user.user_verification_code = verificationCode;
      // const newUser = await user.save();

      // const customer = await stripe.customers.create({
      //     description: 'New Customer Created',
      // });

      // user.stripe_id = customer.id;

      sendEmail(user.user_email, verificationCode);

      // await twilio.messages.create({
      //     to: user.user_phone,
      //     from: process.env.SMS_FROM_NUMBER,
      //     body: `Your OTP Code is ${verificationCode}`
      // })
      const purchase = new SubscriptionModel();
      let time_now = moment(new Date()).format("YYYY-MM-DD[Z]");
      const second = new Date(time_now);
      purchase.subscribed_date = time_now;
      const SimpleMonth = second.setMonth(second.getMonth() + 1);
      purchase.expiryDate = SimpleMonth;
      purchase.plan_type = "free_monthly_plan";
      purchase.user_id = user._id;
      const inPurchase = await purchase.save();
      const updatedData = await User.findOneAndUpdate(
        { _id: user._id },
        {
          // is_member: true,
          subscription_package: inPurchase._id,
          // $push: {
          //     subscription_package: inPurchase._id
          // }
        },
        { new: true }
      );
      const FindUpdatedUser = await User.findOne({ _id: user._id }).populate(
        "subscription_package"
      );
      // let userInObjct = undefined;
      // FindUpdatedUser.map((item) => {
      //   userInObjct = item;
      // });
      const mainEvents = await TemplatEevent.insertMany([
        {
          contacts: [],
          title: "",
          select_purpose: "Buyer - Agreement Execution",
          description: "Congratulations on having your offer accepted! I'll be sending over the signed agreement for your records shortly. This is an exciting first step towards homeownership. Please inform your lender that your offer has been accepted. We’ll keep you updated with key dates and tasks to ensure everything moves forward smoothly.",
          select_interval_time: "10 Minutes",
          sub_events: [],
          recurring: "no recurring",
          select_color: "Color(0xff8bc34a)",
          status: "pending",
          isDeleted: false,
          user_id: user._id,
          order: 7,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          contacts: [],
          title: "",
          select_purpose: "Seller - Agreement Executed",
          description: "Your property offer has been accepted—excellent news! I'll send you the signed agreement shortly. We’ll ensure everything is set up for a smooth journey to settlement.",
          select_interval_time: "10 Minutes",
          sub_events: [],
          recurring: "no recurring",
          select_color: "Color(0xffff9800)",
          status: "pending",
          isDeleted: false,
          user_id: user._id,
          order: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          contacts: [],
          title: "",
          select_purpose: "Buyer - Real Estate Meeting",
          description: "I’m thrilled to meet with you and start this exciting journey toward finding your perfect home! During our meeting, I’ll provide a Consumer Notice to clarify the roles and duties in our potential real estate relationship. This document is informative, not a contract, but it will help you understand the various ways I can support you as your agent. We’ll review all necessary steps and set clear expectations for a smooth process. Looking forward to guiding you to your new home!",
          select_interval_time: "10 Minutes",
          sub_events: [],
          recurring: "no recurring",
          select_color: "Color(0xffcddc39)",
          status: "pending",
          isDeleted: false,
          user_id: user._id,
          order: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          contacts: [],
          title: "",
          select_purpose: "Seller - Real Estate Meeting",
          description: "Congratulations on taking the first step towards selling your property! I am looking forward to our meeting where I will go over the Consumer Notice that outlines our potential relationship and the duties I owe to you as a real estate agent. This notice is not a contract but a guide to help us navigate through the selling process effectively. We'll discuss all the necessary steps to ensure that we can move forward smoothly and efficiently. Excited to assist you in making this a successful sale!",
          select_interval_time: "10 Minutes",
          sub_events: [],
          recurring: "no recurring",
          select_color: "Color(0xffff5722)",
          status: "pending",
          isDeleted: false,
          user_id: user._id,
          order: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          contacts: [],
          title: "",
          select_purpose: "Appraisal Inspection & Completion",
          description: "Prepare Files for Inspection.\nBatteries Charged and Directions",
          select_interval_time: "40 Minutes",
          sub_events: [],
          recurring: "no recurring",
          select_color: "Color(0xffffeb3b)",
          status: "pending",
          isDeleted: false,
          user_id: user._id,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          contacts: [],
          title: "",
          select_purpose: "Client - Phone Call",
          description: "",
          select_interval_time: "10 Minutes",
          sub_events: [],
          recurring: "no recurring",
          select_color: "Color(0xfff44336)",
          status: "pending",
          isDeleted: false,
          user_id: user._id,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          contacts: [],
          title: "",
          select_purpose: "Personal",
          description: "Personal Time",
          select_interval_time: "10 Minutes",
          sub_events: [],
          recurring: "no recurring",
          select_color: "Color(0xff673ab7)",
          status: "pending",
          isDeleted: false,
          user_id: user._id,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      const subEvents = await TemplatSubEevent.insertMany([
        {
          main_event: mainEvents[0]._id,
          select_purpose: "Initial Deposit",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "Please prepare to make your initial deposit within the next 5 days. This deposit secures your commitment to the property and keeps our process on track.",
          select_color: "Color(0xff8bc34a)",
          no_of_days: 5,
          startTime: "9:30 AM",
          endTime: "9:35 AM",
          rank: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {

          main_event: mainEvents[0]._id,
          select_purpose: "Contact Closing Company",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "Reaching out to a closing company, will start the sale moving forward. They will verify all the information with you and initiate a title search to ensure there are no legal impediments to your ownership of the property. This is a critical step to protect your investment.",
          select_color: "Color(0xff8bc34a)",
          no_of_days: 6,
          startTime: "9:30 AM",
          endTime: "9:35 AM",
          rank: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {

          main_event: mainEvents[0]._id,
          select_purpose: "Inspection Period Ends",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "We need to complete all home inspections by this date. Following the inspections, we’ll discuss any necessary actions based on the findings.",
          select_color: "Color(0xff8bc34a)",
          no_of_days: 10,
          startTime: "9:30 AM",
          endTime: "9:35 AM",
          rank: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          main_event: mainEvents[0]._id,
          select_purpose: "Negotiate Repairs",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "Should there be any issues from the inspections, I’ll negotiate with the seller on your behalf for necessary repairs. This ensures your new home meets your expectations.",
          select_color: "Color(0xff8bc34a)",
          no_of_days: 15,
          startTime: "9:30 AM",
          endTime: "9:35 AM",
          rank: 5,
          createdAt: new Date(),
          updatedAt: new Date(),

        },
        {
          main_event: mainEvents[0]._id,
          select_purpose: "Mortgage Application",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "It's important to submit your complete mortgage application soon. This step is essential to secure your financing on time.",
          select_color: "Color(0xff8bc34a)",
          no_of_days: 7,
          startTime: "9:30 AM",
          endTime: "9:35 AM",
          rank: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {

          main_event: mainEvents[0]._id,
          select_purpose: "Mortgage Rate Lock-In",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "We will be looking to lock in your mortgage rate soon to secure a favorable interest rate for your home loan. This helps ensure your future payments are stable.",
          select_color: "Color(0xff8bc34a)",
          no_of_days: 15,
          startTime: "9:30 AM",
          endTime: "9:35 AM",
          rank: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          main_event: mainEvents[0]._id,
          select_purpose: "Document Review",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "We will go over the Settlement Statement together to ensure all financial details are correct before closing. This final review helps avoid any surprises on the closing day.\n\nPrepare to bring any legal documents or closing. Also, do not forget your ID.",
          select_color: "Color(0xff8bc34a)",
          no_of_days: 38,
          startTime: "9:30 AM",
          endTime: "9:35 AM",
          rank: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {

          main_event: mainEvents[0]._id,
          select_purpose: "Closing and Possession",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "Closing day you'll sign the final documents and receive the keys to your new home. I'm excited to help you reach this wonderful milestone!",
          select_color: "Color(0xff8bc34a)",
          no_of_days: 40,
          startTime: "9:30 AM",
          endTime: "9:35 AM",
          rank: 9,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          main_event: mainEvents[0]._id,
          select_purpose: "Final Walkthrough & Utilities",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "As we approach closing, we’ll schedule the final walkthrough and arrange the utilities to change ownership. This is your opportunity to make sure everything is as agreed upon before finalizing the purchase.",
          select_color: "ColorSwatch(primary value: Color(0xff8bc34a))",
          no_of_days: 30,
          startTime: "9:30 AM",
          endTime: "9:35 AM",
          rank: 7,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          main_event: mainEvents[1]._id,
          select_purpose: "Respond to Inspections",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "Once we receive the inspection reports, we'll need to address any concerns promptly to keep the sale moving forward",
          select_color: "Color(0xffff9800)",
          no_of_days: 10,
          startTime: "9:40 AM",
          endTime: "9:45 AM",
          rank: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          main_event: mainEvents[1]._id,
          select_purpose: "Closing Day",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "Transfer Ownership on closing day, you'll sign off on the transfer documents. It’s the final step in successfully selling your property. Congratulations on reaching this point!",
          select_color: "Color(0xffff9800)",
          no_of_days: 40,
          startTime: "9:40 AM",
          endTime: "9:45 AM",
          rank: 7,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          main_event: mainEvents[1]._id,
          select_purpose: "Finalize Documents and Utilities",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "Let’s ensure all documents are in order, settlement statement has been reviewed and utilities arrangements are ready for transfer. These final steps are crucial for a successful closing.",
          select_color: "Color(0xffff9800)",
          no_of_days: 38,
          startTime: "9:40 AM",
          endTime: "9:45 AM",
          rank: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          main_event: mainEvents[1]._id,
          select_purpose: "Final Walkthrough  & Utilities Preparation",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "We'll prepare for the final walkthrough with the buyer, ensuring the property is in the agreed condition to finalize the sale and contact the utility companies to schedule transfer of ownership.",
          select_color: "Color(0xffff9800)",
          no_of_days: 30,
          startTime: "9:40 AM",
          endTime: "9:45 AM",
          rank: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          main_event: mainEvents[1]._id,
          select_purpose: "Prepare for Inspections",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "Please prepare your property for buyer inspections. Ensuring everything is accessible and presentable will facilitate this process.",
          select_color: "Color(0xffff9800)",
          no_of_days: 5,
          startTime: "9:40 AM",
          endTime: "9:45 AM",
          rank: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          main_event: mainEvents[1]._id,
          select_purpose: "Deed Preparation",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "To start the process rolling, if you have a attorney that you would like to prepare the deed for transfer, you can reach out to them. If you do not have a desired attorney, we can recommend ones in the area or closing companies that can also prepare the deed as well.",
          select_color: "Color(0xffff9800)",
          no_of_days: 5,
          startTime: "9:40 AM",
          endTime: "9:45 AM",
          rank: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          main_event: mainEvents[1]._id,
          select_purpose: "Complete Agreed Repairs",
          select_interval_time: "10 Minutes",
          recurring: "no recurring",
          isDeleted: false,
          description: "Any repairs agreed upon with the buyer will need to be completed by this date. Prompt action here is key to maintaining the trust and momentum of the sale.",
          select_color: "Color(0xffff9800)",
          no_of_days: 20,
          startTime: "9:40 AM",
          endTime: "9:45 AM",
          rank: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      for (const subEvent of subEvents) {
        // Find the main event corresponding to this subEvent
        const mainEvent = mainEvents.find(event => event._id === subEvent.main_event);


        // If mainEvent is found, add the subEvent ID to its sub_events array
        if (mainEvent) {
          mainEvent.sub_events.push(subEvent._id);
          await mainEvent.save();
        }
      }
      if (user) {
        // const user_id = {
        //     "_id": newUser._id
        // }
        // res.status(200).send({ status: 1, message: 'User Sign Up Successfully.', data: user_id });
        // return res.status(200).send({ status: 1, message: 'User Sign Up Successfully.', data: newUser });
        // return res.status(200).send({ status: 1, message: 'User Sign Up Successfully.', data: FindUpdatedUser });
        return res.status(200).send({
          status: 1,
          message: "User Sign Up Successfully.",
          data: FindUpdatedUser,
        });
      } else {
        return res.status(200).send({
          status: 0,
          message: "Signup failed",
        });
      }
    }
  } catch (err) {
    return res.send(err.message);
    // return res.status(400).send({
    //     status: 0,
    //     message: "Email Is Invalid"
    // });
  }
};
const socialLogin = async (req, res) => {
  try {
    if (
      req.body.deviceToken &&
      req.body.accessToken &&
      req.body.deviceType &&
      req.body.userType &&
      req.body.socialType
    ) {
      return res.status(400).send({ status: 0, message: "Data is missing" });
    } else {
      const { deviceToken, deviceType, accessToken, socialType, imageURL } =
        req.body;

      switch (socialType) {
        case "facebook": {
          const checkUser = await User.findOne({
            user_email: accessToken.user_email,
          });

          if (checkUser) {
            await checkUser.generateAuthToken();
            const upatedRecord = await User.findOneAndUpdate(
              { _id: checkUser._id },
              {
                user_device_type: deviceType,
                user_device_token: deviceToken,
                user_is_verified: 1,
                isDeleted: false,
              },
              { new: true }
            );

            const FindUpdatedUser = await User.findOne({
              _id: checkUser._id,
            }).populate("subscription_package");
            return res.status(200).send({
              status: 1,
              message: "User login Successfully",
              data: FindUpdatedUser,
            });
          } else {
            const newRecord = new User();
            newRecord.user_email = accessToken.user_email;
            newRecord.full_name = accessToken.fullname;
            // newRecord.user_image = accessToken.image;
            newRecord.user_is_verified = 1;
            newRecord.user_social_type = req.body.socialType;
            newRecord.user_device_type = req.body.deviceType;
            newRecord.user_device_token = req.body.deviceToken;
            await newRecord.generateAuthToken();
            const saveLogin = await newRecord.save();
            const purchase = new SubscriptionModel();
            let time_now = moment(new Date()).format("YYYY-MM-DD[Z]");
            const second = new Date(time_now);
            purchase.subscribed_date = time_now;
            const SimpleMonth = second.setMonth(second.getMonth() + 1);
            purchase.expiryDate = SimpleMonth;
            purchase.plan_type = "free_monthly_plan";
            purchase.user_id = saveLogin._id;
            const inPurchase = await purchase.save();
            await User.findOneAndUpdate(
              { _id: saveLogin._id },
              {
                // is_member: true,
                subscription_package: inPurchase._id,
                // $push: {
                //     subscription_package: inPurchase._id
                // }
              },
              { new: true }
            );
            const FindUpdatedUser = await User.findOne({
              _id: saveLogin._id,
            }).populate("subscription_package");

            return res.status(200).send({
              status: 1,
              message: "User login successfully",
              data: FindUpdatedUser,
            });
          }
        }
        case "google": {
          const { hasError, message, data } = await accessTokenValidator(
            accessToken,
            socialType
          );
          if (hasError) {
            return res.status(400).send({
              status: 0,
              message: message,
            });
          }

          const checkUser = await User.findOne({
            user_email: data.email,
            isDeleted: false
          });
          if (!checkUser) {
            if (imageURL) {
              const { hasError, message, image } = await saveNetworkImage(
                imageURL
              );
              if (!hasError) {
                data.image = image;
              } else {
                data.image = "";
              }
            } else {
              data.image = "";
            }
            const { name, email, image } = data;

            const newRecord = new User();
            newRecord.user_image = image;
            newRecord.user_email = email;
            newRecord.full_name = name;
            newRecord.user_is_verified = 1;
            newRecord.user_social_type = req.body.socialType;
            newRecord.user_device_type = req.body.deviceType;
            newRecord.user_device_token = req.body.deviceToken;

            await newRecord.generateAuthToken();
            const saveLogin = await newRecord.save();

            const purchase = new SubscriptionModel();
            let time_now = moment(new Date()).format("YYYY-MM-DD[Z]");
            const second = new Date(time_now);
            purchase.subscribed_date = time_now;
            const SimpleMonth = second.setMonth(second.getMonth() + 1);
            purchase.expiryDate = SimpleMonth;
            purchase.plan_type = "free_monthly_plan";
            purchase.user_id = saveLogin._id;
            const inPurchase = await purchase.save();
            let user = await User.findOneAndUpdate(
              { _id: saveLogin._id },
              {
                // is_member: true,
                subscription_package: inPurchase._id,
                // $push: {
                //     subscription_package: inPurchase._id
                // }
              },
              { new: true }
            );
            const FindUpdatedUser = await User.findOne({
              _id: saveLogin._id,
            }).populate("subscription_package");
            const mainEvents = await TemplatEevent.insertMany([
              {
                contacts: [],
                title: "",
                select_purpose: "Buyer - Agreement Execution",
                description: "Congratulations on having your offer accepted! I'll be sending over the signed agreement for your records shortly. This is an exciting first step towards homeownership. Please inform your lender that your offer has been accepted. We’ll keep you updated with key dates and tasks to ensure everything moves forward smoothly.",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xff8bc34a)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 7,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Seller - Agreement Executed",
                description: "Your property offer has been accepted—excellent news! I'll send you the signed agreement shortly. We’ll ensure everything is set up for a smooth journey to settlement.",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xffff9800)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 6,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Buyer - Real Estate Meeting",
                description: "I’m thrilled to meet with you and start this exciting journey toward finding your perfect home! During our meeting, I’ll provide a Consumer Notice to clarify the roles and duties in our potential real estate relationship. This document is informative, not a contract, but it will help you understand the various ways I can support you as your agent. We’ll review all necessary steps and set clear expectations for a smooth process. Looking forward to guiding you to your new home!",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xffcddc39)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Seller - Real Estate Meeting",
                description: "Congratulations on taking the first step towards selling your property! I am looking forward to our meeting where I will go over the Consumer Notice that outlines our potential relationship and the duties I owe to you as a real estate agent. This notice is not a contract but a guide to help us navigate through the selling process effectively. We'll discuss all the necessary steps to ensure that we can move forward smoothly and efficiently. Excited to assist you in making this a successful sale!",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xffff5722)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Appraisal Inspection & Completion",
                description: "Prepare Files for Inspection.\nBatteries Charged and Directions",
                select_interval_time: "40 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xffffeb3b)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Client - Phone Call",
                description: "",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xfff44336)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Personal",
                description: "Personal Time",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xff673ab7)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ])
            const subEvents = await TemplatSubEevent.insertMany([
              {
                main_event: mainEvents[0]._id,
                select_purpose: "Initial Deposit",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Please prepare to make your initial deposit within the next 5 days. This deposit secures your commitment to the property and keeps our process on track.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 5,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {

                main_event: mainEvents[0]._id,
                select_purpose: "Contact Closing Company",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Reaching out to a closing company, will start the sale moving forward. They will verify all the information with you and initiate a title search to ensure there are no legal impediments to your ownership of the property. This is a critical step to protect your investment.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 6,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 6,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {

                main_event: mainEvents[0]._id,
                select_purpose: "Inspection Period Ends",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "We need to complete all home inspections by this date. Following the inspections, we’ll discuss any necessary actions based on the findings.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 10,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[0]._id,
                select_purpose: "Negotiate Repairs",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Should there be any issues from the inspections, I’ll negotiate with the seller on your behalf for necessary repairs. This ensures your new home meets your expectations.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 15,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 5,
                createdAt: new Date(),
                updatedAt: new Date(),

              },
              {
                main_event: mainEvents[0]._id,
                select_purpose: "Mortgage Application",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "It's important to submit your complete mortgage application soon. This step is essential to secure your financing on time.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 7,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {

                main_event: mainEvents[0]._id,
                select_purpose: "Mortgage Rate Lock-In",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "We will be looking to lock in your mortgage rate soon to secure a favorable interest rate for your home loan. This helps ensure your future payments are stable.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 15,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[0]._id,
                select_purpose: "Document Review",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "We will go over the Settlement Statement together to ensure all financial details are correct before closing. This final review helps avoid any surprises on the closing day.\n\nPrepare to bring any legal documents or closing. Also, do not forget your ID.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 38,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 8,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {

                main_event: mainEvents[0]._id,
                select_purpose: "Closing and Possession",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Closing day you'll sign the final documents and receive the keys to your new home. I'm excited to help you reach this wonderful milestone!",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 40,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 9,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[0]._id,
                select_purpose: "Final Walkthrough & Utilities",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "As we approach closing, we’ll schedule the final walkthrough and arrange the utilities to change ownership. This is your opportunity to make sure everything is as agreed upon before finalizing the purchase.",
                select_color: "ColorSwatch(primary value: Color(0xff8bc34a))",
                no_of_days: 30,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 7,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Respond to Inspections",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Once we receive the inspection reports, we'll need to address any concerns promptly to keep the sale moving forward",
                select_color: "Color(0xffff9800)",
                no_of_days: 10,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Closing Day",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Transfer Ownership on closing day, you'll sign off on the transfer documents. It’s the final step in successfully selling your property. Congratulations on reaching this point!",
                select_color: "Color(0xffff9800)",
                no_of_days: 40,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 7,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Finalize Documents and Utilities",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Let’s ensure all documents are in order, settlement statement has been reviewed and utilities arrangements are ready for transfer. These final steps are crucial for a successful closing.",
                select_color: "Color(0xffff9800)",
                no_of_days: 38,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 6,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Final Walkthrough  & Utilities Preparation",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "We'll prepare for the final walkthrough with the buyer, ensuring the property is in the agreed condition to finalize the sale and contact the utility companies to schedule transfer of ownership.",
                select_color: "Color(0xffff9800)",
                no_of_days: 30,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Prepare for Inspections",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Please prepare your property for buyer inspections. Ensuring everything is accessible and presentable will facilitate this process.",
                select_color: "Color(0xffff9800)",
                no_of_days: 5,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Deed Preparation",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "To start the process rolling, if you have a attorney that you would like to prepare the deed for transfer, you can reach out to them. If you do not have a desired attorney, we can recommend ones in the area or closing companies that can also prepare the deed as well.",
                select_color: "Color(0xffff9800)",
                no_of_days: 5,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Complete Agreed Repairs",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Any repairs agreed upon with the buyer will need to be completed by this date. Prompt action here is key to maintaining the trust and momentum of the sale.",
                select_color: "Color(0xffff9800)",
                no_of_days: 20,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ])
            for (const subEvent of subEvents) {
              // Find the main event corresponding to this subEvent
              const mainEvent = mainEvents.find(event => event._id === subEvent.main_event);


              // If mainEvent is found, add the subEvent ID to its sub_events array
              if (mainEvent) {
                mainEvent.sub_events.push(subEvent._id);
                await mainEvent.save();
              }
            }
            return res.status(200).send({
              status: 1,
              message: "User login successfully",
              data: FindUpdatedUser,
            });
          } else {
            // if (checkUser.user_image != data.image) {
            //   if (imageURL) {

            //     const { hasError, message, image } = await saveNetworkImage(imageURL);
            //     if (!hasError) {
            //       data.image = image
            //     } else {
            //       data.image = checkUser.user_image

            //     }
            //   } else {
            //     data.image = checkUser.user_image

            //   }
            // }
            // const { image } = data;

            await checkUser.generateAuthToken();
            const upatedRecord = await User.findOneAndUpdate(
              { _id: checkUser._id },
              {
                user_device_type: req.body.user_device_type,
                user_device_token: req.body.user_device_token,
                user_is_verified: 1,
                isDeleted: false,
                // user_image: image
              },
              { new: true }
            );
            const FindUpdatedUser = await User.findOne({
              _id: checkUser._id,
            }).populate("subscription_package");

            return res.status(200).send({
              status: 1,
              message: "User login Successfully",
              data: FindUpdatedUser,
            });
          }
        }
        case "apple": {
          const checkUser = await User.findOne({
            user_email: accessToken.email,
            isDeleted: false
          });

          if (checkUser) {
            // if (accessToken.photoURL != null) {

            //   const { hasError, message, image } = await saveNetworkImage(accessToken.photoURL);
            //   if (!hasError) {
            //     accessToken.photoURL = image
            //   }
            // }
            await checkUser.generateAuthToken();
            const upatedRecord = await User.findOneAndUpdate(
              { _id: checkUser._id },
              {
                user_device_type: deviceType,
                user_device_token: deviceToken,
                user_is_verified: 1,
                isDeleted: false,
              },
              { new: true }
            );
            // user_image:accessToken.photoURL?accessToken.photoURL:checkUser.user_image

            const FindUpdatedUser = await User.findOne({
              _id: checkUser._id,
            }).populate("subscription_package");
            return res.status(200).send({
              status: 1,
              message: "User login Successfully",
              data: FindUpdatedUser,
            });
          } else {
            if (accessToken.photoURL != null) {
              const { hasError, message, image } = await saveNetworkImage(
                accessToken.photoURL
              );
              if (!hasError) {
                accessToken.photoURL = image;
              }
            }

            const newRecord = new User();
            newRecord.user_email = accessToken.email;
            newRecord.full_name = accessToken.username;
            newRecord.phone = accessToken.phoneNumber;
            newRecord.user_image = accessToken.photoURL
              ? accessToken.photoURL
              : "";

            newRecord.user_is_verified = 1;
            newRecord.user_social_type = req.body.socialType;
            newRecord.user_device_type = req.body.deviceType;
            newRecord.user_device_token = req.body.deviceToken;
            await newRecord.generateAuthToken();
            const saveLogin = await newRecord.save();
            const purchase = new SubscriptionModel();
            let time_now = moment(new Date()).format("YYYY-MM-DD[Z]");
            const second = new Date(time_now);
            purchase.subscribed_date = time_now;
            const SimpleMonth = second.setMonth(second.getMonth() + 1);
            purchase.expiryDate = SimpleMonth;
            purchase.plan_type = "free_monthly_plan";
            purchase.user_id = saveLogin._id;
            const inPurchase = await purchase.save();
            let user = await User.findOneAndUpdate(
              { _id: saveLogin._id },
              {
                // is_member: true,
                subscription_package: inPurchase._id,
                // $push: {
                //     subscription_package: inPurchase._id
                // }
              },
              { new: true }
            );
            const FindUpdatedUser = await User.findOne({
              _id: saveLogin._id,
            }).populate("subscription_package");
            const mainEvents = await TemplatEevent.insertMany([
              {
                contacts: [],
                title: "",
                select_purpose: "Buyer - Agreement Execution",
                description: "Congratulations on having your offer accepted! I'll be sending over the signed agreement for your records shortly. This is an exciting first step towards homeownership. Please inform your lender that your offer has been accepted. We’ll keep you updated with key dates and tasks to ensure everything moves forward smoothly.",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xff8bc34a)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 7,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Seller - Agreement Executed",
                description: "Your property offer has been accepted—excellent news! I'll send you the signed agreement shortly. We’ll ensure everything is set up for a smooth journey to settlement.",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xffff9800)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 6,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Buyer - Real Estate Meeting",
                description: "I’m thrilled to meet with you and start this exciting journey toward finding your perfect home! During our meeting, I’ll provide a Consumer Notice to clarify the roles and duties in our potential real estate relationship. This document is informative, not a contract, but it will help you understand the various ways I can support you as your agent. We’ll review all necessary steps and set clear expectations for a smooth process. Looking forward to guiding you to your new home!",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xffcddc39)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Seller - Real Estate Meeting",
                description: "Congratulations on taking the first step towards selling your property! I am looking forward to our meeting where I will go over the Consumer Notice that outlines our potential relationship and the duties I owe to you as a real estate agent. This notice is not a contract but a guide to help us navigate through the selling process effectively. We'll discuss all the necessary steps to ensure that we can move forward smoothly and efficiently. Excited to assist you in making this a successful sale!",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xffff5722)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Appraisal Inspection & Completion",
                description: "Prepare Files for Inspection.\nBatteries Charged and Directions",
                select_interval_time: "40 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xffffeb3b)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Client - Phone Call",
                description: "",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xfff44336)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                contacts: [],
                title: "",
                select_purpose: "Personal",
                description: "Personal Time",
                select_interval_time: "10 Minutes",
                sub_events: [],
                recurring: "no recurring",
                select_color: "Color(0xff673ab7)",
                status: "pending",
                isDeleted: false,
                user_id: user._id,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ])
            const subEvents = await TemplatSubEevent.insertMany([
              {
                main_event: mainEvents[0]._id,
                select_purpose: "Initial Deposit",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Please prepare to make your initial deposit within the next 5 days. This deposit secures your commitment to the property and keeps our process on track.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 5,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {

                main_event: mainEvents[0]._id,
                select_purpose: "Contact Closing Company",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Reaching out to a closing company, will start the sale moving forward. They will verify all the information with you and initiate a title search to ensure there are no legal impediments to your ownership of the property. This is a critical step to protect your investment.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 6,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 6,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {

                main_event: mainEvents[0]._id,
                select_purpose: "Inspection Period Ends",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "We need to complete all home inspections by this date. Following the inspections, we’ll discuss any necessary actions based on the findings.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 10,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[0]._id,
                select_purpose: "Negotiate Repairs",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Should there be any issues from the inspections, I’ll negotiate with the seller on your behalf for necessary repairs. This ensures your new home meets your expectations.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 15,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 5,
                createdAt: new Date(),
                updatedAt: new Date(),

              },
              {
                main_event: mainEvents[0]._id,
                select_purpose: "Mortgage Application",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "It's important to submit your complete mortgage application soon. This step is essential to secure your financing on time.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 7,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {

                main_event: mainEvents[0]._id,
                select_purpose: "Mortgage Rate Lock-In",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "We will be looking to lock in your mortgage rate soon to secure a favorable interest rate for your home loan. This helps ensure your future payments are stable.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 15,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[0]._id,
                select_purpose: "Document Review",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "We will go over the Settlement Statement together to ensure all financial details are correct before closing. This final review helps avoid any surprises on the closing day.\n\nPrepare to bring any legal documents or closing. Also, do not forget your ID.",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 38,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 8,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {

                main_event: mainEvents[0]._id,
                select_purpose: "Closing and Possession",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Closing day you'll sign the final documents and receive the keys to your new home. I'm excited to help you reach this wonderful milestone!",
                select_color: "Color(0xff8bc34a)",
                no_of_days: 40,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 9,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[0]._id,
                select_purpose: "Final Walkthrough & Utilities",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "As we approach closing, we’ll schedule the final walkthrough and arrange the utilities to change ownership. This is your opportunity to make sure everything is as agreed upon before finalizing the purchase.",
                select_color: "ColorSwatch(primary value: Color(0xff8bc34a))",
                no_of_days: 30,
                startTime: "9:30 AM",
                endTime: "9:35 AM",
                rank: 7,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Respond to Inspections",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Once we receive the inspection reports, we'll need to address any concerns promptly to keep the sale moving forward",
                select_color: "Color(0xffff9800)",
                no_of_days: 10,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Closing Day",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Transfer Ownership on closing day, you'll sign off on the transfer documents. It’s the final step in successfully selling your property. Congratulations on reaching this point!",
                select_color: "Color(0xffff9800)",
                no_of_days: 40,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 7,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Finalize Documents and Utilities",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Let’s ensure all documents are in order, settlement statement has been reviewed and utilities arrangements are ready for transfer. These final steps are crucial for a successful closing.",
                select_color: "Color(0xffff9800)",
                no_of_days: 38,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 6,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Final Walkthrough  & Utilities Preparation",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "We'll prepare for the final walkthrough with the buyer, ensuring the property is in the agreed condition to finalize the sale and contact the utility companies to schedule transfer of ownership.",
                select_color: "Color(0xffff9800)",
                no_of_days: 30,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Prepare for Inspections",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Please prepare your property for buyer inspections. Ensuring everything is accessible and presentable will facilitate this process.",
                select_color: "Color(0xffff9800)",
                no_of_days: 5,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Deed Preparation",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "To start the process rolling, if you have a attorney that you would like to prepare the deed for transfer, you can reach out to them. If you do not have a desired attorney, we can recommend ones in the area or closing companies that can also prepare the deed as well.",
                select_color: "Color(0xffff9800)",
                no_of_days: 5,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                main_event: mainEvents[1]._id,
                select_purpose: "Complete Agreed Repairs",
                select_interval_time: "10 Minutes",
                recurring: "no recurring",
                isDeleted: false,
                description: "Any repairs agreed upon with the buyer will need to be completed by this date. Prompt action here is key to maintaining the trust and momentum of the sale.",
                select_color: "Color(0xffff9800)",
                no_of_days: 20,
                startTime: "9:40 AM",
                endTime: "9:45 AM",
                rank: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ])
            for (const subEvent of subEvents) {
              // Find the main event corresponding to this subEvent
              const mainEvent = mainEvents.find(event => event._id === subEvent.main_event);


              // If mainEvent is found, add the subEvent ID to its sub_events array
              if (mainEvent) {
                mainEvent.sub_events.push(subEvent._id);
                await mainEvent.save();
              }
            }
            return res.status(200).send({
              status: 1,
              message: "User login successfully",
              data: FindUpdatedUser,
            });
          }
        }
      }
      // if (socialType == "facebook") {
      //   const checkUser = await User.findOne({
      //     user_email: accessToken.user_email,
      //   });

      //   if (checkUser) {
      //     await checkUser.generateAuthToken();
      //     const upatedRecord = await User.findOneAndUpdate(
      //       { _id: checkUser._id },
      //       {
      //         user_device_type: deviceType,
      //         user_device_token: deviceToken,
      //         user_is_verified: 1,
      //       },
      //       { new: true }
      //     );

      //     const FindUpdatedUser = await User.findOne({
      //       _id: checkUser._id,
      //     }).populate("subscription_package");
      //     return res.status(200).send({
      //       status: 1,
      //       message: "User login Successfully",
      //       data: FindUpdatedUser,
      //     });
      //   } else {
      //     const newRecord = new User();
      //     newRecord.user_email = accessToken.user_email;
      //     newRecord.full_name = accessToken.fullname;
      //     newRecord.user_image = accessToken.image;
      //     newRecord.user_is_verified = 1;
      //     newRecord.user_social_type = req.body.socialType;
      //     newRecord.user_device_type = req.body.deviceType;
      //     newRecord.user_device_token = req.body.deviceToken;
      //     await newRecord.generateAuthToken();
      //     const saveLogin = await newRecord.save();
      //     const purchase = new SubscriptionModel();
      //     let time_now = moment(new Date()).format("YYYY-MM-DD[Z]");
      //     const second = new Date(time_now);
      //     purchase.subscribed_date = time_now;
      //     const SimpleMonth = second.setMonth(second.getMonth() + 1);
      //     purchase.expiryDate = SimpleMonth;
      //     purchase.plan_type = "free_monthly_plan";
      //     purchase.user_id = saveLogin._id;
      //     const inPurchase = await purchase.save();
      //     await User.findOneAndUpdate(
      //       { _id: saveLogin._id },
      //       {
      //         // is_member: true,
      //         subscription_package: inPurchase._id,
      //         // $push: {
      //         //     subscription_package: inPurchase._id
      //         // }
      //       },
      //       { new: true }
      //     );
      //     const FindUpdatedUser = await User.findOne({
      //       _id: saveLogin._id,
      //     }).populate("subscription_package");

      //     return res.status(200).send({
      //       status: 1,
      //       message: "User login successfully",
      //       data: FindUpdatedUser,
      //     });
      //   }
      // } else {

      //   const { hasError, message, data } = await accessTokenValidator(
      //     accessToken,
      //     socialType
      //   );
      //   console.log(data);

      //   if (hasError) {
      //     return res.status(400).send({
      //       status: 0,
      //       message: message,
      //     });
      //   }
      //   const { name, image, email } = data;

      //   const checkUser = await User.findOne({
      //     user_email: email,
      //   });
      //   if (!checkUser) {
      //     const newRecord = new User();
      //     (newRecord.user_image = image),
      //       (newRecord.user_email = email),
      //       (newRecord.full_name = name),
      //       (newRecord.user_is_verified = 1);
      //     newRecord.user_social_type = req.body.socialType;
      //     newRecord.user_device_type = req.body.deviceType;
      //     newRecord.user_device_token = req.body.deviceToken;
      //     await newRecord.generateAuthToken();
      //     const saveLogin = await newRecord.save();

      //     const purchase = new SubscriptionModel();
      //     let time_now = moment(new Date()).format("YYYY-MM-DD[Z]");
      //     const second = new Date(time_now);
      //     purchase.subscribed_date = time_now;
      //     const SimpleMonth = second.setMonth(second.getMonth() + 1);
      //     purchase.expiryDate = SimpleMonth;
      //     purchase.plan_type = "free_monthly_plan";
      //     purchase.user_id = saveLogin._id;
      //     const inPurchase = await purchase.save();
      //     await User.findOneAndUpdate(
      //       { _id: saveLogin._id },
      //       {
      //         // is_member: true,
      //         subscription_package: inPurchase._id,
      //         // $push: {
      //         //     subscription_package: inPurchase._id
      //         // }
      //       },
      //       { new: true }
      //     );
      //     const FindUpdatedUser = await User.findOne({
      //       _id: saveLogin._id,
      //     }).populate("subscription_package");

      //     return res.status(200).send({
      //       status: 1,
      //       message: "User login successfully",
      //       data: FindUpdatedUser,
      //     });
      //   } else {
      //     await checkUser.generateAuthToken();
      //     const upatedRecord = await User.findOneAndUpdate(
      //       { _id: checkUser._id },
      //       {
      //         user_device_type: req.body.user_device_type,
      //         user_device_token: req.body.user_device_token,
      //         user_is_verified: 1,
      //       },
      //       { new: true }
      //     );
      //     const FindUpdatedUser = await User.findOne({
      //       _id: checkUser._id,
      //     }).populate("subscription_package");

      //     return res.status(200).send({
      //       status: 1,
      //       message: "User login Successfully",
      //       data: FindUpdatedUser,
      //     });
      //   }
      // }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const user_verification = async (req, res) => {
  try {
    // if (!req.body.user_verification_code) {
    //    return res.status(400).send({ status: 0, message: 'Verification Code field is Required' })
    // }
    // else {

    const userFind = await User.findOne({
      _id: req.body.user_id,
      isDeleted: false,
      user_verification_code: req.body.user_verification_code,
    });

    // const verification_code = 1234;
    // const userFind = await User.findOne({ _id: req.body.user_id, user_verification_code: verification_code });

    if (userFind) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.body.user_id },
        { user_is_verified: 1, user_verification_code: null }
      );
      if (updatedUser) {
        const updatedUserFind = await User.findOne({
          _id: req.body.user_id,
        }).populate("subscription_package");
        await updatedUserFind.generateAuthToken();
        return res.status(200).send({
          status: 1,
          message: "Successfully verified account",
          data: updatedUserFind,
        });
      }
    } else {
      return res.status(400).send({ status: 0, message: "No Record Found." });
    }

    // }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const getContactById = async (req, res) => {
  try {
    const { id } = req.params
    const contact = await UserContactsModel.findById(id)
    return res.status(200).send({
      status: 1,
      message: "contact",
      data: contact
    });
  }
  catch (err) {
    return res.send(err.message);
  }
}
// // Here user login with checking of subscription package
// const userLogin = async (req, res) => {
//     try {

//         // const alreadyUserAsSocialToke = await User.findOne({ user_email: req.body.user_email })

//         // if (alreadyUserAsSocialToke) {
//         //     if (alreadyUserAsSocialToke.user_type !== req.body.user_type) {
//         //         return res.status(400).send({ status: 0, message: "Invalid User Type!" });
//         //     }
//         // }

//         const userFind = await User.findOne({ user_email: req.body.user_email })

//         const userVerification = userFind?.user_is_verified
//         const userisDeactivate = userFind?.isDeactivate
//         const is_member_subscription = userFind?.is_member

//         if (userVerification == 0) {
//             // if (alreadyUser.user_type !== req.body.user_type) {
//             return res.status(400).send({ status: 0, message: "Verify your account first!" });
//             // }
//         } else if (userisDeactivate == true) {
//             return res.status(400).send({ status: 0, message: "Your account is Deactivate!" });
//         } else if (!req.body.user_email) {
//             return res.status(400).send({ status: 0, message: 'User Email field is required' });
//         }
//         else if (!req.body.user_password) {
//             return res.status(400).send({ status: 0, message: 'Password field is required' });
//         }

//         if (is_member_subscription == false) {

//             return res.status(400).send({
//                 status: 0,
//                 message: "Please Subscribed Your Account First!",
//             });
//         }

//         if (is_member_subscription == true) {

//             if (userFind) {

//                 const userPackageModel = await SubscriptionModel.find({ user_id: userFind._id })

//                 let userPackageExpiryDate = ""
//                 userPackageModel.map((item) => {
//                     // userPackageExpiryDate = item.expiryDate
//                     userPackageExpiryDate = moment.utc(item.expiryDate).format("YYYY-MM-DD")
//                 })

//                 // const presentDateWithOutTime = moment
//                 //     .utc(new Date().toISOString().slice(0, 10))
//                 //     .format("YYYY-MM-DD");
//                 const presentDateWithOutTime = moment(new Date()).format("YYYY-MM-DD");
//                 // let time_now = moment(new Date().slice(0, 10)).format("YYYY-MM-DD[Z]");

//                 if (presentDateWithOutTime >= userPackageExpiryDate) {

//                     const updateStatus = await User.findOneAndUpdate(
//                         { _id: userFind._id },
//                         {
//                             is_member: false,
//                         },
//                         { new: true }
//                     );
//                     return res.status(400).send({
//                         status: 0,
//                         message: "Please Subscribed Your Account First!",
//                         // data: userFind,
//                     });
//                 }
//             }

//             // logIn process
//             const user = await User.findOne({ user_email: req.body.user_email });
//             if (!user) {
//                 return res.status(400).send({ status: 0, message: 'Email not found!' });
//             }
//             const isMatch = await bcrypt.compare(req.body.user_password, user.user_password);
//             if (!isMatch) {
//                 return res.status(400).send({ status: 0, message: 'You have entered wrong password' });
//             }
//             await user.generateAuthToken();
//             const updateUser = await User.findOneAndUpdate({ _id: user._id }, {
//                 user_device_type: req.body.user_device_type,
//                 user_device_token: req.body.user_device_token
//             }, { new: true });
//             return res.status(200).send({ status: 1, message: 'User login successfully', data: updateUser });

//         }

//     } catch (e) {

//         return res.status(400).send({ status: 0, message: e.message });;
//     }

// }

// Here user login
const userVerification = async (req, res) => {
  try {
    // if (!req.body.user_verification_code) {
    //    return res.status(400).send({ status: 0, message: 'Verification Code field is Required' })
    // }
    // else {

    const userFind = await User.findOne({
      user_email: req.body.user_email,
      isDeleted: false,
      user_verification_code: req.body.user_verification_code,
    });

    // const verification_code = 1234;
    // const userFind = await User.findOne({ _id: req.body.user_id, user_verification_code: verification_code });

    if (userFind) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: userFind._id },
        { user_is_verified: 1, user_verification_code: null }
      );
      if (updatedUser) {
        const updatedUserFind = await User.findOne({
          _id: userFind._id,
        }).populate("subscription_package");
        await updatedUserFind.generateAuthToken();
        return res.status(200).send({
          status: 1,
          message: "Successfully verified account",
          data: updatedUserFind,
        });
      }
    } else {
      return res.status(400).send({ status: 0, message: "No Record Found." });
    }

    // }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const checkUpcomingPayments = async () => {
  try {

    const pendingFunds = await fundingModel.find({
      $or: [{ status: "pending" }, { status: "rejected" }]
    }).populate({
      path: "user_id",
      select: "_id full_name notification is_notification user_device_token"
    });
    console.log(pendingFunds)
    let date1 = new Date().toISOString();
    console.log("date1>> ", date1);
    let currentDate = new Date().toISOString().slice(0, 10);
    console.log("date:", `${currentDate}`);
    console.log("api is hitting till there");
    pendingFunds.map((e) => {
      let datePart = e.createdAt.toISOString().slice(0, 10)
      // console.log("DATEPART",datePart);
      console.log("just checking map", e.createdAt);
      if (e.date) {
        console.log("e.date=====>", e.date);
        console.log("currentDate=====>", currentDate);
        console.log("datePart>>", datePart);
        if (e.date == currentDate) {
          let notification_obj = {
            user_device_token: e.user_id.user_device_token,
            title: e.user_id.full_name,
            body: "You have an upcoming payment",
            type: "upcoming Payment",

          };
          if (e.user_id.notification == "on" || e.user_id.is_notification == 1) {

            console.log("checking", e.user_id.user_device_token,);
            push_notifications(notification_obj)
          }
        }
      }

      else {
        if (datePart == currentDate) {

          let notification_obj = {
            user_device_token: e.user_id.user_device_token,
            title: e.user_id.full_name,
            body: "You have an upcoming payment",
            type: "upcoming Payment",

          };
          if (e.user_id.notification == "on" || e.user_id.is_notification == 1) {

            console.log("checking", e.user_id.user_device_token,);
            push_notifications(notification_obj)
          }
        }
      }
    })
  } catch (error) {
    console.error("Error in checking upcoming payments:", error);
  }
};

// Schedule the cron job to run daily at 8:00 AM
cron.schedule('15 0 * * *', async () => {

  console.log('Running checkUpcomingPayments cron job at 5:20 PM...');
  await checkUpcomingPayments();
});

const userLogin = async (req, res) => {
  try {
    console.log("user is logging");
    console.log("sssssssssssssssssssssssssssssssssssssssssssssssssssssss");

    const { user_email, user_password, user_device_type, user_device_token } = req.body;

    // Check for required fields
    if (!user_email) {
      return res.status(400).send({ status: 0, message: "User Email field is required" });
    }
    if (!user_password) {
      return res.status(400).send({ status: 0, message: "Password field is required" });
    }

    // Fetch user from the database
    const alreadyUser = await User.findOne({ user_email, isDeleted: false });
    if (!alreadyUser) {
      return res.status(400).send({ status: 0, message: "Email not found! or your account is deleted" });
    }

    const { user_is_verified, isDeactivate, user_password: storedPassword } = alreadyUser;

    // Check user verification and deactivation status
    if (!user_is_verified) {
      return res.status(400).send({ status: 0, message: "Verify your account first!" });
    }
    if (isDeactivate) {
      return res.status(400).send({ status: 0, message: "Your account is Deactivated!" });
    }

    // If user has no password (e.g., social login), generate token and update device info
    if (!storedPassword) {
      await alreadyUser.generateAuthToken();
      const updateUser = await User.findOneAndUpdate(
        { _id: alreadyUser._id },
        { user_device_type, user_device_token },
        { new: true }
      ).populate("subscription_package");

      return res.status(200).send({
        status: 1,
        message: "User login successfully",
        data: updateUser,
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(user_password, storedPassword);
    if (!isMatch) {
      return res.status(400).send({ status: 0, message: "You have entered wrong password" });
    }

    // Generate auth token and update device info
    await alreadyUser.generateAuthToken();
    const updateUser = await User.findOneAndUpdate(
      { _id: alreadyUser._id },
      { user_device_type, user_device_token },
      { new: true }
    ).populate("subscription_package");

    return res.status(200).send({
      status: 1,
      message: "User login successfully",
      data: updateUser,
    });

  } catch (e) {
    console.error("Error during user login:", e);
    return res.status(500).send({ status: 0, message: "Internal Server Error" });
  }
};


const settoken = async (req, res) => {
  try {
    const { user_device_token, user_device_type } = req.body;
    let device;
    let updateUser;
    let dev = await deviceModel.findOne({ deviceToken: user_device_token, user: req.user._id })
    if (user_device_token) {

      if (!dev) {
        device = await deviceModel.create({
          user: req.user._id,
          deviceType: user_device_type,
          deviceToken: user_device_token
        })
      }
    }
    if (user_device_token && !dev) {

      updateUser = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $push: { devices: device._id } },
        { new: true }
      ).populate("subscription_package");
    } else {
      updateUser = await User.findOne(
        { _id: req.user._id },
      ).populate("subscription_package");
    }

    return res.status(200).send({
      status: 1,
      message: "User token updated",
      data: updateUser,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
// Here user Forget Password
const userForgotPassword = async (req, res) => {
  try {
    if (!req.body.user_email) {
      return res
        .status(400)
        .send({ status: 0, message: "User Email field is required" });
    } else {
      const userFind = await User.findOne({
        user_email: req.body.user_email,
        isDeleted: false,
      });

      if (userFind) {
        const verificationCode = Math.floor(1000 + Math.random() * 9000);
        // const verificationCode = 1234
        const updatedUser = await User.findOneAndUpdate(
          { _id: userFind._id, isDeleted: false },
          { user_verification_code: verificationCode },
          { new: true }
        );
        sendEmail(userFind.user_email, verificationCode);
        // await twilio.messages.create({
        //     to: userFind.user_phone,
        //     from: process.env.SMS_FROM_NUMBER,
        //     body: `Your OTP Code is ${verificationCode}`
        // })

        let user_verification_code = updatedUser.user_verification_code;
        const userObj = {
          _id: userFind._id,
          user_verification_code: user_verification_code,
        };
        // res.status(200).send({ status: 1, message: 'Verification Code Send please check your email.', data: updatedUser });
        return res.status(200).send({
          status: 1,
          message: "Verification Code sent. Please Check your email address",
          data: userObj,
        });
      } else {
        return res.status(400).send({ status: 0, message: "Email not found!" });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

// Here user Reset Password
const resetPassword = async (req, res) => {
  try {
    if (!req.body.user_email) {
      return res
        .status(400)
        .send({ status: 0, message: "User Email field is required" });
    } else if (!req.body.new_password) {
      return res
        .status(400)
        .send({ status: 0, message: "User New Password Field is required" });
    }
    //  else if (!req.body.confirm_password) {
    //     return res.status(400).send({ status: 0, message: 'Confirm Password field is required' });
    // } else if (req.body.new_password != req.body.confirm_password) {
    //     return res.status(400).send({ status: 0, message: 'New and Confirm Password does not match!' });
    // }
    else {
      // // const userFind = await User.findOne({ user_email: req.body.user_email, user_verification_code: req.body.user_verification_code });
      const userFind = await User.findOne({
        user_email: req.body.user_email,
        isDeleted: false,
      });

      // if (userFind) {
      //     const newPassword = await bcrypt.hash(req.body.new_password, 8);
      //     const updateUser = await User.findOneAndUpdate({ _id: userFind._id }, {
      //         user_password: newPassword,
      //         // user_verification_code: null
      //     });
      //     return res.status(200).send({ status: 1, message: 'Your password has changed successfully' });
      // }
      // else {
      //     return res.status(400).send({ status: 0, message: 'User not found!' });

      // }

      if (userFind) {
        const oldPassword = await bcrypt.compare(
          req.body.old_password,
          userFind.user_password
        );

        if (userFind && oldPassword == true) {
          const newPassword = await bcrypt.hash(req.body.new_password, 8);
          // await User.findOneAndUpdate({ _id: req.body.user_id }, { user_password: newPassword });
          await User.findOneAndUpdate(
            { _id: userFind._id },
            { user_password: newPassword }
          );
          // res.send({ status: 1, message: 'New password Update Successfully.' });
          return res
            .status(200)
            .send({ status: 1, message: "New Password Update Successfully." });
        } else {
          return res.send({
            status: 0,
            message: "You have entered old password wrong!",
          });
        }
      } else {
        return res.status(400).send({ status: 0, message: "User not found!" });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const SetnewPassAfterForget = async (req, res) => {
  try {
    if (!req.body.user_email) {
      res
        .status(400)
        .send({ status: 0, message: "User Email field is required" });
    }
    // else if (!req.body.user_verification_code) {
    //     res.status(400).send({ status: 0, message: 'User Verification Field is required' });
    // }
    else if (!req.body.new_password) {
      res
        .status(400)
        .send({ status: 0, message: "User New Password Field is required" });
    } else {
      // const userFind = await User.findOne({ user_email: req.body.user_email, user_verification_code: req.body.user_verification_code });
      const userFind = await User.findOne({
        user_email: req.body.user_email,
        isDeleted: false,
      });

      if (userFind) {
        const newPassword = await bcrypt.hash(req.body.new_password, 8);
        const updateUser = await User.findOneAndUpdate(
          { _id: userFind._id },
          {
            user_password: newPassword,
            // user_verification_code: null
          }
        );
        res.status(200).send({
          status: 1,
          message: "Your new password has been reset successfully",
        });
      } else {
        res.status(400).send({ status: 0, message: "User not found!" });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

// User social login

// Here get Content by type
const content = async (req, res) => {
  try {
    if (!req.params.content_type) {
      return res
        .status(400)
        .send({ status: 0, message: "Content field is required" });
    } else {
      const contentFind = await Content.findOne({
        content_type: req.params.content_type,
      });
      if (contentFind) {
        return res.status(200).send({ status: 1, data: contentFind });
      } else {
        return res
          .status(400)
          .send({ status: 0, message: "Content type not found!" });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const editProfile = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(400)
        .send({ status: 0, message: "Authentication Field is required" });
    } else {
      const userData = await User.findById(req.user._id);
      if (!userData) {
        return res.status(400).send({ status: 0, message: "User Not exist" });
      }
      if (userData.user_image && req.file?.user_image) {
        const params = {
          Bucket: process.env.BUCKET,
          Key: userData.user_image,
        };

        s3.deleteObject(params, (err, data) => {
          if (err) {
            console.error("Error deleting the image:", err);
          } else {
          }
        });
      }

      const object_update = {
        user_image: req.files && req.files.user_image ? (await uploadFiles(req.files.user_image[0])).Key : userData.user_image,
        full_name: req.body.full_name,
        user_email: req.body.user_email,
        user_phone: req.body.user_phone,
        business_name: req.body.business_name,
        address: req.body.address,
        country: req.body.country,
        state: req.body.state,
        zip_postal_code: req.body.zip_postal_code,
        userType: req.body.userType,
        cover_image: req.files && req.files.cover_image ? (await uploadFiles(req.files.cover_image[0])).Key : userData.cover_image || null

      };

      for (const key in object_update) {
        if (
          object_update[key] === "" ||
          object_update[key] === undefined ||
          object_update[key] === null
        ) {
          delete object_update[key];
        }
      }

      // const updateUser = await User.findOneAndUpdate({ _id: req.body.user_id }, object_update, { new: true });
      const updateUser = await User.findOneAndUpdate(
        { _id: req.user._id },
        object_update,
        { new: true }
      );

      // const updateUser = await User.save();

      if (updateUser) {
        return res.status(200).send({
          status: 1,
          message: "Profile Update Successfully.",
          data: updateUser,
        });
      } else {
        return res
          .status(400)
          .send({ status: 0, message: "Profile Not Update Successfully." });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file?.path, (err) => { });
    }
  }
};

// Here user logout
const userLogout = async (req, res) => {
  try {
    const {user_device_token}=req.body
    // if (!req.body.user_id) {
    //    return res.status(400).send({ status: 0, message: 'User ID field is required' });
    // }
    // else
    if (!req.headers.authorization) {
      return res
        .status(400)
        .send({ status: 0, message: "Authentication Field is required" });
    } else {
      // const updateUser = await User.findOneAndUpdate({ _id: req.body.user_id }, {

      // Find the user and remove the current token, then nullify user_device_type and user_device_token
      let Device = await deviceModel.findOne({deviceToken: user_device_token })

      if(!Device){
        return res
        .status(200)
        .send({ status: 1, message: "User logout Successfully." });
      }
   
      await deviceModel.findOneAndDelete({ user: req.user._id, deviceToken:user_device_token})
      let user = await User.findByIdAndUpdate(
        req.user._id, 
        { $pull: { devices: Device._id } },
        { new: true } // Optional: to return the updated user
      );     
      return res
        .status(200)
        .send({ status: 1, message: "User logout Successfully." });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const completeProfile = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(400)
        .send({ status: 0, message: "Authentication Field is required" });
    } else {
      // if (req.file) {
      //   user_image = req.file?.path;
      // }


      const object_update = {
        user_image: req.files ? (await uploadFile(req.files.user_image[0])).Key : null,
        business_name: req.body.business_name,
        address: req.body.address,
        country: req.body.country,
        state: req.body.state,
        zip_postal_code: req.body.zip_postal_code,
        user_is_profile_complete: 1,
        cover_image: req.files ? (await uploadFile(req.files.cover_image[0])).Key : null,
      };

      for (const key in object_update) {
        if (object_update[key] === "" || object_update[key] === undefined) {
          delete object_update[key];
        }
      }

      // const updateUser = await User.findOneAndUpdate({ _id: req.body.user_id }, object_update, { new: true });
      const updateUser = await User.findOneAndUpdate(
        { _id: req.user._id },
        object_update,
        { new: true }
      );

      // const updateUser = await User.save();

      if (updateUser) {
        return res.status(200).send({
          status: 1,
          message: "Profile Update Successfully.",
          data: updateUser,
        });
      } else {
        return res
          .status(400)
          .send({ status: 0, message: "Profile Not Update Successfully." });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file?.path, (err) => { });
    }
  }
};

const Notifications = async (req, res) => {
  try {
    if (req.body.notification == "off") {
      let user = await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          notification: "off",
          is_notification: 0,
        },
        { new: true }
      ).populate("subscription_package");
      return res
        .status(200)
        .send({ status: 1, message: "Notification Off", data: user });
    } else if (req.body.notification == "on") {
      let user = await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          notification: "on",
          is_notification: 1,
        },
        { new: true }
      ).populate("subscription_package");
      return res
        .status(200)
        .send({ status: 1, message: "Notification ON", data: user });
    }
  } catch (e) {
    return res
      .status(400)
      .send({ status: 0, message: "Failed Notification toggle!" });
  }
};

//  resend_otp
const resend_otp = async (req, res) => {
  try {
    if (!req.body.user_email) {
      return res
        .status(400)
        .send({ status: 0, message: "User Email field is required" });
    } else {
      const userFind = await User.findOne({ user_email: req.body.user_email });

      if (userFind) {
        const verificationCode = Math.floor(1000 + Math.random() * 9000);
        // const verificationCode = 1234
        const updatedUser = await User.findOneAndUpdate(
          { _id: userFind._id },
          { user_verification_code: verificationCode },
          { new: true }
        );
        sendEmail(userFind.user_email, verificationCode);
        // await twilio.messages.create({
        //     to: userFind.user_phone,
        //     from: process.env.SMS_FROM_NUMBER,
        //     body: `Your OTP Code is ${verificationCode}`
        // })

        let user_verification_code = updatedUser.user_verification_code;
        const userObj = {
          _id: userFind._id,
          user_verification_code: user_verification_code,
        };
        // res.status(200).send({ status: 1, message: 'Verification Code Send please check your email.', data: updatedUser });
        return res.status(200).send({
          status: 1,
          message: "Verification Code sent. Please Check your email address",
          data: userObj,
        });
      } else {
        return res.status(400).send({ status: 0, message: "Email not found!" });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const subscription = async (req, res) => {
  const purchase = new SubscriptionModel(req.body);
  try {
    if (!req.body.user_id) {
      return res
        .status(400)
        .send({ status: 0, message: "User Id is required" });
    } else {
      const userFind = await User.findOne({
        _id: req.body.user_id,
      });
      if (userFind) {
        purchase.user_id = req.body.user_id;
        if (req.body.plan_type == "regular_monthly_plan") {
          let time_now = moment(new Date()).format("YYYY-MM-DD[Z]");
          const second = new Date(time_now);
          purchase.subscribed_date = time_now;
          const SimpleMonth = second.setMonth(second.getMonth() + 1);
          purchase.expiryDate = SimpleMonth;
          purchase.plan_type = req.body.plan_type;
        }
        const inPurchase = await purchase.save();
        if (inPurchase) {
          const updatedData = await User.findOneAndUpdate(
            { _id: req.body.user_id },
            {
              // is_member: true,
              subscription_package: inPurchase._id,
              // $push: {
              //     subscription_package: inPurchase._id
              // }
            },
            { new: true }
          );
          // return res.status(200).send({
          //     status: 1,
          //     message: "you have subscribed successfully.",
          //     data: { updatedData, inPurchase },
          // });
          if (updatedData && inPurchase) {
            return res.status(200).send({
              status: 1,
              message: "you have subscribed successfully.",
              data: { updatedData, inPurchase },
            });
          }
        }
        // }
      } else {
        return res.status(401).send({ status: 0, message: "Wrong User Id!" });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

// const subscription = async (req, res) => {
//     const purchase = new SubscriptionModel(req.body);
//     try {
//         if (!req.headers.authorization) {
//             return res.status(400).send({ status: 0, message: 'Authentication Field is required' });
//         } else {
//             const userFind = await User.findOne({
//                 _id: req.user._id,
//             });

//             if (userFind) {
//                 if (userFind.is_member == true) {
//                     return res.status(400).send({
//                         status: 0,
//                         message: "you have already subscribed",
//                     });
//                 } else {
//                     let time_now = moment(new Date()).format("YYYY-MM-DD[Z]");
//                     const second = new Date(time_now);
//                     purchase.subscribed_date = time_now
//                     const MonthAdd = second.setMonth(second.getMonth() + 1);
//                     purchase.expiryDate = MonthAdd
//                     purchase.user_id = req.user._id
//                     // expiryDate
//                     const inPurchase = await purchase.save();
//                     if (inPurchase) {
//                         const updatedData = await User.findOneAndUpdate(
//                             { _id: req.user._id },
//                             {
//                                 is_member: true,
//                             },
//                             { new: true }
//                         );
//                         return res.status(200).send({
//                             status: 1,
//                             message: "you have subscribes successfully.",
//                             data: { updatedData, inPurchase },
//                         });
//                     }
//                 }
//             } else {
//                 return res.status(401).send({ status: 0, message: "Wrong User Id!" });
//             }
//         }
//     } catch (e) {
//         return res.status(400).send({status:0,message:e.message});
//     }
// };

const createContact = async (req, res) => {
  try {
    const { user } = req;
    const { name, business_address, business_name, phone, email, type } =
      req.body;
    const userFind = await User.findOne({
      _id: user._id,
    });
    if (!userFind) {
      return res
        .status(400)
        .send({ status: 0, message: "User Id is required" });
    }
    const data = new UserContactsModel({
      name,
      business_address,
      business_name,
      phone,
      email,
      type,
      user_id: user._id,
    });
    return res.status(200).send({
      status: 1,
      message: "Contact saved successfully",
      data: await data.save(),
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const getContact = async (req, res) => {
  try {
    const { user } = req;
    const userFind = await User.findOne({
      _id: user._id,
      isDeleted: false,
    });
    if (!userFind) {
      return res
        .status(400)
        .send({ status: 0, message: "User Id is required" });
    }
    var data;
    if (req.query.name) {
      data = await UserContactsModel.searchPartial(req.query.name);
    } else {
      data = await UserContactsModel.find({
        user_id: user._id,
        isDeleted: false,
      });
    }
    if (data && data.length > 0) {
      return res.status(200).send({
        status: 1,
        message: "Contact get successfully",
        data,
      });
    }
    return res.status(200).send({
      status: 0,
      message: "No any Contacts saved yet",
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const deleteContact = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const userFind = await User.findOne({
      _id: user._id,
    });
    if (!userFind) {
      return res
        .status(400)
        .send({ status: 0, message: "User Id is required" });
    }
    const datafind = await UserContactsModel.findOne({
      user_id: user._id,
      _id: id,
      isDeleted: false,
    });

    if (datafind) {
      const updatecontact = await UserContactsModel.findOneAndUpdate(
        {
          user_id: user._id,
          _id: id,
        },
        { isDeleted: true },
        { new: true }
      );

      if (updatecontact) {
        return res.status(200).send({
          status: 1,
          message: "Contact Deleted Successfully",
        });
      }
      return res.status(400).send({
        status: 0,
        message: "Contact not deleted",
      });
    } else {
      return res.status(400).send({
        status: 0,
        message: "Invalid Contact",
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const updateContact = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const userFind = await User.findOne({
      _id: user._id,
    });
    if (!userFind) {
      return res
        .status(400)
        .send({ status: 0, message: "User Id is required" });
    }
    const datafind = await UserContactsModel.findOne({
      user_id: user._id,
      _id: id,
    });
    if (datafind) {
      const updatecontact = await UserContactsModel.updateOne(
        {
          user_id: user._id,
          _id: id,
        },
        req.body
      );
      if (updatecontact && updatecontact.nModified > 0) {
        return res.status(200).send({
          status: 1,
          message: "Contact Updated successfully",
        });
      } else {
        return res.status(400).send({
          status: 0,
          message: "Contact Not Updated",
        });
      }
    } else {
      return res.status(400).send({
        status: 0,
        message: "Invalid Contact",
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const deleteUser = async function (req, res) {
  // var connection =  new connect();

  // const session = await connection.startSession();
  try {
    const { user } = req;

    // await session.startTransaction();
    await User.findByIdAndUpdate(user._id, {
      isDeleted: true,
      isDeactivate: false,
      subscription_package: null,
      address: "",
      country: "",
      state: "",
      zip_postal_code: "",
      user_is_profile_complete: 0,
      user_device_type: null,
      user_device_token: null,
      city: "",
    });
    await UserCard.updateMany({ user_id: user._id }, { is_active: 1 });
    await UserContactsModel.updateMany(
      { user_id: user._id },
      { isDeleted: true }
    );
    await Alarams.updateMany({ user_id: user._id }, { isDeleted: true });
    await MainEvent.updateMany({ user_id: user._id }, { isDeleted: true });
    await SubEvents.updateMany({ user_id: user._id }, { isDeleted: true });
    await TemplatEevent.updateMany({ user_id: user._id }, { isDeleted: true });
    await TemplatSubEevent.updateMany(
      { user_id: user._id },
      { isDeleted: true }
    );
    await GeneralAlarm.updateMany({ user_id: user._id }, { isDeleted: true });
    res.status(200).send({
      status: 1,
      message: "User data deleted successfully",
    });
    // await session.commitTransaction();
  } catch (e) {
    // await session.abortTransaction();
    return res.status(400).send({ status: 0, message: e.message });
  }
  // finally {
  //   // await session.endSession();
  // }
};

const adminSignUp = async (req, res) => {
  try {
    if (!req.body.full_name) {
      return res
        .status(400)
        .send({ status: 0, message: "Full Name field is required" });
    } else if (!req.body.user_email) {
      return res.status(400).send({ status: 0, message: "Email is required" });
    } else if (!req.body.user_password) {
      return res
        .status(400)
        .send({ status: 0, message: "User Password field is required" });
    }

    console.log(req.body.user_password);
    const hashPassword = await bcrypt.hash(req.body.user_password, 10);
    console.log(hashPassword);
    let adminObj = {
      full_name: req.body.full_name,
      user_email: req.body.user_email,
      user_password: hashPassword,
    };

    const adminObject = await new User(adminObj).save();

    return res.status(200).send({
      status: 1,
      message: "admin Sign Up Successfully.",
      data: adminObject,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { user_email, user_password } = req.body;

    const adminDetail = await User.findOne({ user_email: user_email });

    if (!adminDetail)
      return res.status(400).send({ status: 0, message: "Email Not Found" });

    const comparePassword = await bcrypt.compare(
      user_password,
      adminDetail.user_password
    );

    // if (!comparePassword) {
    //   return res
    //     .status(400)
    //     .send({ status: 0, message: "You have entered wrong password" });
    // }

    // generate jwt token
    const authToken = await jwt.sign(
      JSON.parse(JSON.stringify(adminDetail)),
      process.env.JWT_SECRET_ADMIN
    );
    adminDetail.user_authentication = authToken;

    return res.status(200).send({
      status: 1,
      message: "admin Login Successfully.",
      data: adminDetail,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const getAllMainEvents = async (req, res) => {
  try {
    const { currentPage = 0, itemsPerPage = 10 } = req.query;
    const finalCurrentPage = Number(currentPage) ? Number(currentPage) - 1 : 0;

    var getEvents = await MainEvent.find({ isDeleted: false });

    console.log(getEvents.length);
    let mainEvents = await MainEvent.find({ isDeleted: false })
      .populate(["alarm_setting", "contacts", "sub_events"])
      .sort({ _id: -1 })
      .skip(finalCurrentPage * Number(itemsPerPage))
      .limit(Number(itemsPerPage));

    if (mainEvents.length > 0) {
      mainEvents = mainEvents.map((item) => {
        if (item.sub_events.length > 0) {
          item._doc.sub_events = item._doc.sub_events.filter((val) => {
            if (!val.isDeleted) {
              return {
                ...val._doc,
                startTime: new Date(moment.utc(val.startTime)),
                endTime: new Date(moment.utc(val.endTime)),
              };
            }
          });
        }
        return {
          ...item._doc,
          startTime: new Date(moment.utc(item.startTime)),
          endTime: new Date(moment.utc(item.endTime)),
        };
      });
      return res.status(200).send({
        status: 1,
        message: "Main Events Found!",
        data: mainEvents,
        totalEvent: getEvents.length,
      });
    } else {
      return res.status(400).send({
        status: 0,
        message: "Main Events Not Found!",
        // data: mainEvents,
      });
      // return res.status(200).send({
      //     status: 1,
      //     message: "Main Events Found!",
      //     data: mainEvents,
      // });
    }
  } catch (e) {
    return res
      .status(400)
      .send({ status: 0, message: "Main Events Get  Failed!" });
  }
};

const deletMainEventById = async (req, res) => {
  try {
    const events = await MainEvent.findByIdAndUpdate(
      { _id: req.params.event_id },
      { isDeleted: true },
      { new: true }
    );
    await SubEvents.updateMany(
      {
        main_event_id: req.params.event_id,
        isDeleted: false,
      },
      { isDeleted: true },
      { new: true }
    );

    // if (events) {
    if (!events) {
      return res.status(400).json({
        status: 0,
        message: "Main event not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "Main event delete successfully.",
        data: events,
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const deletSubEventById = async (req, res) => {
  try {
    console.log(req.params.event_sub_id);
    const subEvents = await SubEvents.updateMany(
      { _id: req.params.event_sub_id },
      { isDeleted: true },
      { new: true }
    );

    // if (events) {
    if (!subEvents) {
      return res.status(400).json({
        status: 0,
        message: "Main event not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "Sub event delete successfully.",
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const editMainEventById = async (req, res) => {
  try {
    const object_update = {
      title: req.body.title,
      select_purpose: req.body.select_purpose,
      date: moment(req.body.date).format("YYYY-MM-DD"),
      startTime: moment(req.body.startTime).format("YYYY-MM-DD HH:mm:ss[Z]"),
      endTime: moment(req.body.endTime).format("YYYY-MM-DD HH:mm:ss[Z]"),
      // address: req.body.address,
      // phone_number: req.body.phone_number,
      description: req.body.description,
      select_interval_time: req.body.select_interval_time,
      recurring: req.body.recurring,
      select_color: req.body.select_color,
      // user_email: req.user._doc.user_email,
    };
    for (const key in object_update) {
      if (object_update[key] === "" || object_update[key] === undefined) {
        delete object_update[key];
      }
    }

    const editMainEvent = await MainEvent.findOneAndUpdate(
      { _id: req.params.event_id },
      object_update,
      { new: true }
    );

    if (!editMainEvent) {
      return res.status(400).json({
        status: 0,
        message: "Main Event not found",
        // data: events,
      });
    } else if (editMainEvent) {
      return res.status(200).send({
        status: 1,
        message: "Main Event Update Successfully.",
        data: editMainEvent,
      });
    } else {
      return res
        .status(400)
        .send({ status: 0, message: "Main Event Not Update Successfully." });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const editSubEventById = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(400)
        .send({ status: 0, message: "Authentication Field is required" });
    } else {
      const object_update = {
        title: req.body.title,
        // select_duration: req.body.select_duration,
        // date: req.body.date,
        date: moment(req.body.date).format("YYYY-MM-DD"),
        // startTime: req.body.startTime,
        startTime: moment(req.body.startTime).format("YYYY-MM-DD HH:mm:ss[Z]"),
        // startTime: moment.utc(req.body.startTime).format("YYYY-MM-DD h:mm:ss"),
        // endTime: req.body.endTime,
        endTime: moment(req.body.endTime).format("YYYY-MM-DD HH:mm:ss[Z]"),
        // endTime: moment.utc(req.body.endTime).format("YYYY-MM-DD h:mm:ss"),
        select_status: req.body.select_status,
        select_interval_time: req.body.select_interval_time,
        recurring: req.body.recurring,
        select_color: req.body.select_color,
        // address: req.body.address,
        // phone_number: req.body.phone_number,
        description: req.body.description,
        // user_email: req.user._doc.user_email,
        select_purpose: req.body.select_purpose,
      };
      for (const key in object_update) {
        if (object_update[key] === "" || object_update[key] === undefined) {
          delete object_update[key];
        }
      }
      console.log(req.params.sub_event_id);
      const editSubEventValues = await SubEvents.findByIdAndUpdate(
        { _id: req.params.sub_event_id },
        object_update,
        { new: true }
      );
      console.log(editSubEventValues);
      if (!editSubEventValues) {
        return res.status(400).json({
          status: 0,
          message: "SubEvent not found",
          // data: events,
        });
      } else if (editSubEventValues) {
        return res.status(200).send({
          status: 1,
          message: "SubEvent Update Successfully.",
          data: editSubEventValues,
        });
      } else {
        return res
          .status(400)
          .send({ status: 0, message: "SubEvent Not Update Successfully." });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const viewUsers = async (req, res) => {
  try {
    const { currentPage = 0, status, itemsPerPage = 10 } = req.query;
    const finalCurrentPage = Number(currentPage) ? Number(currentPage) - 1 : 0;

    const userDetails = await User.find({
      user_type: "user",
      isDeactivate: status,
      isDeleted: 0,
    })
      .skip(finalCurrentPage * Number(itemsPerPage))
      .limit(Number(itemsPerPage));

    let userObjects = [];

    userDetails.map(async (e) => {
      const userFunding = await fundingModel.countDocuments({ user_id: e._id, paymentStatus: "completed" },)
      console.log(userFunding);
      userObjects.push({
        full_name: e.full_name,
        business_name: e.business_name,
        address: e.address,
        country: e.country,
        state: e.state,
        zip_postal_code: e.zip_postal_code,
        user_type: 'user',
        user_password: e.user_password,
        company_name: e.company_name,
        city: e.city,
        user_phone: e.user_phone,
        user_verification_code: e.user_verification_code,
        user_is_verified: e.user_is_verified,
        user_is_profile_complete: e.user_is_profile_complete,
        notification: e.notification,
        is_notification: e.is_notification,
        user_authentication: e.user_authentication,
        user_image: e.user_image,
        user_social_token: e.user_social_token,
        user_social_type: e.user_social_type,
        user_device_type: e.user_device_type,
        user_device_token: e.user_device_token,
        isDeactivate: e.isDeactivate,
        isDeleted: e.isDeleted,
        is_member: e.is_member,
        subscription_package: e.subscription_package,
        _id: e._id,
        user_email: e.user_email,
        userPaymentCount: userFunding,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        __v: e.__v

      });
      // console.log('this is dataaaaaaaaaaaaaaaaa>>>>>>>>>>>>>>>>>>>>>>>>',userObjects)
      // userObjects[i].userPaymentCount=userFunding


    })


    const totalUsersCount = await User.countDocuments({
      user_type: "user",
      isDeactivate: false,
      isDeleted: 0,
    });

    return res.status(200).send({
      status: 1,
      message: "View users successfully.",
      data: {
        usersData: userObjects,
        userTotalCount: totalUsersCount
      }
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const getDashboardUser = async (req, res) => {
  try {
    const androidUserCount = await User.countDocuments({
      user_type: "user",
      isDeactivate: false,
      isDeleted: 0,
      user_device_type: "android",
    });

    const iosUserCount = await User.countDocuments({
      user_type: "user",
      isDeactivate: false,
      isDeleted: 0,
      user_device_type: "ios",
    });

    const webUserCount = await User.countDocuments({
      user_type: "user",
      isDeactivate: false,
      isDeleted: 0,
      user_device_type: "web",
    });

    const totalUsers = await User.countDocuments({ isDeleted: false });
    const totalEvents = await MainEvent.countDocuments({ isDeleted: false });

    let userObject = {
      androidUserCount,
      iosUserCount,
      webUserCount,
      totalEvents,
      totalUsers,
    };

    return res.status(200).send({
      message: "Get Dashbaord Data.",
      data: userObject,
    });
  } catch (e) {
    return res.status(400).send({ message: e.message });
  }
};
const blockUnblockUsers = async (req, res) => {
  try {
    const { status, userId } = req.body;
    const finalStatus = status ? "blocked" : "unblocked";

    await User.updateOne(
      {
        _id: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          isDeactivate: status,
        },
      }
    );

    return res.status(200).send({
      status: 1,
      message: `User ${finalStatus} successfully`,
      data: [],
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const {
      userId,
      full_name,
      business_name,
      address,
      country,
      state,
      city,
      user_phone,
      is_notification,
      user_social_type,
      user_device_type,
    } = req.body;

    await User.updateOne(
      {
        _id: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          full_name: full_name,
          business_name: business_name,
          address: address,
          country: country,
          state: state,
          city: city,
          user_phone: user_phone,
          is_notification: is_notification,
          user_social_type: user_social_type,
          user_device_type: user_device_type,
        },
      }
    );

    return res.status(200).send({
      status: 1,
      message: `users data updated successfully`,
      data: [],
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const deleteUsers = async (req, res) => {
  try {
    const { userId } = req.body;

    await User.updateOne(
      {
        _id: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          isDeleted: 1,
        },
      }
    );

    return res.status(200).send({
      status: 1,
      message: `users deleted successfully`,
      data: [],
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const sendPushNotification = async (req, res) => {
  try {
    // all users device token
    console.log("api is hitting>>>")
    let userId = req.body.userId;
    let filter = {};
    if (!userId) {
      return res.status(404).send({
        status: 1,
        message: `please provide userIds`,
        data: [],
      });
    }
    if (userId && userId.length > 0) {
      filter = {
        _id: { $in: userId.map(id => mongoose.Types.ObjectId(id)) },
        user_type: "user"
      };
      const fcmToken = await User.find(filter, "user_device_token").populate("devices");

      const notification_obj = {
        title: req.body.title,
        body: req.body.body,
      };
      let data = {
        title: req.body.title,
        body: req.body.body,
        type: "general notifications",
      };
      let tokens = []
      fcmToken?.map((e) => {
        e?.devices?.map((j) => {
          tokens.push(j?.deviceToken)
        })
      })
      await send_notifications(tokens, notification_obj, data)
      // for (let i = 0; i < fcmToken.length; i++) {
      //   if (fcmToken[i].user_device_token) {
      //     notification_obj.user_device_token = fcmToken[i].user_device_token;
      //     push_notifications(notification_obj);
      //   }
      // }
      return res.status(200).send({
        status: 1,
        message: `All Notificattions successfully`,
        data: [],
      });
    }



    // push all notification in promises
    // Promise.all(promises)
    //   .then((results) => {
    //     console.log("All notifications sent successfully:");
    //   })
    //   .catch((error) => {
    //     // Handle errors
    //     console.error("Error sending notifications:", error);
    //   });


  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const getPreviousEvents = async (req, res) => {
  try {
    const { todayDate } = req.body;
    const events = await MainEvent.find({
      user_id: req.user._id,
      date: { $lt: todayDate },

      status: "pending",
      isDeleted: false,
    })
      .populate({
        path: "sub_events",
        select: "-__v -createdAt -updatedAt -user_id",
      })
      .select("-__v -updatedAt")
      .sort({ createdAt: -1 });
    const events1 = await MainEvent.find({
      user_id: req.user._id,
      date: { $eq: todayDate },
      status: "pending",
      isDeleted: false,
    })
      .populate({
        path: "sub_events",
        select: "-__v -createdAt -updatedAt -user_id",
      })
      .select("-__v -updatedAt")
      .sort({ createdAt: -1 });
    data = [];
    data2 = [];
    events.map((m) => {
      data.push(m);
      if (m.sub_events.length > 0) {
        m.sub_events.map((s) => {
          data.push(s);
        });
        delete m._doc.sub_events;
      }
    });
    events1.map((m) => {
      data2.push(m);
      if (m.sub_events.length > 0) {
        m.sub_events.map((s) => {
          data2.push(s);
        });
        delete m._doc.sub_events;
      }
    });
    return res.status(200).send({
      status: 1,
      message: `All Previous pending events fetched successfully`,
      data: { data, data2 },
    });
  } catch (error) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const deleteRequest = async (req, res) => {
  try {
    const { reason, user_email, user_password } = req.body; // Extract the "reason"  from req.body
    const user = await User.findOne({ user_email: user_email });
    if (!user_email) {
      return res
        .status(400)
        .send({ status: 0, message: "user_email is required" });
    }
    if (!user_password) {
      return res
        .status(400)
        .send({ status: 0, message: "user_password is required" });
    }
    if (!reason) {
      return res
        .status(400)
        .send({ status: 0, message: "reason is required" });
    }

    const isMatch = await bcrypt.compare(user_password, user.user_password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ status: 0, message: "Invalid email or password" });
    }
    const alreadyRequest = await deleteRequestModel.findOne({ user_id: user._id });
    if (alreadyRequest) {
      return res
        .status(400)
        .send({ status: 0, message: "Your request is already submitted" });
    }
    const deleteAccountRequest = new deleteRequestModel({
      user_id: user._id,
      reason: reason, // Pass the extracted reason as a string
    });
    await deleteAccountRequest.save();
    return res.status(200).send({
      status: 1,
      message: `Delete account request sent successfully`,
      data: deleteAccountRequest,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const getDeleteRequests = async (req, res) => {
  try {
    const getDeleteRequest = await deleteRequestModel
      .find({ requestStatus: "pending" })
      .populate("user_id");
    return res.status(200).send({
      status: 1,
      message: `Delete account requests`,
      data: getDeleteRequest,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const deleteRequestStatus = async (req, res) => {
  try {
    const { _id, requestStatus } = req.body;
    const Status = await deleteRequestModel.findByIdAndUpdate(
      _id,
      {
        requestStatus,
      },
      {
        new: true,
      }
    );

    if (requestStatus === "accepted") {
      const deleteUser = await User.findOneAndUpdate(
        { _id },
        { isDeleted: true }
      );
    }
    return res.status(200).send({
      status: 1,
      message: `Request Status`,
      data: Status,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const sendDocument = async (req, res) => {
  try {
    const { To, subject, message } = req.body;

    const user = await User.findOne({ user_email: To }).populate("devices");
    const tokens=Array.from(new Set(user?.devices?.map(e=>e?.deviceToken)))
    const notification_obj = {
      title: user?.full_name,
      body: `${user?.full_name} have sended you email`,

    };
    console.log();

    let data = {
      title: user?.full_name,
      body: `${user?.full_name} have sended you email`,
      type: "email",
    };
    send_notifications(tokens, notification_obj, data)
    if (!user) {
      return res
        .status(200)
        .send({ status: 0, message: "User does not exist" });
    }
    // Check if files exist in the request
    if (req.files && req.files['user_image']) {
      console.log("Inside req.files");
      const attachmentLinks = await uploadFiles(req.files);

      const attachments = attachmentLinks.map((link) => ({
        url: link.fileUrl,
        fileType: link.obj1.fileType,
        fileSize: link.obj1.fileSize,
        fileName: link.obj1.fileName
      }));


      const document = await documentModel.create({
        sendFrom: req.user._id,
        To,
        subject,
        message,
        attachment: attachments
      });
      return res.status(200).send({
        status: 1,
        message: `Document sent successfully`,
        data: document,
      });
    }
    const document = await documentModel.create({
      sendFrom: req.user._id,
      To,
      subject,
      message,
    });
      return res.status(200).send({
        status: 1,
        message: `Document sent successfully`,
        data: document,
      });
    
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send({ status: 0, message: "Internal Server Error" });
  }
}
const inboxDocument = async (req, res,) => {
  try {
    const user = await User.findById(req.user._id)
    console.log("user", user);
    console.log("user.user_email", user.user_email);
    const inbox = await documentModel.find({ To: user.user_email }).populate({
      path: "sendFrom",
      select: "full_name user_image user_email"
    })
    return res.status(200).send({
      status: 1,
      message: `Inbox`,
      data: inbox,
    });
  }
  catch (e) {
    console.log(e.message)
    return res.status(400).send({ status: 0, message: e.message });
  }
}
const getDocumentById = async (req, res) => {
  try {
    console.log("userid", req.user._id);
    const { id } = req.params
    const document1 = await documentModel.findById(id)
      .populate({
        path: "sendFrom",
        select: "user_email full_name user_image"
      });
    const toUser = await User.findOne({ user_email: document1.To }).select("user_email full_name user_image")
    document1.To = toUser;
    return res.status(200).send({
      status: 1,
      message: `document`,
      data: document1,
    });
  }
  catch (e) {
    console.log(e.message)
    return res.status(400).send({ status: 0, message: e.message });
  }
}
const sentDocument = async (req, res) => {
  try {
    let sent = await documentModel.aggregate([
      {
        $match: { sendFrom: req.user._id }
      },
      {
        $lookup: {
          from: "users",
          localField: "To",
          foreignField: "user_email",
          as: "toUser"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "sendFrom",
          foreignField: "_id",
          as: "fromUser"
        }
      },
      {
        $unwind: {
          path: "$toUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$fromUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          sendFrom: {
            user_email: "$fromUser.user_email",
            full_name: "$fromUser.full_name",
            user_image: "$fromUser.user_image",
            _id: "$fromUser._id"
          },
          To: {
            user_email: "$toUser.user_email",
            full_name: "$toUser.full_name",
            user_image: "$toUser.user_image",
            _id: "$toUser._id"
          },
          subject: 1,
          message: 1,
          attachment: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    return res.status(200).send({
      status: 1,
      message: `sent`,
      data: sent,
    });

  }
  catch (e) {
    console.log(e.message)
    return res.status(400).send({ status: 0, message: e.message });
  }
}
const createForm = async (req, res) => {
  try {
    const { name, user_email, user_phone, message } = req.body;
    const form = await questionsModel.create({
      name,
      user_email,
      user_phone,
      message
    })
    await sendEmailForm("support@skyresourcesapp.com", form)
    return res.status(200).send({
      status: 1,
      message: `form`,
      data: form,
    });

  }
  catch (e) {
    console.log(e.message)
    return res.status(400).send({ status: 0, message: e.message });
  }
}




module.exports = {
  signUp,
  sentDocument,
  getDocumentById,
  getContactById,
  sendDocument,
  inboxDocument,
  user_verification,
  userLogin,
  userForgotPassword,
  resetPassword,
  SetnewPassAfterForget,
  Notifications,
  socialLogin,
  content,
  completeProfile,
  editProfile,
  userLogout,
  resend_otp,
  subscription,
  createContact,
  getContact,
  deleteContact,
  updateContact,
  deleteUser,
  settoken,
  adminSignUp,
  adminLogin,
  viewUsers,
  blockUnblockUsers,
  updateUser,
  deleteUsers,
  sendPushNotification,
  getAllMainEvents,
  deletMainEventById,
  deletSubEventById,
  editMainEventById,
  editSubEventById,
  getDashboardUser,
  getPreviousEvents,
  deleteRequest,
  getDeleteRequests,
  deleteRequestStatus,
  createForm,
  userVerification
};
// we have 44 function here