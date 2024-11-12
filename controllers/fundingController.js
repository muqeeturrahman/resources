const { paymentIdVerification } = require("../config/stripeConfig");
const { fundingDataModel } = require("../models/fundDataModel");
const { fundingModel } = require("../models/fundingModel");
// const { push_notifications } = require("../config/push_notification.js");
const { fundingsModel } = require("../models/fundings");
const { User } = require("../models/User.js");


const createFund = async (req, res) => {
  try {
    const { amount, paymentType, paymentId, title, description, date, status, paymentStatus, fundId } = req.body;
    if (!(amount && title && description)) {
      return res
        .status(400)
        .send({ status: 0, message: "All fields is required" });
    }

    if(fundId){
      
      let updateFund = await fundingModel.updateOne(
        { _id: fundId }, // Filter object
        { 
          $set: { 
            status: 'accepted', 
            paymentStatus: 'accepted' 
          } 
        }
      );      return res.status(200).send({
        status: 1,
        message: "Payed successfully",
        data: updateFund,
      });
    }
    var fund;
    if (paymentId && paymentType) {
      fund = new fundingModel({
        user_id: req.user._id,
        amount,
        paymentType,
        paymentId,
        paymentStatus: paymentStatus,
        status: status,
        title,
        description,
        date,
      });
    } else {
      fund = new fundingModel({
        user_id: req.user._id,
        amount,
        paymentStatus: "pending",
        status: "pending",
        title,
        description,
        date,
      });
    }
    await fund.save();
    if(paymentStatus === "accepted" && status === "accepted"){
      return res.status(200).send({
        status: 1,
        message: "Payed successfully",
        data: fund,
      });
    }
    return res.status(200).send({
      status: 1,
      message: "your fund created successfully",
      data: fund,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
// const cron = require('node-cron');

// Define function to check for upcoming payments and send notifications
// const checkUpcomingPayments = async () => {
//   try {
//     const pendingFunds = await fundingModel.find({
//       user_id: req.user._id,
//       $or: [{ status: "pending" }, { status: "rejected" }]
//     }).populate({
//       path: "user_id",
//       select: "_id full_name notification is_notification user_device_token"
//     });

//     let date1 = new Date().toISOString();
//     console.log("date1>> ", date1);
//     let currentDate = new Date().toISOString().slice(0, 10);
//     console.log("date:", `${currentDate}`);
//     console.log("api is hitting till there");
//     pendingFunds.map((e) => {
//       let datePart = e.createdAt.toISOString().slice(0, 10)
//       // console.log("DATEPART",datePart);
//       console.log("just checking map", e.createdAt);
//       if (e.date) {
//         console.log("e.date=====>", e.date);
//         console.log("currentDate=====>", currentDate);
//         console.log("datePart>>", datePart);
//         if (e.date == currentDate) {
//           let notification_obj = {
//             user_device_token: e.user_id.user_device_token,
//             title: e.user_id.full_name,
//             body: "You have an upcoming payment",
//             type: "upco ming Payment",

//           };
//           if (e.user_id.notification == "on" || e.user_id.is_notification == 1) {

//             console.log("checking", e.user_id.user_device_token,);
//             push_notifications(notification_obj)
//           }
//         }
//       }

//       else {
//         if (datePart == currentDate) {

//           let notification_obj = {
//             user_device_token: e.user_id.user_device_token,
//             title: e.user_id.full_name,
//             body: "You have an upcoming payment",
//             type: "upco ming Payment",

//           };
//           if (e.user_id.notification == "on" || e.user_id.is_notification == 1) {

//             console.log("checking", e.user_id.user_device_token,);
//             push_notifications(notification_obj)
//           }
//         }
//       }
//     })
//   } catch (error) {
//     console.error("Error in checking upcoming payments:", error);
//   }
// };

const addRecentFund = async (req, res, next) => {
  let { amount, email } = req.body;
  try{
    let user =  await User.findOne({user_email: email})
    if(!user){
      return res.status(200).send({
        status: 0,
        message: "Inavlid email",
      });
    }
    let existance = await fundingsModel.findOne({ email: email })
    if(existance){
      await fundingsModel.findByIdAndDelete(existance._id)
    }
    let data = await fundingsModel.create({
      amount: amount,
      email: email
    })

    return res.status(200).send({
      status: 1,
      message: "your fund created successfully",
      data: data,
    });
  } catch(error){
    return res.status(400).send({ status: 0, message: error.message });
  }
}
// Schedule the cron job to run daily at 8:00 AM
// Original getUserFunds API
const getUserFunds = async (req, res) => {
  try {

    let acceptedFunds;
    let pendingFunds;
    const data = await fundingModel.find({ user_id: req.user._id, status: "accepted" });

    const data1 = await fundingModel.find({
      user_id: req.user._id,
      $or: [{ status: "pending" }, { status: "rejected" }]
    }).populate({
      path: "user_id",
      select: "_id full_name notification is_notification  user_device_token"
    })
    acceptedFunds = data
    pendingFunds = data1
    if (data.length > 0 || data1.length > 0) {
      return res.status(200).send({
        status: 1,
        message: "your funds transaction history get successfully",
        acceptedFunds, pendingFunds
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "You have no any funds yet!",
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const getAdminFunds = async (req, res) => {
  try {
    const { currentPage = 0, itemsPerPage = 10 } = req.query;
    const finalCurrentPage = Number(currentPage) ? Number(currentPage) - 1 : 0;
    const totalCount = await fundingModel.find({}).count();

    const data = await fundingModel
      .find({})
      .populate("user_id")
      .skip(finalCurrentPage * Number(itemsPerPage))
      .limit(Number(itemsPerPage));

    let dataObj = { data: data, totalCount: totalCount };

    if (data.length > 0) {
      return res.status(200).send({
        status: 1,
        message: "funds transaction history get successfully",
        dataObj,
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "No any funds yet!",
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const updateFund = async (req, res) => {
  try {
    const { id } = req.params;
    let data;
    if (req.user.user_type != "admin") {
      data = await fundingModel.findOne({ _id: id, user_id: req.user._id });
    } else {
      data = await fundingModel.findOne({ _id: id });
    }
    if (!data) {
      return res.status(200).send({
        status: 0,
        message: "Inavlid id",
      });
    } else {
      if (req.body.paymentId && req.body.paymentType) {
        req.body.status = "accepted";
        req.body.paymentStatus = paymentIdVerification(req.body.paymentId)
          ? "accepted"
          : "pending";
      }

      const updatedData = await fundingModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      return res.status(200).send({
        status: 1,
        message: "Transaction status updated",
        data: updatedData,
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const deleteFund = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fundingModel.findOne({ _id: id });
    if (!data) {
      return res.status(200).send({
        status: 0,
        message: "Inavlid id",
      });
    } else {
      await fundingModel.findByIdAndDelete(id);
      return res.status(200).send({
        status: 1,
        message: "Transaction deleted successfully",
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const createFundData = async (req, res) => {
  try {
    const { amount, title, description } = req.body;
    if (!(amount && title && description)) {
      return res
        .status(400)
        .send({ status: 0, message: "All fields is required" });
    }

    const funddata = new fundingDataModel({
      amount,

      title,
      description,
    });
    await funddata.save();
    return res.status(200).send({
      status: 1,
      message: "your fund Data created successfully",
      data: funddata,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const getFundData = async (req, res) => {
  try {
    const { val } = req.query;
    let data;
    if (val) {
      data = await fundingDataModel.find({ amount: val });
    } else {
      data = await fundingDataModel.find({});
    }
    if (data.length > 0) {
      return res.status(200).send({
        status: 1,
        message: "fund Data get successfully",
        data,
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "no any data of fund Exist",
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const updateFundData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fundingDataModel.findOne({ _id: id });

    if (!data) {
      return res.status(200).send({
        status: 0,
        message: "Inavlid id",
      });
    } else {
      const updatedfundData = await fundingDataModel.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );
      return res.status(200).send({
        status: 1,
        message: "Fund data Updated successfully",
        data: updatedfundData,
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const deleteFundData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fundingDataModel.findOne({ _id: id });

    if (!data) {
      return res.status(200).send({
        status: 0,
        message: "Inavlid id",
      });
    } else {
      const updatedfundData = await fundingDataModel.findByIdAndDelete(id);
      return res.status(200).send({
        status: 1,
        message: "Fund data Deleted successfully",
        data: updatedfundData,
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const timeUpdation =  (time, i, j) => {
  try{

    var st = time.split(" ");
    st[0] = st[0].split("-");
    if (j == 2) {
      var noOfWeeks = Math.floor(i / 7);
    var remainingDays = i % 7;
    
    var currentDate = new Date(st[0][0], st[0][1] - 1, st[0][2]);
    currentDate.setDate(currentDate.getDate() + noOfWeeks * 7);
    
    var newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + remainingDays);

    st[0][0] = newDate.getFullYear();
    st[0][1] = (newDate.getMonth() + 1).toString().padStart(2, "0");
    st[0][2] = newDate.getDate().toString().padStart(2, "0");
  }
  if (j == 1) {
    var currentYear = parseInt(st[0][0]);
    var currentMonth = parseInt(st[0][1]);

    var noOfMonths = i;
    
    var newMonth = currentMonth + noOfMonths;
    if (newMonth > 12) {
      currentYear += Math.floor(newMonth / 12);
      newMonth = newMonth % 12 == 0 ? 12 : newMonth % 12;
    }
    
    st[0][0] = currentYear;
    st[0][1] = newMonth.toString().padStart(2, "0");
  }
  st[0] = st[0].join("-");
  st = st.join(" ");
  return st;
}
catch (err) {
  return err;
}
};
const recurringFund = async (req, res) => {
  try {
    const { amount, paymentType, paymentId, title, description, date, until } =
    req.body;

    let alreadyDateFund = await fundingModel.find({
      user_id: req.user._id,
      date: date.split(" ")[0],
      amount: amount
    })

    let fund;
    var startYear = new Date(date).getFullYear();
    var startMonth = new Date(date).getMonth();
    var endYear = new Date(until).getFullYear();
    var endMonth = new Date(until).getMonth();

    const noOfmonths = (endYear - startYear) * 12 + (endMonth - startMonth);
    for (var i = 0; i < noOfmonths; i++) {
      const alreadyFund = await fundingModel.find({
        user_id: req.user._id,
        date:  timeUpdation(date, i + 1, 1).split(" ")[0],
        amount: amount
      })
      if (alreadyFund.length>0 || alreadyDateFund.length>0) {
        return res.status(200).send({
          status: 1,
          message: "Funds already created,cant make new funds",
          data: [],
        });
      }
    }

    fund1 = fundingModel({
      user_id: req.user._id,
      date: date.split(" ")[0],
      amount,
      paymentStatus: "pending",
      status: "pending",
      paymentId,
      paymentType,
      title,
      description,
    });
    await fund1.save();

    for (var i = 0; i < noOfmonths; i++) {
      fund = new fundingModel({
        user_id: req.user._id,
        date: timeUpdation(date, i + 1, 1).split(" ")[0],
        // startTime: timeUpdation(startTime, i + 1, 1),
        // endTime: timeUpdation(endTime, i + 1, 1),
        amount,
        paymentStatus: "pending",
        status: "pending",
        paymentId,
        paymentType,
        title,
        description,
      });

      await fund.save();
    }
    return res.status(200).send({
      status: 1,
      message: "Fund created",
      data: fund,

    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const deleteFunding = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id>>", id);

    const data = await fundingModel.findById(id);
    console.log("data>>", data);
    if (data.status == "accepted") {
      return res.status(400).send({
        status: 0,
        message: "Cant delete fund because status is completed",
      });
    }
    const deleteFund = await fundingModel.findByIdAndDelete(id);
    return res.status(200).send({
      status: 1,
      message: "Fund data Deleted successfully",
      data: deleteFund,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const paymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id>>", id);

    const data = await fundingModel.findById(id);
    console.log("data>>", data);
    if (!data) {
      return res.status(400).send({
        status: 0,
        message: "Cant found funding",
      });
    }
    const status = await fundingModel.findByIdAndUpdate(id,{paymentStatus:"accepted"},{new:true});
    return res.status(200).send({
      status: 1,
      message: "payment Status",
      data: status,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
module.exports = {
  createFund,
  getUserFunds,
  getAdminFunds,
  paymentStatus,
  updateFund,
  deleteFund,
  createFundData,
  getFundData,
  updateFundData,
  deleteFundData,
  recurringFund,
  deleteFunding,
  addRecentFund
};
