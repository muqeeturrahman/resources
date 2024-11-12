const { paymentIdVerification } = require("../config/stripeConfig");
const { meetingModel } = require("../models/meetingModel");
const joi = require("joi").extend(require('@joi/date'));
// const { CronJob } = require("cron");

// import { CronJob } from "cron"

const dataValidation = joi.object({
  date: joi.string().required(),
  time: joi.string().required(),
  amount: joi.number().required(),
  paymentType: joi.string(),
  paymentId: joi.string()
})
const schedulemeeting = async (req, res) => {
  try {

    const { error } = dataValidation.validate(req.body);
    if (error) {
      const message = error.details?.map((err) => err.message);
      return res
        .status(400)
        .send({ status: 0, message: message.toString() });
    }
    const {
      amount,
      paymentType,
      paymentId,
      date,
      time
    } = req.body


    if (!(amount &&
      paymentType &&
      paymentId && date &&
      time
    )) {
      return res
        .status(400)
        .send({ status: 0, message: "All fields are necessary" });
    }

    const meet = new meetingModel({
      user_id: req.user._id,
      amount,
      paymentType,
      paymentId,
      paymentStatus: paymentIdVerification(paymentId) ? "accepted" : "pending",
      date, time

    })
    await meet.save()
    return res.status(200).send({
      status: 1,
      message: "your meeting scheduled successfully, waiting for admin approval",
      data: meet,
    });

  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }

}
const getAdminMeetings = async (req, res) => {
  try {


    const page = parseInt(req.query.page) || 1; // Get the requested page number from query string
    const limit = parseInt(req.query.limit) || 10;
    req.query.status = req.query.status ? req.query.status.toString() : null
    delete req.query.page
    delete req.query.limit
    req.query = Object.keys(req.query).filter(key => req.query[key] !== null && req.query[key] !== undefined)
      .reduce((newObj, key) => {
        newObj[key] = req.query[key];
        return newObj;
      }, {});

    const data = await meetingModel.find(req.query).skip((page - 1) * limit).limit(limit)



    if (data.length > 0) {
      return res.status(200).send({
        status: 1,
        message: "your meeting history get successfully",
        data,
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "You have no any meetings schedule yet!",

      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }

}
const getUserMeetings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the requested page number from query string
    const limit = parseInt(req.query.limit) || 10;
    req.query.status = req.query.status ? req.query.status.toString() : null
    delete req.query.page
    delete req.query.limit
    req.query = Object.keys(req.query).filter(key => req.query[key] !== null && req.query[key] !== undefined)
      .reduce((newObj, key) => {
        newObj[key] = req.query[key];
        return newObj;
      }, {});
    req.query.user_id = req.user._id
    const data = await meetingModel.find(req.query).skip((page - 1) * limit).limit(limit)
    if (data.length > 0) {

      return res.status(200).send({
        status: 1,
        message: "your meeting history get successfully",
        data,
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "You have no any meetings schedule yet!",

      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }

}
const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { link, status } = req.body
    if (!(link && status)) {
      return res.status(200).send({
        status: 0,
        message: "status and link fields are required",

      });
    }
    const data = await meetingModel.findOne({ _id: id })
    if (!data) {
      return res.status(200).send({
        status: 0,
        message: "Inavlid id",

      });
    } else {
      const updatedData = await meetingModel.findByIdAndUpdate(id, req.body, { new: true })
      return res.status(200).send({
        status: 1,
        message: "Scheduled meeting status updated",
        data: updatedData

      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }

}
const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await meetingModel.findOne({ _id: id })
    if (!data) {
      return res.status(200).send({
        status: 0,
        message: "Inavlid id",

      });
    } else {
      await meetingModel.findByIdAndDelete(id)
      return res.status(200).send({
        status: 1,
        message: "Scheduled meeting deleted successfully",


      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }

}



const getSchedule = async (req, res, next) => {
  try {

    const data = await meetingModel.find({ status: "accepted" }, { date: 1 })

    if (data.length > 0) {

      return res.status(200).send({
        status: 1,
        message: "your meeting history get successfully",
        data,
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "You have no any meetings schedule yet!",

      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
}
// const job = new CronJob("* * * * * *", async (req, res) => {
//     try {
//         const newStartTime = new Date();
//         const data = await PostModel.find({ isDelete: false, isAvailable: true })

//         data.map(async (item) => {
//             const timestamp2 = newStartTime.getTime();
//             const timestamp1 = item.createdAt.getTime();

//             // Calculate the difference in milliseconds
//             const differenceInMilliseconds = Math.abs(timestamp2 - timestamp1);
//             // Convert milliseconds to hours
//             const differenceInHours = differenceInMilliseconds / (1000 * 60 * 60);

//             if (differenceInHours >= item.postAvailability) {
//                 await PostModel.updateMany({originalPost:item._id}, { isAvailable: false })
//                 await PostModel.findByIdAndUpdate(item._id, { isAvailable: false })
//             }
//         })

//     } catch (e) {

//     }
// });

// job.start();
module.exports = { schedulemeeting, getAdminMeetings, getUserMeetings, updateMeeting, deleteMeeting, getSchedule }