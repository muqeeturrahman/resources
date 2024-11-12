const { push_notifications, send_notifications } = require("../config/push_notification.js");
const { User, UserContactsModel } = require("../models/User");
const { SubscriptionModel } = require("../models/User");
const { MainEvent, TemplatSubEevent, SubEvents } = require("../models/CreateEvents");
const { TemplatEevent } = require("../models/CreateEvents");

const { Alarams } = require("../models/CreateEvents");
const { GeneralAlarm } = require("../models/CreateEvents");
const { UserCard } = require("../models/User");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const CronJob = require("cron").CronJob;
var moment = require("moment");
const { sendEmailForEvents } = require("../config/emailForEvents");
const { sendEmailForSubEvents } = require("../config/emailForSubEvents");
const fs = require("fs");

const AWS = require("aws-sdk");
// const { log } = require("console");
// const { fundingsModel } = require("../models/fundings.js");
// const { fundingDataModel } = require("../models/fundDataModel.js");
const { fundingModel } = require("../models/fundingModel.js");

// Configure AWS with your credentials and region
AWS.config.update({
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWS_REGION,
});

// Create an S3 instance
const s3 = new AWS.S3();

// const noti =async ()=>{

//   await push_notifications({user_device_token:"cGt-1amFQX-i1fqUwVtgCG:APA91bGP4qtmcNzFtuokunKlyUv0gr1o4ftvBQXdvA-ceMF-EIEgg8Fs4pFSfofjzfS4AzwHjK1QTCK51ApyS_AXdeOnRPcrYAhiQCKWeVl19PxIw79iHZw8rhZW_71tdD1XXhlQsJgm",
//   title:"title",body:"body"})
// }
// noti()

const timeUpdation = (time, i, j) => {
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

// const sendNotification = async ()=>{
//   const notification_obj = {
//     user_device_token: "eSaOeetO60gdlYRkIOtVe_:APA91bH03Bc_JbRNAm4XgRHaAooGv6c7YUlN_6SzjND_Es1DjzJnhITfWqdYxQHpLxcSOGmfA9yJcIosPO_DX1YaGl4pbR7UMZMG5r27Bh2ZiVKYIhnJmp9lUVtkavyKRx6MiAGdIkUh",
//     title: "Aya alaram",
//     body: "You have created event successfully",
//     type: "event",
//     // payload: user_object,
//   };
//   await push_notifications(notification_obj)
// }
// sendNotification(0)

const create_Main_Events = async (req, res) => {
  try {
    console.log("api is hitting123>>>>>>");




    const {
      title,
      contacts,
      select_purpose,
      date,
      startTime,
      endTime,
      description,
      select_interval_time,
      alarm_setting,
      recurring,
      select_color,
      template,
      status,
      until,
      deviceTimeZone,
    } = req.body;
    console.log(startTime, endTime, date);

    const mainEventPost = new MainEvent({
      user_id: req.user._id,
      date: date.split(" ")[0],
      startTime: startTime,
      endTime: endTime,
      title: title,
      select_purpose: select_purpose,
      description: description,
      select_interval_time: select_interval_time,
      alarm_setting: alarm_setting,
      recurring: recurring,
      select_color: select_color,
      status: status,
      template: template !== undefined || null || "" ? template : false,
      contacts: contacts,
    });
    const newmainEventPost = await mainEventPost.save();

    if (recurring == "daily") {
      const date1 = new Date(date);
      const date2 = new Date(until);
      const diffTime = Math.abs(date2 - date1);
      const noOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      for (var i = 0; i < noOfDays; i++) {
        const mainEvent = new MainEvent({
          user_id: req.user._id,
          date: timeUpdation(date, i + 1, 2).split(" ")[0],
          startTime: timeUpdation(startTime, i + 1, 2),
          endTime: timeUpdation(endTime, i + 1, 2),
          title: title,
          select_purpose: select_purpose,
          description: description,
          select_interval_time: select_interval_time,
          alarm_setting: alarm_setting,
          recurring: recurring,
          select_color: select_color,
          status: status,
          template: template !== undefined || null || "" ? template : false,
          contacts: contacts,
        });

        await mainEvent.save();
      }
    }

    if (recurring == "monthly") {
      var startYear = new Date(date).getFullYear();
      var startMonth = new Date(date).getMonth();
      var endYear = new Date(until).getFullYear();
      var endMonth = new Date(until).getMonth();
      const noOfmonths = (endYear - startYear) * 12 + (endMonth - startMonth);
      for (var i = 0; i < noOfmonths; i++) {
        const mainEvent = new MainEvent({
          user_id: req.user._id,
          date: timeUpdation(date, i + 1, 1).split(" ")[0],
          startTime: timeUpdation(startTime, i + 1, 1),
          endTime: timeUpdation(endTime, i + 1, 1),
          title: title,
          select_purpose: select_purpose,
          description: description,
          select_interval_time: select_interval_time,
          alarm_setting: alarm_setting,
          recurring: recurring,
          select_color: select_color,
          status: status,
          template: template !== undefined || null || "" ? template : false,
          contacts: contacts,
        });

        await mainEvent.save();
      }
    }

    if (recurring == "weekly") {
      var timeDifference = new Date(until).getTime() - new Date(date).getTime();
      var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
      var noOfweeks = Math.floor(timeDifference / millisecondsPerWeek);

      for (var i = 0; i < noOfweeks; i++) {
        const mainEvent = new MainEvent({
          user_id: req.user._id,
          //date:await timeUpdation(startTime, i + 1, 1).split(" ")[0],
          date: timeUpdation(date, (i + 1) * 7, 2).split(" ")[0],
          startTime: timeUpdation(startTime, (i + 1) * 7, 2),
          endTime: timeUpdation(endTime, (i + 1) * 7, 2),
          title: title,
          select_purpose: select_purpose,
          description: description,
          select_interval_time: select_interval_time,
          alarm_setting: alarm_setting,
          recurring: recurring,
          select_color: select_color,
          status: status,
          template: template !== undefined || null || "" ? template : false,
          contacts: contacts,
        });

        await mainEvent.save();
      }
    }

    const UserContacts = await UserContactsModel.find({
      _id: { $in: contacts },
      isDeleted: false,
    });
    UserContacts.map((item) => {
      sendEmailForEvents(item.email, newmainEventPost, deviceTimeZone);
    });
    sendEmailForEvents(
      req.user._doc.user_email,
      newmainEventPost,
      deviceTimeZone
    );

    if (template == true) {
      let temp = await TemplatEevent.find({ user_id: req.user.id }); // find all the template 
      var order = temp.length+1
      const templateEventPost = new TemplatEevent();
      templateEventPost.main_event = newmainEventPost._id;
      templateEventPost.contacts = contacts;
      templateEventPost.select_purpose = select_purpose;
      templateEventPost.description = description;
      templateEventPost.user_id = req.user._id;
      templateEventPost.recurring = recurring;
      templateEventPost.select_color = select_color;
      templateEventPost.title = title;
      templateEventPost.order = order;
      templateEventPost.select_interval_time = select_interval_time;
      // templateEventPost.user_email = req.user._doc.user_email;
      await templateEventPost.save();
    }
    let titl = req.user.full_name
    console.log(titl, "title>>>>>");

    const notification_obj = {
      title: titl,
      body: "You have created event successfully",

    };
    const data = {
      title: titl,
      body: "You have created event successfully",
      type: "event",

    };
    let loginUser = await User.findOne({ _id: req.user._id }).populate({ path: "devices", select: "deviceToken" })



    let tokens = Array.from(new Set(
      loginUser?.devices?.map(e => e?.deviceToken)
    ));


    if (loginUser?.notification == "on" || loginUser?.is_notification == 1) {
      console.log("inside the cond");

      await send_notifications(tokens, notification_obj, data)
      // await push_notifications(notification_obj);
    }

    if (newmainEventPost) {
      return res.status(200).send({
        status: 1,
        message: "You have created main event",
        data: newmainEventPost,
      });
    }
  } catch (e) {
    return res
      .status(400)
      .send({ status: 0, message: "Failed alarm creation in catch error" });
  }
};

const create_main_event_by_template_event = async (req, res) => {
  try {
    const {
      title,
      select_purpose,
      startTime,
      endTime,
      description,
      select_interval_time,
      alarm_setting,
      recurring,
      select_color,
      template,
      status,
      contacts,
      date,
      until,
      deviceTimeZone,
    } = req.body;

    const templateEventFind = await TemplatEevent.findOne({
      _id: req.body.tempEventId,
      isDeleted: false,
    }).populate("sub_events");

    if (!templateEventFind) {
      return res.status(400).send({
        status: 0,
        message: "Wrong Template Event ID",
      });
    }

    const mainEventPost = new MainEvent({
      user_id: req.user._id,
      date: date.split(" ")[0],
      startTime: startTime,
      endTime: endTime,
      title: title,
      select_purpose: select_purpose,
      // templateId: tempEventId,
      // phone_number: phone_number,
      description: description,
      select_interval_time: select_interval_time,
      alarm_setting: alarm_setting,
      recurring: recurring,
      select_color: select_color,
      status: status,
      // user_email: req.user._doc.user_email,
      template: template,
      contacts: contacts,
    });
    const newmainEventPost = await mainEventPost.save();

    if (template == true) {

      let temp = await TemplatEevent.find({ user_id: req.user.id }); // find all the template 
      var order = temp.length+1
      const templateEventPost = new TemplatEevent();
      templateEventPost.main_event = newmainEventPost._id;
      templateEventPost.contacts = contacts;
      templateEventPost.select_purpose = select_purpose;
      templateEventPost.description = description;
      templateEventPost.user_id = req.user._id;
      templateEventPost.recurring = recurring;
      templateEventPost.select_color = select_color;
      templateEventPost.title = title;
      templateEventPost.select_interval_time = select_interval_time;
      templateEventPost.order = order;
      
      await templateEventPost.save();
    }

    if (recurring == "daily") {
      const date1 = new Date(date);
      const date2 = new Date(until);
      const diffTime = Math.abs(date2 - date1);
      const noOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      for (var i = 0; i < noOfDays; i++) {
        const mainEvent = new MainEvent({
          user_id: req.user._id,
          date: timeUpdation(startTime, i + 1, 2).split(" ")[0],
          startTime: timeUpdation(startTime, i + 1, 2),
          endTime: timeUpdation(endTime, i + 1, 2),
          title: title,
          select_purpose: select_purpose,
          description: description,
          select_interval_time: select_interval_time,
          alarm_setting: alarm_setting,
          recurring: recurring,
          select_color: select_color,
          status: status,
          template: template !== undefined || null || "" ? template : false,
          contacts: contacts,
        });

        await mainEvent.save();
      }
    }

    if (recurring == "monthly") {
      var startYear = new Date(date).getFullYear();
      var startMonth = new Date(date).getMonth();
      var endYear = new Date(until).getFullYear();
      var endMonth = new Date(until).getMonth();
      const noOfmonths = (endYear - startYear) * 12 + (endMonth - startMonth);
      for (var i = 0; i < noOfmonths; i++) {
        const mainEvent = new MainEvent({
          user_id: req.user._id,
          //date:await timeUpdation(startTime, i + 1, 2).split(" ")[0],
          date: timeUpdation(startTime, i + 1, 1).split(" ")[0],
          startTime: timeUpdation(startTime, i + 1, 1),
          endTime: timeUpdation(endTime, i + 1, 1),
          title: title,
          select_purpose: select_purpose,
          description: description,
          select_interval_time: select_interval_time,
          alarm_setting: alarm_setting,
          recurring: recurring,
          select_color: select_color,
          status: status,
          template: template !== undefined || null || "" ? template : false,
          contacts: contacts,
        });

        await mainEvent.save();
      }
    }

    if (recurring == "weekly") {
      var timeDifference = new Date(until).getTime() - new Date(date).getTime();
      var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
      var noOfweeks = Math.floor(timeDifference / millisecondsPerWeek);

      for (var i = 0; i < noOfweeks; i++) {
        const mainEvent = new MainEvent({
          user_id: req.user._id,
          //   date:await (startTime, i + 1, 2).split(" ")[0],
          date: timeUpdation(startTime, (i + 1) * 7, 2).split(" ")[0],
          startTime: timeUpdation(startTime, (i + 1) * 7, 2),
          endTime: timeUpdation(endTime, (i + 1) * 7, 2),
          title: title,
          select_purpose: select_purpose,
          description: description,
          select_interval_time: select_interval_time,
          alarm_setting: alarm_setting,
          recurring: recurring,
          select_color: select_color,
          status: status,
          template: template !== undefined || null || "" ? template : false,
          contacts: contacts,
        });

        await mainEvent.save();
      }
    }

    const userFind = await User.findById({ _id: req.user._id }).populate({ path: "devices", select: "deviceToken" })
    let tokens = Array.from(new Set(
      userFind.devices.map(e => e.deviceToken)
    ));
    const notification_obj = {
      // user_device_token: userFind.user_device_token,
      title: userFind.full_name,
      body: "You have created event successfully",

    };
    console.log();

    let data = {
      title: userFind.full_name,
      body: "You have created event successfully",
      type: "event",
    };

    if (userFind.notification == "on" || userFind.is_notification == 1) {
      await send_notifications(tokens, notification_obj, data)
      // await push_notifications(notification_obj);
    }

    sendEmailForEvents(
      req.user._doc.user_email,
      newmainEventPost,
      deviceTimeZone
    );

    //     if (sub_events.length > 0) {
    //       sub_events.map(async (element, i) => {
    //         const subdate = new Date(
    //           new Date(date).getTime() + element.no_of_days * 24 * 60 * 60 * 1000
    //         );

    //         var st = element.startTime.match(/(\d+)\:(\d+) (\w+)/);
    //         if(st!=null){
    //           var hours1 = /AM/i.test(st[3])
    //               ? parseInt(st[1], 10)
    //               : parseInt(st[1], 10) + 12,
    //             minutes1 = parseInt(st[2]);
    //           element.startTime = new Date(
    //             new Date(
    //               new Date(subdate).getTime() +
    //                 minutes1 * 60 * 1000 +
    //                 hours1 * 60 * 60 * 1000
    //             )
    //           );
    //           var et = element.endTime.match(/(\d+)\:(\d+) (\w+)/);
    //           var hours1 = /AM/i.test(et[3])
    //               ? parseInt(et[1], 10)
    //               : parseInt(et[1], 10) + 12,
    //             minutes1 = parseInt(et[2]);
    //           element.endTime = new Date(
    //             new Date(
    //               new Date(subdate).getTime() +
    //                 minutes1 * 60 * 1000 +
    //                 hours1 * 60 * 60 * 1000
    //             )
    //           );
    //         }else{

    //           var da = new Date((new Date(element.startTime)))

    //           element.startTime= subdate.setHours(da.getHours())
    //           element.startTime= subdate.setMinutes(da.getMinutes())
    //           element.startTime= subdate.setSeconds(da.getSeconds())

    //           var da1 = new Date(moment.utc(element.endTime).format("YYYY-MM-DD HH:mm:ss"))
    //           element.endTime= subdate.setHours(da1.getHours())
    //           element.endTime= subdate.setMinutes(da1.getMinutes())
    //           element.endTime= subdate.setSeconds(da1.getSeconds())

    //         }

    //         // const _el = new SubEvents({
    //         //   user_id: req.user._id,
    //         //   main_event_id: newmainEventPost._id,
    //         //   date: subdate,
    //         //   startTime: moment
    //         //     .utc(element.startTime)
    //         //     .format("YYYY-MM-DD HH:mm:ss"),
    //         //   endTime: moment.utc(element.endTime).format("YYYY-MM-DD HH:mm:ss"),
    //         //   title: templateEventFind.title,
    //         //   select_purpose: templateEventFind.select_purpose,
    //         //   // select_duration: element.select_duration,
    //         //   // address: element.address,
    //         //   // phone_number: phone_number,
    //         //   description: templateEventFind.description,
    //         //   select_interval_time: element.select_interval_time,
    //         //   // alarm_setting: element.alarm_setting,
    //         //   recurring: element.recurring,
    //         //   select_color: templateEventFind.select_color,
    //         //   status: status,
    //         //   // user_email: req.user._doc.user_email,
    //         // });

    //         // const el = await _el.save();
    //         // newmainEventPost.sub_events.push(el);
    //         // await MainEvent.findOneAndUpdate(
    //         //   { _id: newmainEventPost._id },
    //         //   {
    //         //     $push: {
    //         //       sub_events: el._id,
    //         //     },
    //         //   }
    //         // );

    //         if (!sub_events[i + 1]) {
    //           if (newmainEventPost) {
    //             return res.status(200).send({
    //               status: 1,
    //               message: "You have created main event Successfully.",
    //               data: newmainEventPost,
    //             });
    //           } else {
    //             return res.status(200).send({
    //               status: 0,
    //               message: "Error Occured while creating main event",
    //               data: newmainEventPost,
    //             });
    //           }
    //         }
    //       });
    //     } else {
    //     }
    if (newmainEventPost) {
      return res.status(200).send({
        status: 1,
        message: "You have created main event Successfully.",
        data: newmainEventPost,
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "Error Occured while creating main event",
        data: newmainEventPost,
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

// create_alaram by some loop
const create_alaram = async (req, res) => {
  try {
    const { main_event_id, alarm_time, title } = req.body;
    const myAllAlarams = await Alarams.find({
      main_event_id: main_event_id,
      isDeleted: true,
    });

    if (myAllAlarams.length > 0) {
      let myAllAlaramsByConditions = myAllAlarams.some((item) => {
        const newStartTime = moment(alarm_time).format("YYYY-MM-DD HH:mm:ss");

        const oldEventTime = moment
          .utc(item.alarm_time)
          .format("YYYY-MM-DD HH:mm:ss");

        if (newStartTime == oldEventTime) {
          return true;
        } else {
          return false;
        }
      });

      if (myAllAlaramsByConditions) {
        return res.status(400).send({
          status: 0,
          message: "You have already created alarm at this time for this event",
        });
      } else {
        const createAlaram = new Alarams();
        createAlaram.main_event_id = main_event_id;
        // createAlaram.alarm_time = alarm_time;
        createAlaram.user_id = req.user._id;
        createAlaram.alarm_time = moment(alarm_time).format(
          "YYYY-MM-DD HH:mm:ss[Z]"
        );
        createAlaram.title = title;
        // createAlaram.alarm_time = moment.utc(alarm_time).format("YYYY-MM-DD h:mm:ss");
        createAlaram.attachment = req.file
          ? (await uploadFile(req.file)).Key
          : null;
        const newcreateAlaram = await createAlaram.save();
        const updatemainEvents = await MainEvent.findByIdAndUpdate(
          { _id: req.body.main_event_id, isDeleted: false },
          {
            $push: {
              // sub_events: createreviews._id.toHexString()
              alarm_setting: newcreateAlaram._id,
            },
          },
          { new: true }
        );
        if (newcreateAlaram) {
          return res.status(200).send({
            status: 1,
            message: "You have created alarm Successfully.",
            data: newcreateAlaram,
          });
        }
      }
    } else {
      const createAlaram = new Alarams();
      createAlaram.main_event_id = main_event_id;
      createAlaram.user_id = req.user._id;
      // createAlaram.alarm_time = alarm_time;
      createAlaram.alarm_time = moment(alarm_time).format(
        "YYYY-MM-DD HH:mm:ss[Z]"
      );
      createAlaram.title = title;
      // createAlaram.alarm_time = moment.utc(alarm_time).format("YYYY-MM-DD h:mm:ss");
      createAlaram.attachment = req.file ? req.file?.path : req.body.attachment;
      const newcreateAlaram = await createAlaram.save();
      const updatemainEvents = await MainEvent.findByIdAndUpdate(
        { _id: req.body.main_event_id, isDeleted: false },
        {
          $push: {
            // sub_events: createreviews._id.toHexString()
            alarm_setting: newcreateAlaram._id,
          },
        },
        { new: true }
      );
      if (newcreateAlaram) {
        return res.status(200).send({
          status: 1,
          message: "You have created alarm Successfully.",
          data: newcreateAlaram,
        });
        // res.status(200).json({ message: 'You have created alaram Successfully.', data: newcreateAlaram });
        // res.status(200).json({ message: 'You have created alaram Successfully.' });
        // res.send("You have created alaram Successfully")
      }
    }
  } catch (e) {
    console.log(e);
    return res.status(200).json({ message: e.message });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file?.path, (err) => { });
    }
  }
};

// create_Sub_Events
const create_Sub_Events = async (req, res) => {
  try {
    const {
      main_event_id,
      title,
      select_status,
      select_interval_time,
      recurring,
      select_color,
      date,

      startTime,
      endTime,
      until,
      // address,
      description,
      select_purpose,
      mainEventDate,
      localStartTime,
      localEndTime,
      deviceTimeZone,
    } = req.body;

    // var st = startTime.match(/(\d+)\:(\d+) (\w+)/);
    // var hours1 = /AM/i.test(st[3])
    //     ? parseInt(st[1], 10)
    //     : parseInt(st[1], 10) + 12,
    //   minutes1 = parseInt(st[2]);
    // startTime = new Date(
    //   new Date(
    //     new Date(date).getTime() +
    //       minutes1 * 60 * 1000 +
    //       hours1 * 60 * 60 * 1000
    //   )
    // );
    // var et = endTime.match(/(\d+)\:(\d+) (\w+)/);
    // var hours1 = /AM/i.test(et[3])
    //     ? parseInt(et[1], 10)
    //     : parseInt(et[1], 10) + 12,
    //   minutes1 = parseInt(et[2]);
    // endTime = new Date(
    //   new Date(
    //     new Date(date).getTime() +
    //       minutes1 * 60 * 1000 +
    //       hours1 * 60 * 60 * 1000
    //   )
    // );
    const subEventPost = new SubEvents();
    subEventPost.main_event_id = main_event_id;
    subEventPost.user_id = req.user._id;
    subEventPost.title = title;
    subEventPost.description = description;
    subEventPost.select_status = select_status;
    subEventPost.date = date.split(" ")[0];
    subEventPost.startTime = startTime; // Assign startTime as it is
    subEventPost.endTime = endTime; // Assign endTime as it is
    subEventPost.select_interval_time = select_interval_time;
    subEventPost.recurring = recurring;
    subEventPost.select_color = select_color;
    subEventPost.select_purpose = select_purpose;
    const newsubEventPost = await subEventPost.save();

    if (recurring == "daily") {
      const date1 = new Date(date);
      const date2 = new Date(until);
      const diffTime = Math.abs(date2 - date1);
      const noOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      for (var i = 0; i < noOfDays; i++) {
        var subEvent = new SubEvents({
          main_event_id: main_event_id,
          user_id: req.user._id,
          date: timeUpdation(startTime, i + 1, 2).split(" ")[0],
          startTime: timeUpdation(startTime, i + 1, 2),
          endTime: timeUpdation(endTime, i + 1, 2),
          title: title,
          select_purpose: select_purpose,
          description: description,
          select_interval_time: select_interval_time,
          recurring: recurring,
          select_color: select_color,
        });
        subEvent = await subEvent.save();
        await MainEvent.findByIdAndUpdate(
          req.body.main_event_id,
          {
            $push: {
              // sub_events: createreviews._id.toHexString()
              sub_events: subEvent._id,
            },
          },
          { new: true }
        );
      }
    }

    if (recurring == "monthly") {
      var startYear = new Date(date).getFullYear();
      var startMonth = new Date(date).getMonth();
      var endYear = new Date(until).getFullYear();
      var endMonth = new Date(until).getMonth();
      const noOfmonths = (endYear - startYear) * 12 + (endMonth - startMonth);
      for (var i = 0; i < noOfmonths; i++) {
        var subEvent = new SubEvents({
          main_event_id: main_event_id,
          user_id: req.user._id,
          //date: new Date(
          //    new Date(date).setDate(new Date(date).getDate() + i + 1)
          //),
          date: timeUpdation(startTime, i + 1, 1).split(" ")[0],
          startTime: timeUpdation(startTime, i + 1, 1),
          endTime: timeUpdation(endTime, i + 1, 1),
          title: title,
          select_purpose: select_purpose,
          description: description,
          select_interval_time: select_interval_time,
          recurring: recurring,
          select_color: select_color,
        });

        subEvent = await subEvent.save();
        await MainEvent.findByIdAndUpdate(
          req.body.main_event_id,
          {
            $push: {
              // sub_events: createreviews._id.toHexString()
              sub_events: subEvent._id,
            },
          },
          { new: true }
        );
      }
    }

    if (recurring == "weekly") {
      var timeDifference = new Date(until).getTime() - new Date(date).getTime();
      var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
      var noOfweeks = Math.floor(timeDifference / millisecondsPerWeek);

      for (var i = 0; i < noOfweeks; i++) {
        var subEvent = new SubEvents({
          main_event_id: main_event_id,

          user_id: req.user._id,
          //   date: new Date(
          //     new Date(date).setDate(new Date(date).getDate() + i + 1)
          //   ),
          date: timeUpdation(startTime, (i + 1) * 7, 2).split(" ")[0],
          startTime: timeUpdation(startTime, (i + 1) * 7, 2),
          endTime: timeUpdation(endTime, (i + 1) * 7, 2),
          title: title,
          select_purpose: select_purpose,
          description: description,
          select_interval_time: select_interval_time,
          recurring: recurring,
          select_color: select_color,
        });
        subEvent = await subEvent.save();

        await MainEvent.findByIdAndUpdate(
          req.body.main_event_id,
          {
            $push: {
              // sub_events: createreviews._id.toHexString()
              sub_events: subEvent._id,
            },
          },
          { new: true }
        );
      }
    }

    const Event = await MainEvent.findOne({
      _id: main_event_id,
      isDeleted: false,
    }).populate({
      path: "contacts",
      populate: { path: "user_id" },
    });

    Event?.contacts.map((item) => {
      sendEmailForSubEvents(
        item.user_id.user_email,
        newsubEventPost,
        deviceTimeZone
      );
    });
    sendEmailForSubEvents(
      req.user._doc.user_email,
      newsubEventPost,
      deviceTimeZone
    );
    // newsubEventPost.sub_events.push(newsubEventPost._id)

    await MainEvent.findByIdAndUpdate(
      req.body.main_event_id,
      {
        $push: {
          // sub_events: createreviews._id.toHexString()
          sub_events: newsubEventPost._id,
        },
      },
      { new: true }
    );
    // for adding in template events

    // template
    // const mainEvent = await MainEvent.findById(req.body.main_event_id);

    let template = Event?.template;

    if (template == true) {
      const TemplateEvent = await TemplatEevent.find({
        main_event: main_event_id,
        isDeleted: false,
      });

      const date1 = new Date(mainEventDate.split(" ")[0]);
      const date2 = new Date(localStartTime.split(" ")[0]);
      const diffTime = Math.abs(date2 - date1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      TemplateEvent.map(async (item, index) => {
        var st = localStartTime;
        st = st.split(" ")[1].split(":");

        if (parseInt(st[0]) > 12) {
          st[0] = parseInt(st[0]) - 12;

          st = st[0] + ":" + st[1] + " PM";
        } else {
          st = st[0] + ":" + st[1] + " AM";
        }

        var et = localEndTime;
        et = et.split(" ")[1].split(":");

        if (parseInt(et[0]) > 12) {
          et[0] = parseInt(et[0]) - 12;

          et = et[0] + ":" + et[1] + " PM";
        } else {
          et = et[0] + ":" + et[1] + " AM";
        }

        var subeventdata = new TemplatSubEevent({
          main_event: item._id,
          no_of_days: diffDays,
          rank: index + 1,
          startTime: st,
          endTime: et,
          select_interval_time: select_interval_time,
          recurring: recurring,
          select_purpose: select_purpose,
          description: description,
          select_color: select_color,
        });
        subeventdata = await subeventdata.save();

        await TemplatEevent.findByIdAndUpdate(
          item._id,
          {
            $push: {
              sub_events: subeventdata._id,
            },
          },
          { new: true }
        );
      });
    }
    // notication send on user device
    const userFind = await User.findById({ _id: req.user._id }).populate({ path: "devices", select: "deviceToken" })

    const notification_obj = {
      title: userFind.full_name,
      body: "You have created event successfully",
    };

    let data = {
      title: userFind.full_name,
      body: "You have created event successfully",
      type: "event",
    };
    let tokens = Array.from(new Set(
      userFind?.devices?.map(e => e?.deviceToken)
    ));
    if (userFind?.notification == "on" || userFind?.is_notification == 1) {
      // await push_notifications(notification_obj);
      await send_notifications(tokens, notification_obj, data)
    }

    if (newsubEventPost) {
      return res.status(200).send({
        status: 1,
        message: "You have created sub event Successfully.",
        data: newsubEventPost,
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const get_main_events = async (req, res) => {
  try {
    // const { currentPage = 0, status, itemsPerPage = 10 } = req.query;
    // const finalCurrentPage = Number(currentPage) ? Number(currentPage) - 1 : 0;

    console.log(itemsPerPage);
    let mainEvents = await MainEvent.find({ isDeleted: false })
      .populate(["alarm_setting", "contacts", "sub_events"])
      .sort({ date: -1 });
    // .skip(finalCurrentPage * Number(itemsPerPage))
    // .limit(Number(itemsPerPage));

    // console.log(finalCurrentPage * Number(itemsPerPage))
    // console.log(Number(currentPage) )

    if (mainEvents.length > 0) {
      mainEvents = mainEvents.map((item) => {
        if (item.sub_events.length > 0) {
          item._doc.sub_events = item._doc.sub_events.map((val) => {
            return {
              ...val._doc,
              startTime: new Date(moment.utc(val.startTime)),
              endTime: new Date(moment.utc(val.endTime)),
            };
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

const getSubEventsById = async (req, res) => {
  try {
    const { id } = req.params;
    let subEvent = await SubEvents.findById(id);
    if (subEvent) {
      return res.status(200).send({
        status: 1,
        message: "Sub Event Found!",
        data: subEvent,
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "Sub Event Not Exist",
      });
    }
  } catch (e) {
    return res
      .status(400)
      .send({ status: 0, message: "Main Event Get  Failed!" });
  }
};

const get_main_events_by_event_id = async (req, res) => {
  try {
    let mainEvents = await MainEvent.find({
      _id: req.params.mainEventId,
      isDeleted: false,
    })
      .populate([
        {
          path: "alarm_setting",
          match: { isDeleted: false },
        },
        {
          path: "sub_events",
          match: { isDeleted: false },
        },
      ])
      .sort({ startTime: 1 });

    // .populate({
    //     path: 'alarm_setting',
    //     match: { isDeleted: false }
    // })
    // .populate({
    //     path: 'sub_events',
    //     match: { isDeleted: false }
    // })
    if (mainEvents.length > 0) {
      mainEvents = mainEvents.map((item) => {
        if (item.sub_events.length > 0) {
          item._doc.sub_events = item._doc.sub_events.map((val) => {
            return {
              ...val._doc,
              startTime: new Date(moment.utc(val.startTime)),
              endTime: new Date(moment.utc(val.endTime)),
            };
          });
        }
        return {
          ...item._doc,
          startTime: new Date(moment.utc(item.startTime)),
          endTime: new Date(moment.utc(item.endTime)),
        };
      });
      // return res.status(400).send({
      //     status: 0,
      //     message: "Main Events Not Found!",
      //     // data: mainEvents,
      // });
      return res.status(200).send({
        status: 1,
        message: "Main Event Found!",
        data: mainEvents,
      });
    } else {
      return res.status(400).send({
        status: 0,
        message: "Main Event Not Found!",
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
      .send({ status: 0, message: "Main Event Get  Failed!" });
  }
};

const get_main_events_by_user_id = async (req, res, next) => {
  try {
    const data = [];

    const mainEvents = await MainEvent.find({
      user_id: req.user._id,
      isDeleted: false,
    })
      .populate({
        path: "sub_events",
        select: "-__v -createdAt -updatedAt -user_id",
      })
      .select("-__v -updatedAt")
      .sort({ createdAt: -1 });

    mainEvents.map((m) => {
      data.push(m);
      if (m.sub_events.length > 0) {
        m.sub_events.map((s) => {
          if (s.isDeleted == false) {
            data.push(s)
          }

        });
        delete m._doc.sub_events;
      }
    });

    if (data.length === 0) {
      return res
        .status(404)
        .send({ status: 0, message: "No main events found" });
    }

    return res
      .status(200)
      .send({ status: 1, message: "Main events found", data: data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
};
const todayEvents = async (req, res, next) => {
  try {
    const { filter } = req.body;
    let data = [];
    if (filter == "today") {
      const date = new Date()
      console.log("date", date);
      const day = date.toISOString().toString().split("T")[0];
      const stringDay = "\"" + day.toString() + "\"";

      const mainEvents = await MainEvent.find({
        user_id: req.user._id,
        date: day,
        isDeleted: false,
      }).sort({ date: 1 })
      const subEvents = await SubEvents.find({
        user_id: req.user._id,
        date: day,
        isDeleted: false,
      }).sort({ date: 1 })

      // .populate({
      //   path: "sub_events",
      //   select: "-__v -createdAt -updatedAt -user_id",
      // })
      // .select("-__v -updatedAt")
      // .sort({ createdAt: -1 });

      mainEvents.map((m) => {
        delete m._doc.sub_events;
        data.push(m);

      });
      if (subEvents.length > 0) {
        subEvents.map((s) => {

          data.push(s)

        });
        //  delete m._doc.sub_events;
      }
      data.sort((a, b) => new Date(a.date) - new Date(b.date));

      return res
        .status(200)
        .send({ status: 1, message: "today Events", data: data });
    }
    if (filter == "upcoming") {
      let data = [];
      const currentDate = new Date();
      console.log("currentDate", currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
      const nextSevenDays = new Date(currentDate);
      nextSevenDays.setDate(nextSevenDays.getDate() + 6);

      const startDate = currentDate.toISOString().split("T")[0];
      const endDate = nextSevenDays.toISOString().split("T")[0];
      console.log("startDtae", startDate);
      console.log("endDate", endDate);

      const mainEvents = await MainEvent.find({
        user_id: req.user._id,
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }).sort({ date: 1 })
      const subEvents = await SubEvents.find({
        user_id: req.user._id,
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }).sort({ date: 1 })
      console.log(subEvents.length, "subEvents>>>");
      mainEvents.map((m) => {
        delete m._doc.sub_events;
        data.push(m);

      });
      if (subEvents.length > 0) {
        subEvents.map((s) => {

          data.push(s)

        });
        //  delete m._doc.sub_events;
      }
      data.sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log(data);


      // mainEvents.map((m) => {
      //   data.push(m);
      //   if (m.sub_events.length > 0) {
      //     m.sub_events.map((s) => {
      //       if (s.isDeleted == false) { 
      //         data.push(s) 
      //       }

      //     });
      //     delete m._doc.sub_events;
      //   }
      // });

      return res
        .status(200)
        .send({ status: 1, message: "upcoming Events", data: data });
    }
    if (filter == "future") {
      const data = [];
      const currentDate = new Date();
      console.log("currentDate", currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
      const nextSevenDays = new Date(currentDate);
      nextSevenDays.setDate(nextSevenDays.getDate() + 6);


      const startDate = currentDate.toISOString().split("T")[0];
      const endDate = nextSevenDays.toISOString().split("T")[0];
      console.log("startDate", startDate);
      console.log("endDate", endDate);

      const mainEvents = await MainEvent.find({
        user_id: req.user._id,
        date: { $gte: endDate },
        isDeleted: false
      }).sort({ date: 1 })
      const subEvents = await SubEvents.find({
        user_id: req.user._id,
        date: { $gte: endDate },
        isDeleted: false
      }).sort({ date: 1 })
      mainEvents.map((m) => {
        delete m._doc.sub_events;
        data.push(m);

      });
      if (subEvents.length > 0) {
        subEvents.map((s) => {

          data.push(s)

        });
        //  delete m._doc.sub_events;
      }
      data.sort((a, b) => new Date(a.date) - new Date(b.date));
      // .populate({
      //   path: "sub_events",
      //   select: "-__v -createdAt -updatedAt -user_id",
      // })
      // .select("-__v -updatedAt")
      // .sort({ date: 1 });

      // mainEvents.map((m) => {
      //   data.push(m);
      //   if (m.sub_events.length > 0) {
      //     m.sub_events.map((s) => {
      //       if (s.isDeleted == false) { 
      //         data.push(s) 
      //       }

      //     });
      //     delete m._doc.sub_events;
      //   }
      // });
      return res
        .status(200)
        .send({ status: 1, message: "future Events", data: data });
    }

    return res
      .status(200)
      .send({ status: 1, message: "today Events", data: mainEvents });
  }
  catch (err) {
    console.log(err);
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
}
const upcomingWeekEvents = async (req, res, next) => {
  try {

    const date = new Date()
    console.log("date", date);
    const day = date.toISOString().toString().split("T")[0];
    // const stringDay = "\"" + day.toString() + "\""; // Wrapping day into string
    const weekStart = day.slice(8)
    weekStart += 6
    console.log("weekStart", weekStart);
    console.log("wholeweek", wholeweek);

    const mainEvents = await MainEvent.find({
      user_id: req.user._id,
      date: day,
      isDeleted: false,
    })


    console.log("day", day);
    console.log("mainEvents", mainEvents);
    console.log("req.user._id", req.user._id);

    return res
      .status(200)
      .send({ status: 1, message: "upcoming Week Events", data: mainEvents });
  }
  catch (err) {
    console.log(err);
    return res.status(500).send({ status: 0, message: "Something went wrong" });
  }
}
const get_filtered_main_events = async (req, res) => {
  try {
    const { status, searchString } = req.body;
    const user = req.user;
    if (!user)
      return res.status(401).send({ status: 0, message: "User not found" });
    const query = { isDeleted: false, user_id: user._id };
    if (status) query.status = status;
    if (searchString) query.title = { $regex: searchString, $options: "i" };
    let mainEvents = await MainEvent.find(query)
      .populate(["alarm_setting", "sub_events"])
      .sort({ startTime: 1 });
    if (mainEvents.length > 0) {
      return res
        .status(200)
        .send({ status: 1, message: "Main Events Found!", data: mainEvents });
    } else {
      return res
        .status(404)
        .send({ status: 0, message: "No events found for specified filters!" });
    }
  } catch (e) {
    return res
      .status(500)
      .send({ status: 0, message: "Internal Server Error" });
  }
};

const edit_main_event_by_event_id = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(400)
        .send({ status: 0, message: "Authentication Field is required" });
    } else {
      // if(req.body.startTime && req.body.endTime){
      //   var {startTime, endTime} = req.body
      //   var st = startTime.match(/(\d+)\:(\d+) (\w+)/);
      //     var hours1 = /AM/i.test(st[3])
      //         ? parseInt(st[1], 10)
      //         : parseInt(st[1], 10) + 12,
      //       minutes1 = parseInt(st[2]);
      //     startTime = new Date(
      //       new Date(
      //         new Date(date).getTime() +
      //           minutes1 * 60 * 1000 +
      //           hours1 * 60 * 60 * 1000
      //       )
      //     );
      //     var et = endTime.match(/(\d+)\:(\d+) (\w+)/);
      //     var hours1 = /AM/i.test(et[3])
      //         ? parseInt(et[1], 10)
      //         : parseInt(et[1], 10) + 12,
      //       minutes1 = parseInt(et[2]);
      //     endTime = new Date(
      //       new Date(
      //         new Date(date).getTime() +
      //           minutes1 * 60 * 1000 +
      //           hours1 * 60 * 60 * 1000
      //       )
      //     );

      // }

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
        { _id: req.params.mainEventId },
        object_update,
        { new: true }
      );
      // const editMainEvent = await User.save();
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
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const edit_subevent = async (req, res) => {
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
      const editSubEventValues = await SubEvents.findByIdAndUpdate(
        { _id: req.params.sub_event_id },
        object_update,
        { new: true }
      );
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

// const edit_templateEvent = async (req, res) => {
//   try {
//     if (!req.headers.authorization) {
//       return res
//         .status(400)
//         .send({ status: 0, message: "Authentication Field is required" });
//     } else {
//       const object_update = {
//         title: req.body.title,
//         notification_time: req.body.select_interval_time,
//         recurring: req.body.recurring,
//         select_color: req.body.select_color,
//         // address: req.body.address,

//         description: req.body.description,
//         user_email: req.user._doc.user_email,
//         select_purpose: req.body.select_purpose,
//       };
//       for (const key in object_update) {
//         if (object_update[key] === "" || object_update[key] === undefined) {
//           delete object_update[key];
//         }
//       }
//       const editTemplateEventValues = await TemplatEevent.findByIdAndUpdate(
//         { _id: req.params.template_event_id },
//         object_update,
//         { new: true }
//       );
//       if (!editTemplateEventValues) {
//         return res.status(400).json({
//           status: 0,
//           message: "Templat Event not found",
//           // data: events,
//         });
//       } else if (editTemplateEventValues) {
//         return res.status(200).send({
//           status: 1,
//           message: "Templat Event Update Successfully.",
//           data: editTemplateEventValues,
//         });
//       } else {
//         return res.status(400).send({
//           status: 0,
//           message: "Templat Event Not Update Successfully.",
//         });
//       }
//     }
//   } catch (e) {
//     return res.status(400).send({ status: 0, message: e.message });
//   }
// };

const edit_alarm = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(400)
        .send({ status: 0, message: "Authentication Field is required" });
    } else {
      const AlaramData = await Alarams.findById(req.params.alarm_id);
      if (AlaramData.attachment && req.file) {
        const params = {
          Bucket: process.env.BUCKET,
          Key: AlaramData.attachment,
        };

        s3.deleteObject(params, (err, data) => {
          if (err) {
            console.error("Error deleting the image:", err);
          } else {
          }
        });
      }
      const object_update = {
        // alarm_time: req.body.alarm_time,
        alarm_time: moment(req.body.alarm_time).format(
          "YYYY-MM-DD HH:mm:ss[Z]"
        ),
        // alarm_time: moment.utc(req.body.alarm_time).format("YYYY-MM-DD h:mm:ss"),
        attachment: req.file ? (await uploadFile(req.file)).Key : "",
        title: req.body.title,
      };
      for (const key in object_update) {
        if (object_update[key] === "" || object_update[key] === undefined) {
          delete object_update[key];
        }
      }
      const editAlarams = await Alarams.findByIdAndUpdate(
        { _id: req.params.alarm_id },
        object_update,
        { new: true }
      );
      if (!editAlarams) {
        return res.status(400).json({
          status: 0,
          message: "Alarm not found",
          // data: events,
        });
      } else if (editAlarams) {
        return res.status(200).send({
          status: 1,
          message: "Alarm Update Successfully.",
          data: editAlarams,
        });
      } else {
        return res
          .status(400)
          .send({ status: 0, message: "Alarm Not Update Successfully." });
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

const del_multiple_main_events = async (req, res) => {
  try {
    const { eventIds, status, isDeleted } = req.body;
    const user = req.user;
    if (!eventIds || eventIds.length === 0) {
      return res.status(400).json({
        status: 0,
        message: "Please provide event ids to delete",
      });
    }
    if (!user) {
      return res.status(404).json({
        status: 0,
        message: "User not found",
      });
    }

    const filter = {
      _id: { $in: eventIds },
      user_id: user._id,
      isDeleted: false,
    };

    var events, subevents;
    if (status && isDeleted) {
      events = await MainEvent.updateMany(
        filter,
        { isDeleted: true, status },
        { new: true }
      );
      subevents = await SubEvents.updateMany(
        {
          main_event_id: { $in: eventIds },
          user_id: user._id,
          isDeleted: false,
        },
        { isDeleted: true, select_status: status },
        { new: true }
      );
    } else if (isDeleted) {
      events = await MainEvent.updateMany(
        filter,
        { isDeleted: true },
        { new: true }
      );
      subevents = await SubEvents.updateMany(
        {
          main_event_id: { $in: eventIds },
          user_id: user._id,
          isDeleted: false,
        },
        { isDeleted: true },
        { new: true }
      );
    } else if (status) {
      events = await MainEvent.updateMany(filter, { status }, { new: true });
      subevents = await SubEvents.updateMany(
        {
          main_event_id: { $in: eventIds },
          user_id: user._id,
          isDeleted: false,
        },
        { select_status: status },
        { new: true }
      );
    }

    if (
      events &&
      events.nModified > 0 &&
      subevents &&
      subevents.nModified > 0
    ) {
      return res.status(200).json({
        status: 1,
        message: "Main event updated successfully.",
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: "Main event not found or has already been deleted",
        // data: events,
      });
    }
  } catch (e) {
    return res.status(500).json({
      status: 0,
      message: "Failed to delete multiple main event",
    });
  }
};

const del_main_event = async (req, res) => {
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
    return res.status(400).json({
      status: 0,
      message: e.message,
    });
  }
};

const del_mul_general_alaram = async (req, res) => {
  try {
    const { alarmIds } = req.body;
    const user = req.user;
    if (!alarmIds || alarmIds.length === 0) {
      return res.status(400).json({
        status: 0,
        message: "Please provide alarm ids to delete",
      });
    }
    if (!user) {
      return res.status(400).json({
        status: 0,
        message: "Please provide user id to delete",
      });
    }

    const filter = {
      _id: { $in: alarmIds },
      user_id: user._id,
      isDeleted: false,
    };
    const alarms = await GeneralAlarm.updateMany(
      filter,
      { isDeleted: true },
      { new: true }
    );

    if (alarms && alarms.nModified > 0) {
      return res.status(200).json({
        status: 1,
        message: "Alarms deleted successfully.",
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: "Alarms not found or has already been deleted",
        // data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Falied to delete multiple alarms/ INTERNAL SERVER ERROR",
    });
  }
};

const del_multiple_alarms = async (req, res) => {
  try {
    const { alarmIds } = req.body;
    const user = req.user;
    if (!alarmIds || alarmIds.length === 0) {
      return res.status(400).json({
        status: 0,
        message: "Please provide alarm ids to delete",
      });
    }
    if (!user) {
      return res.status(400).json({
        status: 0,
        message: "Please provide user id to delete",
      });
    }

    const filter = {
      _id: { $in: alarmIds },
      user_id: user._id,
      isDeleted: false,
    };
    const alarms = await Alarams.updateMany(
      filter,
      { isDeleted: true },
      { new: true }
    );

    if (alarms && alarms.nModified > 0) {
      return res.status(200).json({
        status: 1,
        message: "Alarms delete successfully.",
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: "Alarms not found or has already been deleted",
        // data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Falied to delete multiple alarms/ INTERNAL SERVER ERROR",
    });
  }
};

const del_alaram = async (req, res) => {
  try {
    const events = await Alarams.findByIdAndUpdate(
      { _id: req.params.alarm_id },
      { isDeleted: true },
      { new: true }
    );
    // if (events) {
    if (!events) {
      return res.status(400).json({
        status: 0,
        message: "Alarm  not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "Alarm delete successfully.",
        data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Failed Alarm delete",
    });
  }
};

const del_multiple_sub_events = async (req, res) => {
  try {
    const { subEventIds } = req.body;
    const user = req.user;
    const { isDeleted, status } = req.body;
    if (!subEventIds || subEventIds.length === 0) {
      return res.status(400).json({
        status: 0,
        message: "Please provide sub event ids to delete",
      });
    }
    if (!user) {
      return res.status(404).json({
        status: 0,
        message: "User not found",
      });
    }
    const filter = {
      main_event_id: { $in: subEventIds },
      user_id: user._id,
      isDeleted: false,
    };
    var subevents;
    if (status && isDeleted) {
      subevents = await SubEvents.updateMany(
        filter,
        { isDeleted: true, select_status: status },
        { new: true }
      );
    } else if (isDeleted) {
      subevents = await SubEvents.updateMany(
        filter,
        { isDeleted: true },
        { new: true }
      );
    } else if (status) {
      subevents = await SubEvents.updateMany(
        filter,
        { select_status: status },
        { new: true }
      );
    }

    if (subevents && subevents.nModified > 0) {
      return res.status(200).json({
        status: 1,
        message: "Sub events updated successfully.",
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: "Sub events not found or has already been deleted",
        // data: events,
      });
    }
  } catch (e) {
    return res.status(500).json({
      status: 0,
      message: "Failed to delete multiple sub events/ INTERNAL SERVER ERROR",
    });
  }
};

const del_sub_events = async (req, res) => {
  try {
    const events = await SubEvents.findByIdAndUpdate(
      { _id: req.params.sub_event_id },
      { isDeleted: true },
      { new: true }
    );

    if (!events) {
      return res.status(400).json({
        status: 0,
        message: "SubEvent  not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "SubEvent delete successfully.",
        data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Failed SubEvent delete",
    });
  }
};

const getUserOccupiedDates = async (req, res) => {
  try {
    let mainEvents = await MainEvent.find(
      { user_id: req.user._id, isDeleted: false },
      { startTime: 1 }
    );
    // .populate("user_id")
    // .populate("alarm_setting")
    // .populate("sub_events")
    if (mainEvents) {
      return res.status(200).send({
        status: 1,
        message: "Main Events Start Dates Found!",
        data: mainEvents,
      });
    }
  } catch (e) {
    return res
      .status(400)
      .send({ status: 0, message: "Main Events Start Dates Get  Failed!" });
  }
};

// const del_template_event = async (req, res) => {
//   try {
//     const events = await TemplatEevent.findByIdAndUpdate(
//       { _id: req.params.event_id },
//       { isDeleted: true },
//       { new: true }
//     );
//     // if (events) {
//     if (!events) {
//       return res.status(400).json({
//         status: 0,
//         message: "Template event not found",
//         // data: events,
//       });
//     } else {
//       return res.status(200).json({
//         status: 1,
//         message: "Template event delete successfully.",
//         data: events,
//       });
//     }
//   } catch (e) {
//     return res.status(400).json({
//       status: 0,
//       message: "Failed Template event delete",
//     });
//   }
// };

const userCardList = async (req, res) => {
  try {
    const listFind = await UserCard.find({
      user_id: req.user._id,
      isDeleted: false,
      is_active: 0,
    });
    if (listFind.length > 0) {
      return res.status(200).send({
        status: 1,
        message: "you have find Crad list Successfully.",
        data: listFind,
      });
    } else {
      return res.status(400).send({ status: 0, message: "No Card Found!" });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: "No Card Found!" });
  }
};

const stripeCard = async (req, res) => {
  const newCard = new UserCard(req.body);
  const post = req.body;
  try {
    if (!req.body.card_number) {
      return res
        .status(400)
        .send({ status: 0, message: "Card Number field is required" });
    } else if (!req.body.exp_month) {
      return res
        .status(400)
        .send({ status: 0, message: "expire Month field is required" });
    } else if (!req.body.exp_year) {
      return res
        .status(400)
        .send({ status: 0, message: "expire Year field is required" });
    } else if (!req.body.card_cvc) {
      return res
        .status(400)
        .send({ status: 0, message: "Card field is required" });
    } else {
      const cardFind = await UserCard.findOne({
        card_number: req.body.card_number,
      });
      if (cardFind) {
        return res
          .status(400)
          .send({ status: 1, message: "Card Already exists!" });
      } else {
        const findUser = await User.findOne({ _id: req.user._id });
        const token = await stripe.tokens.create({
          card: {
            number: post.card_number,
            exp_month: post.exp_month,
            exp_year: post.exp_year,
            cvc: post.card_cvc,
          },
        });
        const source = await stripe.customers.createSource(findUser.stripe_id, {
          source: token.id,
        });
        if (token) {
          newCard.stripe_token = token.card.id;
          newCard.user_id = req.user._id;
          const cardSave = await newCard.save();
          if (cardSave) {
            return res.status(200).send({
              status: 1,
              message: "Successfully Card Saved.",
              data: cardSave,
            });
          }
        }
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const userCardDelete = async (req, res) => {
  try {
    if (!req.body.card_number) {
      return res
        .status(400)
        .send({ status: 0, message: "Card Number field is required" });
    } else {
      const findRecord = await UserCard.findOne({
        card_number: req.body.card_number,
      });
      if (findRecord) {
        const deleteCard = await UserCard.deleteOne({
          card_number: req.body.card_number,
        });
        if (deleteCard) {
          return res
            .status(200)
            .send({ status: 1, message: "Card delete successfully." });
        }
      } else {
        return res.status(400).send({ status: 0, message: "No Card Found!" });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: "No Card Found!" });
  }
};

const setDefaultCard = async (req, res) => {
  try {
    if (!req.body.card_number) {
      return res
        .status(400)
        .send({ status: 0, message: "Card Number field is required" });
    } else {
      const findRecord = await UserCard.find({
        user_id: req.user._id,
        card_number: req.body.card_number,
        isDeleted: false,
      });

      if (findRecord.length > 0) {
        const updateCard = await UserCard.updateMany(
          { user_id: req.user._id },
          { is_active: 0 }
        );
        if (updateCard) {
          await UserCard.updateOne(
            { user_id: req.user._id, card_number: req.body.card_number },
            { is_active: 1 }
          );
          return res
            .status(200)
            .send({ status: 1, message: "Card Updated successfully." });
        }
      } else {
        return res.status(400).send({ status: 0, message: "No Card Found!" });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: "No Card Found!" });
  }
};

const findDefaultCustomerCard = async (req, res) => {
  try {
    const cards = await UserCard.find({
      user_id: req.user._id,
      is_active: 1,
      isDeleted: false,
    });

    if (cards) {
      return res.status(200).json({
        status: 1,
        message: "Default Card successfully retrieved",
        data: cards,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Default Card Not retrieved",
    });
  }
};

// for single user old
// const getEventsTemplate = async (req, res) => {
//   try {
//     // let mainEvents = await(await TemplatEevent.find({ user_id: req.user._id,isDeleted:false },{select_purpose:1,alarm_setting:0})
//     let mainEvents = await await TemplatEevent.find(
//       { user_id: req.user._id, isDeleted: false },
//       { select_purpose: 1, main_event_id: 1, alarm_setting: 0 }
//     )
//       .populate([
//         {
//           path: "alarm_setting",
//           match: { isDeleted: false },
//         },
//         {
//           path: "sub_events",
//           match: { isDeleted: false },
//           select: "select_purpose",
//         },
//       ])
//       .sort({ startTime: 1 });
//     // .populate({
//     //     path: 'alarm_setting',
//     //     match: { isDeleted: false }
//     // })
//     // .populate({
//     //     path: 'sub_events',
//     //     match: { isDeleted: false }
//     // })

//     if (mainEvents.length > 0) {
//       // return res.status(400).send({
//       //     status: 0,
//       //     message: "Main Events Not Found!",
//       //     // data: mainEvents,
//       // });
//       return res.status(200).send({
//         status: 1,
//         message: "Template Events Found!",
//         data: mainEvents,
//       });
//     } else {
//       // return res.status(200).send({
//       //     status: 1,
//       //     message: "Main Events Found!",
//       //     data: mainEvents,
//       // });
//       return res.status(400).send({
//         status: 0,
//         message: "Template Events Not Found!",
//         // data: mainEvents,
//       });
//     }
//   } catch (e) {
//     return res
//       .status(400)
//       .send({ status: 0, message: "Template Events Get  Failed!" });
//   }
// };

// for get all template events
// const getAllEventsTemplate = async (req, res) => {
//   try {
//     let mainEvents = await await TemplatEevent.find(
//       { isDeleted: false },
//       { select_purpose: 1, alarm_setting: 0 }
//     )
//       .populate([
//         {
//           path: "alarm_setting",
//           match: { isDeleted: false },
//         },
//         {
//           path: "sub_events",
//           match: { isDeleted: false },
//           select: "select_purpose",
//         },
//       ])
//       .sort({ startTime: 1 });
//     // .populate({
//     //     path: 'alarm_setting',
//     //     match: { isDeleted: false }
//     // })
//     // .populate({
//     //     path: 'sub_events',
//     //     match: { isDeleted1: false }
//     // })
//     if (mainEvents.length > 0) {
//       // return res.status(400).send({
//       //     status: 0,
//       //     message: "Main Events Not Found!",
//       //     // data: mainEvents,
//       // });
//       return res.status(200).send({
//         status: 1,
//         message: "Template Events Found!",
//         data: mainEvents,
//       });
//     } else {
//       // return res.status(200).send({
//       //     status: 1,
//       //     message: "Main Events Found!",
//       //     data: mainEvents,
//       // });
//       return res.status(400).send({
//         status: 0,
//         message: "Template Events Not Found!",
//         // data: mainEvents,
//       });
//     }
//   } catch (e) {
//     return res
//       .status(400)
//       .send({ status: 0, message: "Template Events Get  Failed!" });
//   }
// };


// old code
// crone job for main events

const job = new CronJob("* * * * *", async (req, res) => {
  try {
    console.log("Ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")
    console.log("Ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")
    console.log("Ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")
    console.log("Ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")
    console.log("Ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")
    console.log("Ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")
    console.log("Ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")
    console.log("Ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")
    console.log("Ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss")

    const newStartTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    let events = await MainEvent.find({ isDeleted: false }).populate({ path: 'user_id', populate: { path: 'devices' } });
    events.forEach(async (item) => {
      let abc = new Date(newStartTime);
      if (
        moment.utc(item.endTime).format("YYYY-MM-DD HH:mm:ss") ==
        moment.utc(abc).format("YYYY-MM-DD HH:mm:ss")
      ) {
        let startTime = item.startTime.toString().split(" ");
        let endTime = item.endTime.toString().split(" ");
        startTime[0] = startTime[0].split("-");
        endTime[0] = endTime[0].split("-");
        if (item.recurring == "daily") {
          var date = new Date(item.date);
          // removed for testing
          // date.setDate(date.getDate() + 1);
          startTime[0][2] = parseInt(startTime[0][2]) + 1;
          startTime[0] = startTime[0].join("-");
          startTime = startTime.join(" ");
          endTime[0][2] = parseInt(endTime[0][2]) + 1;
          endTime[0] = endTime[0].join("-");
          endTime = endTime.join(" ");
          // await MainEvent.findByIdAndUpdate(item._id, {
          //   // date,
          //   startTime,
          //   endTime,
          // });
        }
        if (item.recurring == "monthly") {
          var date = new Date(item.date);
          // removed for testing
          // date.setMonth(date.getMonth() + 1);
          startTime[0][1] = parseInt(startTime[0][1]) + 1;
          startTime[0] = startTime[0].join("-");
          startTime = startTime.join(" ");
          endTime[0][1] = parseInt(endTime[0][1]) + 1;
          endTime[0] = endTime[0].join("-");
          endTime = endTime.join(" ");
          // await MainEvent.findByIdAndUpdate(item._id, {
          //   // date,
          //   startTime,
          //   endTime,
          // });
        }

        if (item.recurring == "weekly") {
          var date1 = new Date(item.date);
          console.log("date1", date1);
          var date = moment.utc(item.date).format("YYYY-MM-DD HH:mm:ss");
          console.log("date before", date);
          date = new Date(date);
          console.log("date after", date);

          // removed for testing
          // date.setDate(date.getDate() + 7);
          console.log("date after after", date);
          startTime[0][2] = parseInt(startTime[0][2]) + 7;
          startTime[0] = startTime[0].join("-");
          startTime = startTime.join(" ");
          endTime[0][2] = parseInt(endTime[0][2]) + 7;
          endTime[0] = endTime[0].join("-");
          endTime = endTime.join(" ");
          // await MainEvent.findByIdAndUpdate(item._id, {
          //   // date,
          //   startTime,
          //   endTime,
          // });
        }
      }

      abc.setMinutes(
        abc.getMinutes() + parseInt(item.select_interval_time?.split(" ")[0])
      );
      abc.setHours(
        // abc.getHours() + 5
        abc.getHours()
      );

      if (
        moment.utc(item.startTime).format("YYYY-MM-DD HH:mm:ss") ==
        moment.utc(abc).format("YYYY-MM-DD HH:mm:ss")
      ) {
        if (item.user_id.is_notification == 1) {
          let tokens = [];
          item?.user_id?.devices?.map(e => tokens.push(e?.deviceToken))


          const notification_obj = {
            title: item.user_id.full_name,
            body: `${parseInt(
              item.select_interval_time?.split(" ")[0]
            )} Minute is left for your event to start`,
   
          };

          let data = {
            title: item.user_id.full_name,
            body: `${parseInt(
              item.select_interval_time?.split(" ")[0]
            )} Minute is left for your event to start`,
            type: "Event Reminder",
        

          };

          console.log("nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")
          console.log("nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")
          console.log("nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")
          console.log("nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")

          // await push_notifications(notification_obj);
          await send_notifications(tokens, notification_obj, data)
        }
      }
      // if()
    });
  } catch (e) { 
    return e;
  }
});

job.start();

// End old code

// New Code
// const job = new CronJob("* * * * * * ", async () => {
//   try {
//     const newStartTime = moment().format("YYYY-MM-DD HH:mm:ss");
//     let events = await MainEvent.find({ isDeleted: false }).populate("user_id");

//     for (const item of events) {
//       const abc = moment(newStartTime);
//       const itemEndTime = moment.utc(item.endTime, "YYYY-MM-DDTHH:mm:ss");

//       if (itemEndTime.isSame(abc)) {
//         let startTime = moment(item.startTime);
//         let endTime = moment(item.endTime);

//         if (item.recurring === "daily") {
//           startTime.add(1, "day");
//           endTime.add(1, "day");
//         } else if (item.recurring === "monthly") {
//           startTime.add(1, "month");
//           endTime.add(1, "month");
//         } else if (item.recurring === "weekly") {
//           startTime.add(1, "week");
//           endTime.add(1, "week");
//         }

//         // Uncomment when ready to update the database
//         // await MainEvent.findByIdAndUpdate(item._id, {
//         //     startTime: startTime.toDate(),
//         //     endTime: endTime.toDate(),
//         // });

//         const intervalMinutes = parseInt(
//           item.select_interval_time?.split(" ")[0]
//         );
//         abc.add(intervalMinutes, "minutes");

//         if (
//           moment.utc(item.startTime, "YYYY-MM-DDTHH:mm:ss").isSame(abc) &&
//           item.user_id.is_notification === 1
//         ) {
//           const notification_obj = {
//             user_device_token: item.user_id?.user_device_token,
//             title: item.user_id.full_name,
//             body: `${intervalMinutes} Minute is left for your event to start`,
//             type: "Event Reminder",
//             payload: item.user_id,
//           };
//           await push_notifications(notification_obj);
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error in CronJob:", error);
//   }
// });

// job.start();
// New Code End

// crone job for sub events

const job1 = new CronJob("* * * * * * ", async (req, res) => {
  try {
    const newStartTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    let events = await SubEvents.find({ isDeleted: false }).populate({ path: 'user_id', populate: { path: 'devices' } });
    events.forEach(async (item) => {
      let abc = new Date(newStartTime);

      if (
        moment.utc(new Date(item.endTime)).format("YYYY-MM-DD HH:mm:ss") ==
        moment(abc).format("YYYY-MM-DD HH:mm:ss")
      ) {
        let startTime = item.startTime.toString().split(" ");
        let endTime = item.endTime.toString().split(" ");
        startTime[0] = startTime[0].split("-");
        endTime[0] = endTime[0].split("-");
        if (item.recurring == "daily") {
          var date = new Date(item.date);
          date.setDate(date.getDate() + 1);
          startTime[0][2] = parseInt(startTime[0][2]) + 1;
          startTime[0] = startTime[0].join("-");
          startTime = startTime.join(" ");
          endTime[0][2] = parseInt(endTime[0][2]) + 1;
          endTime[0] = endTime[0].join("-");
          endTime = endTime.join(" ");
          await MainEvent.findByIdAndUpdate(item._id, {
            date,
            startTime,
            endTime,
          });
        }
        if (item.recurring == "weekly") {
          var date = new Date(item.date);
          date.setDate(date.getDate() + 7);
          startTime[0][2] = parseInt(startTime[0][2]) + 7;
          startTime[0] = startTime[0].join("-");
          startTime = startTime.join(" ");
          endTime[0][2] = parseInt(endTime[0][2]) + 7;
          endTime[0] = endTime[0].join("-");
          endTime = endTime.join(" ");
          await MainEvent.findByIdAndUpdate(item._id, {
            date,
            startTime,
            endTime,
          });
        }
        if (item.recurring == "monthly") {
          var date = new Date(item.date);
          date.setMonth(date.getMonth() + 1);
          startTime[0][1] = parseInt(startTime[0][1]) + 1;
          startTime[0] = startTime[0].join("-");
          startTime = startTime.join(" ");
          endTime[0][1] = parseInt(endTime[0][1]) + 1;
          endTime[0] = endTime[0].join("-");
          endTime = endTime.join(" ");
          await MainEvent.findByIdAndUpdate(item._id, {
            date,
            startTime,
            endTime,
          });
        }
      }
      abc.setMinutes(
        abc.getMinutes() + parseInt(item.select_interval_time?.split(" ")[0])
      );
      abc.setHours(
        // abc.getHours() + 5
        abc.getHours()
      );

      if (
        moment.utc(new Date(item.startTime)).format("YYYY-MM-DD HH:mm:ss") ==
        moment(abc).format("YYYY-MM-DD HH:mm:ss")
      ) {
        if (item.user_id.is_notification == 1) {
          let tokens = [];
          item?.user_id?.devices?.map(e => tokens.push(e?.deviceToken))
          const notification_obj = {
            title: item.user_id.full_name,
            body: `${parseInt(
              item.select_interval_time?.split(" ")[0]
            )}Minute  is left for your event to start`,
   
          };
          let data={
            title: item.user_id.full_name,
            body: `${parseInt(
              item.select_interval_time?.split(" ")[0]
            )}Minute  is left for your event to start`,
            type: "Event Reminder",
            payload: item.user_id,
          };
          // await push_notifications(notification_obj);
          await send_notifications(tokens,notification_obj,data)
        }
      }
    });
  } catch (e) {
    return e;
  }
});

job1.start();

// crone job for general alarm
// const job2 = new CronJob("* * * * * *", async (req, res) => {
//   try {
//     let events = await GeneralAlarm.find({ isDeleted: false }).populate(
//       "user_id"
//     );
//     events.forEach(async (item) => {
//       if (
//         moment.utc(item.date_time).format("YYYY-MM-DD HH:mm:ss") ==
//         moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
//       ) {
//         if (item.user_id.is_notification == 1) {
//           const notification_obj = {
//             user_device_token: item.user_id.user_device_token,
//             title: item.user_id.full_name,
//             body: `You Alarm is ringing`,
//             type: "Event Reminder",
//             payload: item.user_id,
//           };
//           await push_notifications(notification_obj);
//         }
//         await GeneralAlarm.findByIdAndUpdate(item._id, { isDeleted: true });
//       }
//     });
//   } catch (e) {}
// });

// job2.start();

const status_update = async (req, res) => {
  try {
    const events = await MainEvent.findByIdAndUpdate(
      { _id: req.params.event_id },
      { status: "complete" },
      { new: true }
    );
    const subEventsStatus = await SubEvents.updateMany(
      { main_event_id: req.params.event_id },
      { status: "complete" },
      { new: true }
    );

    if (!events) {
      return res.status(400).json({
        status: 0,
        message: "Main Events not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "Status Update successfully.",
        data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Failed Main Events Status Update",
    });
  }
};

const main_event_status_update_ongoing = async (req, res) => {
  try {
    const events = await MainEvent.findByIdAndUpdate(
      { _id: req.params.event_id },
      { status: "ongoing" },
      { new: true }
    );
    const SubEeventStatus = await SubEvents.findOneAndUpdate(
      { main_event_id: req.params.event_id },
      { status: "ongoing" },
      { new: true }
    );
    if (!events) {
      return res.status(400).json({
        status: 0,
        message: "Main Events not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "Status Update successfully.",
        data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Failed Main Events Status Update",
    });
  }
};

const main_event_status_update_pending = async (req, res) => {
  try {
    const events = await MainEvent.findByIdAndUpdate(
      { _id: req.params.event_id },
      { status: "pending" },
      { new: true }
    );
    const SubEeventStatus = await SubEvents.findOneAndUpdate(
      { main_event_id: req.params.event_id },
      { status: "pending" },
      { new: true }
    );
    if (!events) {
      return res.status(400).json({
        status: 0,
        message: "Main Events not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "Status Update successfully.",
        data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Failed Main Events Status Update",
    });
  }
};

// const template_event_status_update_complete = async (req, res) => {
//   try {
//     const TemplatEeventStatus = await TemplatEevent.findOneAndUpdate(
//       { _id: req.params.event_id },
//       { status: "complete" },
//       { new: true }
//     );
//     if (!TemplatEeventStatus) {
//       return res.status(400).json({
//         status: 0,
//         message: "Event not found",
//         // data: events,
//       });
//     } else {
//       return res.status(200).json({
//         status: 1,
//         message: "Status Update successfully.",
//         data: TemplatEeventStatus,
//       });
//     }
//   } catch (e) {
//     return res.status(400).json({
//       status: 0,
//       message: "Failed Template Event Status Update",
//     });
//   }
// };

// const template_event_status_update_ongoing = async (req, res) => {
//   try {
//     const TemplatEeventStatus = await TemplatEevent.findOneAndUpdate(
//       { _id: req.params.event_id },
//       { status: "ongoing" },
//       { new: true }
//     );
//     if (!TemplatEeventStatus) {
//       return res.status(400).json({
//         status: 0,
//         message: "Event not found",
//         // data: events,
//       });
//     } else {
//       return res.status(200).json({
//         status: 1,
//         message: "Status Update successfully.",
//         data: TemplatEeventStatus,
//       });
//     }
//   } catch (e) {
//     return res.status(400).json({
//       status: 0,
//       message: "Failed Template Event Status Update",
//     });
//   }
// };

// const template_event_status_update_pending = async (req, res) => {
//   try {
//     const TemplatEeventStatus = await TemplatEevent.findOneAndUpdate(
//       { _id: req.params.event_id },
//       { status: "pending" },
//       { new: true }
//     );
//     if (!TemplatEeventStatus) {
//       return res.status(400).json({
//         status: 0,
//         message: "Event not found",
//         // data: events,
//       });
//     } else {
//       return res.status(200).json({
//         status: 1,
//         message: "Status Update successfully.",
//         data: TemplatEeventStatus,
//       });
//     }
//   } catch (e) {
//     return res.status(400).json({
//       status: 0,
//       message: "Failed Template Event Status Update",
//     });
//   }
// };

const sub_event_status_update = async (req, res) => {
  try {
    const events = await SubEvents.findByIdAndUpdate(
      req.params.event_id,
      { status: "complete" },
      { new: true }
    );

    if (!events) {
      return res.status(400).json({
        status: 0,
        message: "Sub Events not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "Status Update successfully.",
        data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Failed Sub Events Status Update",
    });
  }
};

const sub_event_status_update_ongoing = async (req, res) => {
  try {
    const events = await SubEvents.findByIdAndUpdate(
      { _id: req.params.event_id },
      { status: "ongoing" },
      { new: true }
    );

    if (!events) {
      return res.status(400).json({
        status: 0,
        message: "Sub Events not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "Status Update successfully.",
        data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Failed Sub Events Status Update",
    });
  }
};

const sub_event_status_update_pending = async (req, res) => {
  try {
    const events = await SubEvents.findByIdAndUpdate(
      { _id: req.params.event_id },
      { status: "pending" },
      { new: true }
    );

    if (!events) {
      return res.status(400).json({
        status: 0,
        message: "Sub Events not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "Status Update successfully.",
        data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Failed Sub Events Status Update",
    });
  }
};

// create_general_alarm by some loop
const create_general_alarm = async (req, res) => {
  try {
    const { title, date_time, id } = req.body;
    const myAllAlarams = await GeneralAlarm.find({
      user_id: req.user._id,
      isDeleted: false,
    });

    if (myAllAlarams.length > 0) {
      let myAllAlaramsByConditions = myAllAlarams.some((item) => {
        // let time_now = moment.utc(date_time).format("YYYY-MM-DD h:mm:ss");
        // const second = new Date(time_now);
        // second.setHours(second.getHours() - 5);
        // let user_date_time = moment(second).format("YYYY-MM-DD h:mm:ss");
        // return moment.utc(item.date_time).format("YYYY-MM-DD h:mm:ss") == user_date_time

        const newStartTime = moment(date_time).format("YYYY-MM-DD HH:mm:ss");

        const oldEventTime = moment
          .utc(item.date_time)
          .format("YYYY-MM-DD HH:mm:ss");

        if (newStartTime == oldEventTime) {
          return true;
        } else {
          return false;
        }
      });

      if (myAllAlaramsByConditions) {
        return res.status(400).send({
          status: 0,
          message: "You have already created alarm at this time.",
        });
      } else {
        const createAlaram = new GeneralAlarm();
        createAlaram.title = title;
        createAlaram.id = id;
        createAlaram.date_time = moment(date_time).format(
          "YYYY-MM-DD HH:mm:ss[Z]"
        );
        createAlaram.user_id = req.user._id;
        const newcreateAlaram = await createAlaram.save();
        // const updatemainEvents = await MainEvent.findByIdAndUpdate(
        //     { _id: req.body.main_event_id },
        //     {
        //         $push: {
        //             // sub_events: createreviews._id.toHexString()
        //             alarm_setting: newcreateAlaram._id
        //         }
        //     },
        //     { new: true }
        // )
        if (newcreateAlaram) {
          return res.status(200).send({
            status: 1,
            message: "You have created alarm Successfully.",
            data: newcreateAlaram,
          });
        }
      }
    } else {
      const createAlaram = new GeneralAlarm();
      createAlaram.title = title;
      createAlaram.id = id;

      // createAlaram.date_time = date_time;
      createAlaram.date_time = moment(date_time).format(
        "YYYY-MM-DD HH:mm:ss[Z]"
      );
      createAlaram.user_id = req.user._id;
      const newcreateAlaram = await createAlaram.save();
      // const updatemainEvents = await MainEvent.findByIdAndUpdate(
      //     { _id: req.body.main_event_id },
      //     {
      //         $push: {
      //             // sub_events: createreviews._id.toHexString()
      //             alarm_setting: newcreateAlaram._id
      //         }
      //     },
      //     { new: true }
      // )
      if (newcreateAlaram) {
        return res.status(200).send({
          status: 1,
          message: "You have created alarm Successfully.",
          data: newcreateAlaram,
        });
      }
    }
  } catch (e) {
    return res
      .status(400)
      .send({ status: 0, message: "Failed alaram creation in catch error" });
  }
};

const edit_general_alarm = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(400)
        .send({ status: 0, message: "Authentication Field is required" });
    } else {
      const object_update = {
        title: req.body.title,
        // date_time: req.body.date_time
        date_time: moment(req.body.date_time).format("YYYY-MM-DD HH:mm:ss[Z]"),
      };
      for (const key in object_update) {
        if (object_update[key] === "" || object_update[key] === undefined) {
          delete object_update[key];
        }
      }
      const editAlarams = await GeneralAlarm.findByIdAndUpdate(
        { _id: req.params.alarm_id },
        object_update,
        { new: true }
      );
      if (!editAlarams) {
        return res.status(400).json({
          status: 0,
          message: "Alarm not found",
          // data: events,
        });
      } else if (editAlarams) {
        return res.status(200).send({
          status: 1,
          message: "Alarm Update Successfully.",
          data: editAlarams,
        });
      } else {
        return res
          .status(400)
          .send({ status: 0, message: "Alarm Not Update Successfully." });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const del_general_alaram = async (req, res) => {
  try {
    const events = await GeneralAlarm.findByIdAndUpdate(
      { _id: req.params.alarm_id },
      { isDeleted: true },
      { new: true }
    );
    // if (events) {
    if (!events) {
      return res.status(400).json({
        status: 0,
        message: "Alarm  not found",
        // data: events,
      });
    } else {
      return res.status(200).json({
        status: 1,
        message: "Alarm delete successfully.",
        data: events,
      });
    }
  } catch (e) {
    return res.status(400).json({
      status: 0,
      message: "Failed Alarm delete",
    });
  }
};

const get_general_alarm = async (req, res) => {
  try {
    const newStartTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

    let currentDateTime = new Date(newStartTime);
    console.log(currentDateTime);
    let alarms = await GeneralAlarm.find({
      user_id: req.user._id,
      isDeleted: false,
      date_time: {
        $gte: moment(currentDateTime).format("YYYY-MM-DD HH:mm:ss"),
        // $lte: currentDateTime
      },
    });

    if (alarms.length > 0) {
      // return res.status(400).send({
      //     status: 0,
      //     message: "Alarms Not Found!",
      //     // data: alarms,
      // });
      return res.status(200).send({
        status: 1,
        message: "Alarm Found!",
        data: alarms,
      });
    } else {
      return res.status(400).send({
        status: 0,
        message: "Alarm Not Found!",
        // data: alarms,
      });
      // return res.status(200).send({
      //     status: 1,
      //     message: "Alarms Found!",
      //     data: alarms,
      // });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const get_event_base_alarm = async (req, res) => {
  try {
    let alarms = await Alarams.find({
      main_event_id: req.params.mainEventId,
      isDeleted: false,
    });
    // .populate("user_id")
    // .populate("alarm_setting")
    // .populate("sub_events")
    if (alarms.length > 0) {
      // return res.status(400).send({
      //     status: 0,
      //     message: "Alarm Not Found!",
      //     // data: alarms,
      // });
      return res.status(200).send({
        status: 1,
        message: "Alarm Found!",
        data: alarms,
      });
    } else {
      return res.status(400).send({
        status: 0,
        message: "Alarm Not Found!",
        // data: alarms,
      });
      // return res.status(200).send({
      //     status: 1,
      //     message: "Alarm Found!",
      //     data: alarms,
      // });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const delete_user_profile = async (req, res) => {
  try {
    const userFind = await User.findOne({ _id: req.user._id });
    if (!userFind) {
      return res.status(400).send({
        status: 0,
        message: "User Does not Exist.",
      });
    } else {
      User.deleteOne({ _id: req.user._id }, function (err, users) {
        return res.status(200).send({
          status: 1,
          message: "You’ve successfully delete your profile",
        });
      });
      MainEvent.deleteMany({ user_id: req.user._id }, function (err, users) { });
      SubEvents.deleteMany({ user_id: req.user._id }, function (err, users) { });
      TemplatEevent.deleteMany(
        { user_id: req.user._id },
        function (err, users) { }
      );
      GeneralAlarm.deleteMany(
        { user_id: req.user._id },
        function (err, users) { }
      );
      Alarams.deleteOne({ user_id: req.user._id }, function (err, users) { });
      SubscriptionModel.deleteMany(
        { user_id: req.user._id },
        function (err, users) { }
      );
    }
  } catch (e) {
    return res
      .status(400)
      .send({ status: 0, message: "Failed to delete user profile" });
  }
};

const checkConflicts = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    const user_id = req.user ? req.user._id : null;
    if (!user_id || !startTime || !endTime) {
      if (!user_id) {
        return res.status(401).send({
          status: 0,
          message: "Please provide authorization header",
        });
      }
      if (!startTime) {
        return res.status(401).send({
          status: 0,
          message: "Please provide start time",
        });
      }
      if (!endTime) {
        return res.status(401).send({
          status: 0,
          message: "Please provide end time",
        });
      }
    }

    const myAllEvents = await MainEvent.find({
      user_id: req.user._id,
      isDeleted: false,
    }).populate({
      path: "sub_events",
    });

    let conflictingEvent = [],
      conflictingSubEvent = [];
    if (myAllEvents?.length > 0) {
      myAllEvents.map((item) => {
        const newStartTime = new Date(moment.utc(startTime));
        const newEndTime = new Date(moment.utc(endTime));

        const epochStartTime = newStartTime.getTime();
        const epochEndTime = newEndTime.getTime();
        var d1 = startTime.split(" ")[0];
        // newStartTime.getFullYear() +
        // "-" +
        // newStartTime.getMonth() +1+
        // "-" +
        // newStartTime.getDate();
        // var d2 =
        //   new Date(item.date).getFullYear() +
        //   "-" +
        //   new Date(item.date).getMonth() +
        //   "-" +
        //   new Date(item.date).getDate();
        if (d1 == item.startTime.split(" ")[0]) {
          const itemStartTime = new Date(moment.utc(item.startTime)).getTime();
          const itemEndTime = new Date(moment.utc(item.endTime)).getTime();
          if (
            (epochStartTime <= itemStartTime && epochEndTime > itemStartTime) ||
            (epochStartTime < itemEndTime && epochEndTime > itemEndTime)
          ) {
            item = item.toObject();
            delete item.sub_events;
            item.startTime = new Date(moment.utc(item.startTime));
            item.endTime = new Date(moment.utc(item.endTime));

            conflictingEvent.push(item);
          }
        }

        if (item.sub_events?.length > 0) {
          item.sub_events.map((subItem) => {
            if (!subItem.isDeleted) {
              if (d1 == subItem.startTime.split(" ")[0]) {
                const subItemStartTime = new Date(
                  moment.utc(subItem.startTime)
                ).getTime();
                const subItemEndTime = new Date(
                  moment.utc(subItem.endTime)
                ).getTime();

                if (
                  (epochStartTime <= subItemStartTime &&
                    epochEndTime > subItemStartTime) ||
                  (epochStartTime < subItemEndTime &&
                    epochEndTime > subItemEndTime)
                ) {
                  conflictingSubEvent.push(subItem);
                }
              }
            }
          });
        }
      });
      if (conflictingEvent.length > 0 || conflictingSubEvent.length > 0) {
        return res.status(200).send({
          status: false,
          message: "You have already created an event in this time",
          event: conflictingEvent,
          subEvent: conflictingSubEvent,
        });
      } else {
        return res.status(200).send({
          status: true,
          message: "you can create an event in this time",
        });
      }
    } else {
      return res.status(200).send({
        status: false,
        message: "You have no any Events Schedule Yet",
      });
    }
  } catch (e) {
    return res.status(500).send({ status: false, message: e.message });
  }
};

const checkconflict_by_template = async (req, res, next) => {
  try {
    var { date, startTime, endTime, tempEventId } = req.body;

    const tempevent = await TemplatEevent.findOne({
      _id: tempEventId,
      isDeleted: false,
    })
      .populate("sub_events")
      .populate("contacts");

    if (tempevent && tempevent._doc.sub_events.length == 0) {
      return res.status(400).send({
        status: 0,
        message: "This tenmplate has not any sub-events or template in delted",
      });
    }
    tempevent._doc.date = date;
    tempevent._doc.startTime = startTime;
    tempevent._doc.endTime = endTime;
    date = date.split(" ")[0];
    tempevent._doc.sub_events = tempevent._doc.sub_events.map((item) => {
      item._doc.date = new Date(
        moment.utc(
          new Date(date).getTime() + item.no_of_days * 24 * 60 * 60 * 1000
        )
      );

      var parts = item._doc.startTime.match(/(\d+)\:(\d+) (\w+)/);
      if (parts != null) {
        var hours = /AM/i.test(parts[3])
          ? parseInt(parts[1], 10) == 12
            ? 0
            : parseInt(parts[1], 10)
          : parseInt(parts[1], 10) == 12
            ? 12
            : parseInt(parts[1], 10) + 12,
          minutes = parseInt(parts[2]);

        item._doc.startTime = new Date(
          new Date(
            new Date(item._doc.date).getTime() +
            minutes * 60 * 1000 +
            hours * 60 * 60 * 1000
          )
        );
        var parts1 = item._doc.endTime.match(/(\d+)\:(\d+) (\w+)/);
        var hours = /AM/i.test(parts1[3])
          ? parseInt(parts1[1], 10) == 12
            ? 0
            : parseInt(parts1[1], 10)
          : parseInt(parts1[1], 10) + 12,
          minutes = parseInt(parts1[2]);

        item._doc.endTime = new Date(
          new Date(
            new Date(item._doc.date).getTime() +
            minutes * 60 * 1000 +
            hours * 60 * 60 * 1000
          )
        );
      } else {
        var da = new Date(moment.utc(item._doc.startTime));

        da.setMonth(item._doc.date.getMonth());
        da.setFullYear(item._doc.date.getFullYear());
        da.setDate(item._doc.date.getDate());

        item._doc.startTime = moment.utc(da).format("YYYY-MM-DDTHH:mm:ss");
        var da1 = new Date(moment.utc(item._doc.endTime));
        da1.setMonth(item._doc.date.getMonth());
        da1.setFullYear(item._doc.date.getFullYear());
        da1.setDate(item._doc.date.getDate());

        item._doc.endTime = moment.utc(da1).format("YYYY-MM-DDTHH:mm:ss");
      }
      item._doc.conflict = false;
      return item._doc;
    });

    tempevent._doc.sub_events.map(async (item, i) => {
      const epochStartTime = new Date(item.startTime);
      const epochEndTime = new Date(item.endTime);
      // const epochStartTime = newStartTime.getTime();
      // const epochEndTime = newEndTime.getTime();

      var myAllEvents = await MainEvent.find({
        user_id: req.user._id,
        isDeleted: false,
        date: new Date(item.date),
        // $or: [
        //   {
        //     startTime: { $gte: item.startTime, $lt: item.endTime }, // check if existing event starts within the given range
        //   },
        //   {
        //     endTime: { $gt: item.startTime, $lte: item.endTime }, // check if existing event ends within the given range
        //   },
        //   {
        //     startTime: { $lt: item.startTime },
        //     endTime: { $gt: item.endTime }, // check if existing event completely overlaps with the given range
        //   },
        // ],
      });

      myAllEvents = myAllEvents.filter((item1) => {
        const itemStartTime = new Date(moment.utc(new Date(item1.startTime)));
        const itemEndTime = new Date(moment.utc(new Date(item1.endTime)));
        // return (
        //   (epochStartTime <= itemStartTime && epochEndTime > itemStartTime) ||
        //   (epochStartTime < itemEndTime && epochEndTime > itemEndTime) ||
        //   (epochStartTime > itemStartTime && epochEndTime > itemEndTime)
        // );
        // return epochStartTime <= itemEndTime && itemStartTime <= epochEndTime;
        // return itemStartTime < epochEndTime && itemEndTime > epochStartTime;
        return (
          (itemStartTime < epochEndTime && itemEndTime > epochStartTime) ||
          (itemEndTime < epochEndTime && itemStartTime < epochStartTime)
        );
      });

      var myAllSubEvents = await SubEvents.find({
        user_id: req.user._id,
        isDeleted: false,
        date: new Date(item.date),
        // $or: [
        //   {
        //     startTime: { $gte: item.startTime, $lt: item.endTime }, // check if existing event starts within the given range
        //   },
        //   {
        //     endTime: { $gt: item.startTime, $lte: item.endTime }, // check if existing event ends within the given range
        //   },
        //   {
        //     startTime: { $lt: item.startTime },
        //     endTime: { $gt: item.endTime }, // check if existing event completely overlaps with the given range
        //   },
        // ],
      });

      myAllSubEvents = myAllSubEvents.filter((item2) => {
        const itemStartTime = new Date(moment.utc(new Date(item2.startTime)));
        const itemEndTime = new Date(moment.utc(new Date(item2.endTime)));
        // return epochStartTime <= itemEndTime && itemStartTime <= epochEndTime;
        return (
          (itemStartTime < epochEndTime && itemEndTime > epochStartTime) ||
          (itemEndTime < epochEndTime && itemStartTime < epochStartTime)
        ); // return (
        //   (epochStartTime <= itemStartTime && epochEndTime >= itemStartTime) ||
        //   (epochStartTime < itemEndTime && epochEndTime > itemEndTime) ||
        //   (epochStartTime > itemStartTime && epochEndTime > itemEndTime)
        // );
      });

      if (myAllEvents.length > 0 || myAllSubEvents.length > 0) {
        tempevent._doc.sub_events[i].conflict = true;
      }
      if (!tempevent._doc.sub_events[i + 1]) {
        return res.status(200).send({
          status: true,
          message: "Conflicts checked",
          data: tempevent._doc,
        });
      }
    });
    // const myAllEvents = await MainEvent.find({
    //   user_id: req.user._id,
    //   isDeleted: false,

    //   $or: [
    //     {
    //       startTime: { $gte: item.startTime, $lt: item.endTime }, // check if existing event starts within the given range
    //     },
    //     {
    //       endTime: { $gt: item.startTime, $lte: item.endTime }, // check if existing event ends within the given range
    //     },
    //     {
    //       startTime: { $lt: item.startTime },
    //       endTime: { $gt: item.endTime }, // check if existing event completely overlaps with the given range
    //     },
    //   ],
    // }).populate({
    //   path: "sub_events",
    //   mathch: {
    //     $or: [
    //       {
    //         startTime: { $gte: start, $lt: end }, // check if existing event starts within the given range
    //       },
    //       {
    //         endTime: { $gt: start, $lte: end }, // check if existing event ends within the given range
    //       },
    //       {
    //         startTime: { $lt: start },
    //         endTime: { $gt: end }, // check if existing event completely overlaps with the given range
    //       },
    //     ],
    //   },
    // });

    // myAllEvents.map(async (item) => {
    //   const k = item.sub_events.findIndex((element) => {
    //     if (
    //       checkdate.includes(
    //         JSON.stringify(element.date).split("T")[0].slice(1)
    //       )
    //     ) {
    //       const elementStartTime = new Date(
    //         moment.utc(element.startTime).format("YYYY-MM-DD HH:mm:ss")
    //       ).getTime();

    //       const elementEndTime = new Date(
    //         moment.utc(element.endTime).format("YYYY-MM-DD HH:mm:ss")
    //       ).getTime();

    //       var i = countInRange(
    //         checkdatestart,
    //         checkdateend,
    //         elementStartTime,
    //         elementEndTime
    //       );
    //       // var j = countInRange(
    //       //   checkdateend,
    //       //   checkdateend.length,
    //       //   elementStartTime,
    //       //   elementEndTime
    //       // );
    //       // if (i != -1) {
    //       //   return i;
    //       // } else

    //       if (i != -1) {
    //         tempevent._doc.sub_events[i].conflict = true;
    //       } else {
    //         return -1;
    //       }
    //     }
    //   });

    //   if (
    //     checkdate.includes(JSON.stringify(item.date).split("T")[0].slice(1))
    //   ) {
    //     const itemStartTime = new Date(
    //       moment.utc(item.startTime).format("YYYY-MM-DD HH:mm:ss")
    //     ).getTime();
    //     const itemEndTime = new Date(
    //       moment.utc(item.endTime).format("YYYY-MM-DD HH:mm:ss")
    //     ).getTime();
    //     var i = countInRange(
    //       checkdatestart,
    //       checkdateend,
    //       itemStartTime,
    //       itemEndTime
    //     );
    //     // var j = countInRange(
    //     //   checkdateend,
    //     //   checkdateend.length,
    //     //   itemStartTime,
    //     //   itemEndTime
    //     // );

    //     if (i != -1) {
    //       tempevent._doc.sub_events[i].conflict = true;
    //     }
    //     // if (j != -1) {
    //     //   tempevent._doc.sub_events[j].conflict = true;
    //     // } else
    //     // else if (k != -1) {

    //     //   tempevent._doc.sub_events[k].conflict = true;
    //     // }
    //   }
    // });

    // return res.status(200).send({
    //   status: true,
    //   message: "Conflicts checked",
    //   data: tempevent._doc,
    // });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const get_general_alarm_first_near_object = async (req, res) => {
  try {
    let alarms = await await GeneralAlarm.find({
      user_id: req.user._id,
      isDeleted: false,
    }).sort({ date_time: 1 });
    // .populate("user_id")
    // .populate("alarm_setting")
    // .populate("sub_events")
    if (alarms.length > 0) {
      // return res.status(400).send({
      //     status: 0,
      //     message: "Alarms Not Found!",
      //     // data: alarms,
      // });
      return res.status(200).send({
        status: 1,
        message: "Alarm Found!",
        data: alarms[0],
      });
    } else {
      return res.status(400).send({
        status: 0,
        message: "Alarm Not Found!",
        // data: alarms,
      });
      // return res.status(200).send({
      //     status: 1,
      //     message: "Alarms Found!",
      //     data: alarms,
      // });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

// function getTimeOneSecondBefore(inputDate) {
//   const date = new Date(inputDate);
//   date.setSeconds(date.getSeconds() - 1); // Subtract one second from the input time
//   return date;
// }
const geteventsbydate = async (req, res) => {
  try {
    var { date } = req.body;
    // date = [...new Set(date)];

    // date = date.map((item) => {

    //   return new Date(item);
    // });

    var data = [];

    const da = await MainEvent.find({
      date: { $in: date },
      user_id: req.user._id,
      isDeleted: false,
    });

    data = [...data, ...da];
    const da2 = await SubEvents.find({
      date: { $in: date },
      user_id: req.user._id,
      isDeleted: false,
    });

    data = [...data, ...da2];

    // const loop = date.map(async (item, i) => {
    //   var startDate = new Date(item); // Convert the input date to a Date object

    //   const st = startDate.setDate(startDate.getDate() + 1)
    //   var endDate = getTimeOneSecondBefore(st)
    //   // endDate = new Date(endDate.toISOString())

    // })

    // await Promise.all(loop)

    if (data.length == 0) {
      return res.status(200).send({
        status: 0,
        message: "No any events exist in these dates",
      });
    }

    const eventData = data.map((event) => ({
      ...event.toObject(),
      startTime: new Date(moment.utc(event.startTime)),
      endTime: new Date(moment.utc(event.endTime)),
    }));

    return res.status(200).send({
      status: 1,
      message: "Events Found!",
      data: [...eventData],
    });
    // return res.status(200).send({
    //   status: 1,
    //   message: "Events Found!",
    //   data: [...data,...data1,new Date(moment.utc(data.startTime)),new Date(moment.utc(data.endTime))],
    // });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const createPaymentIntent = async (req, res, next) => {
  try {
    let { email, fundCode } = req.body;
    let user = await User.findOne({
      user_email: email
    })

    if (!email || !fundCode) {
      return res.status(200).send({
        status: 0,
        message: "required email and fundcode",
      });
    }
    if (!user) {
      if (!user) {
        return res.status(200).send({
          status: 0,
          message: "Inavlid email",
        });
      }
    }
    let data = await fundingModel.findOne({ user_id: user._id, fundCode })

    if (data) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount * 100,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      let fund = await fundingModel.findOneAndUpdate({
        user_id: user._id,
        fundCode
      },
        {
          paymentStatus: 'accepted',
          status: "accepted"
        }
      )
      return res.status(200).send({
        status: 1,
        message: "Payment Intent Created Successfully..",
        data: paymentIntent,
      });
    }

  } catch (error) {
    return res.status(400).send({ status: 0, message: error.message });

  }

}

const createCheckoutSession = async (req, res) => {
  try {
    console.log(process.env.DomainLocal, "data>>>>>>>>>>>>>>>");
    const { userId, fundId, priceId } = req.body;

    if (priceId) {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: priceId, // Test price ID
            quantity: 1,
          },
        ],
        metadata:{
          userId: userId,
          fundId: fundId
        },
        customer_creation: 'always',
        customer_email: req.user.user_email,
        mode: 'payment',
        success_url: `https://dashboard.skyresourcesapp.com/dashboard/funding-model`,
        cancel_url: `https://dashboard.skyresourcesapp.com/dashboard/funding-model`,
      });

      return res.status(200).send({
        status: 1,
        message: "Checkout session created successfully",
        data: session,
      });
    }
    return res.status(400).send({ status: 0, message: "something went wrong" });

  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
}

const createCheckoutSession1 = async (req, res) => {
  try {
    const { priceId } = req.body
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId, // Test price ID
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:8000/dashboard/funding-model?payment_status=success',
      cancel_url: 'http://localhost:8000/dashboard/funding-model?payment_status=cancel',
    });
    return res.status(200).send({
      status: 1,
      message: "Checkout session created successfully",
      data: session,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
}

const createPrice = async (req, res) => {
  try {
    const { currency, unit_amount } = req.body;
    const price = await stripe.prices.create({
      currency: currency,
      unit_amount: unit_amount,

      product_data: {
        name: 'testing',
      },
    });
    return res.status(200).send({
      status: 1,
      message: "Checkout session created successfully",
      data: price,
    });
  }
  catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
}

const create_Sub_Events1 = async (req, res) => {
  try {
    const subEventArray = req.body; // Assuming req.body contains an array of subEvent objects
    console.log("subEventArray", subEventArray);

    // Use insertMany to insert all subEvent objects in the array
    const newSubEvents = await SubEvents.insertMany(subEventArray);
    for (const newSubEvent1 of newSubEvents) {
      const main = await MainEvent.findByIdAndUpdate(
        newSubEvent1.main_event_id,
        { $push: { sub_events: newSubEvent1._id } }, // $push should be within the update object
        { new: true } // Options object
      );
    }



    // Loop through each inserted subEvent to perform additional actions

    for (const newsubEventPost of subEventArray) {

      const dailySubEvents = [];
      const monthlySubEvents = [];
      const weeklySubEvents = [];
      if (newsubEventPost.recurring == "daily") {
        dailySubEvents.push(newsubEventPost)
        console.log("checking before", dailySubEvents);
      }
      if (newsubEventPost.recurring == "monthly") {
        monthlySubEvents.push(newsubEventPost)
      }
      if (newsubEventPost.recurring == "weekly") {
        weeklySubEvents.push(newsubEventPost)
      }
      // Your existing logic for handling recurring events, sending emails, etc.
      const { main_event_id, recurring, until, startTime, endTime, title, select_purpose, description, select_interval_time, select_color, date } = newsubEventPost;
      console.log("dailySubEvents", dailySubEvents);
      if (recurring == "daily") {
        for (const dailySubEvent of dailySubEvents) {
          console.log("recurring>>>>>", recurring);
          const date1 = new Date(date);
          const date2 = new Date(until);
          const diffTime = Math.abs(date2 - date1);
          const noOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          for (var i = 0; i < noOfDays; i++) {
            var subEvent = new SubEvents({
              main_event_id: main_event_id,
              user_id: req.user._id,
              date: timeUpdation(startTime, i + 1, 2).split(" ")[0],
              startTime: timeUpdation(startTime, i + 1, 2),
              endTime: timeUpdation(endTime, i + 1, 2),
              title: title,
              select_purpose: select_purpose,
              description: description,
              select_interval_time: select_interval_time,
              recurring: recurring,
              select_color: select_color,
            });
            subEvent = await subEvent.save();
            console.log("subEvent>>>>>>>", subEvent);
            const main = await MainEvent.findByIdAndUpdate(
              main_event_id,
              {
                $push: {
                  // sub_events: createreviews._id.toHexString()
                  sub_events: subEvent._id,
                },
              },
              { new: true }
            );
          }
        }


      }
      for (const monthlySubEvent of monthlySubEvents) {
        if (recurring == "monthly") {
          var startYear = new Date(date).getFullYear();
          var startMonth = new Date(date).getMonth();
          var endYear = new Date(until).getFullYear();
          var endMonth = new Date(until).getMonth();
          const noOfmonths = (endYear - startYear) * 12 + (endMonth - startMonth);
          for (var i = 0; i < noOfmonths; i++) {
            var subEvent = new SubEvents({
              main_event_id: main_event_id,
              user_id: req.user._id,
              //date: new Date(
              //    new Date(date).setDate(new Date(date).getDate() + i + 1)
              //),
              date: timeUpdation(startTime, i + 1, 1).split(" ")[0],
              startTime: timeUpdation(startTime, i + 1, 1),
              endTime: timeUpdation(endTime, i + 1, 1),
              title: title,
              select_purpose: select_purpose,
              description: description,
              select_interval_time: select_interval_time,
              recurring: recurring,
              select_color: select_color,
            });

            subEvent = await subEvent.save();
            await MainEvent.findByIdAndUpdate(
              main_event_id,
              {
                $push: {
                  // sub_events: createreviews._id.toHexString()
                  sub_events: subEvent._id,
                },
              },
              { new: true }
            );
          }
        }
      }

      for (const weeklySubEvent of weeklySubEvents) {
        if (recurring == "weekly") {
          var timeDifference = new Date(until).getTime() - new Date(date).getTime();
          var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
          var noOfweeks = Math.floor(timeDifference / millisecondsPerWeek);

          for (var i = 0; i < noOfweeks; i++) {
            var subEvent = new SubEvents({
              main_event_id: main_event_id,

              user_id: req.user._id,
              //   date: new Date(
              //     new Date(date).setDate(new Date(date).getDate() + i + 1)
              //   ),
              date: timeUpdation(startTime, (i + 1) * 7, 2).split(" ")[0],
              startTime: timeUpdation(startTime, (i + 1) * 7, 2),
              endTime: timeUpdation(endTime, (i + 1) * 7, 2),
              title: title,
              select_purpose: select_purpose,
              description: description,
              select_interval_time: select_interval_time,
              recurring: recurring,
              select_color: select_color,
            });
            subEvent = await subEvent.save();
            console.log("weekly>>", subEvent);
            await MainEvent.findByIdAndUpdate(
              main_event_id,
              {
                $push: {
                  // sub_events: createreviews._id.toHexString()
                  sub_events: subEvent._id,
                },
              },
              { new: true }
            );
          }
        }
      }





    }
    return res.status(200).send({
      status: 1,
      message: "Sub events created successfully.",
      data: newSubEvents,
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

module.exports = {
  checkConflicts,
  createPrice,
  createCheckoutSession1,
  create_Sub_Events1,
  create_Main_Events,
  create_alaram,
  create_Sub_Events,
  get_main_events,
  get_filtered_main_events,
  get_main_events_by_event_id,
  get_main_events_by_user_id,
  edit_main_event_by_event_id,
  edit_subevent,
  // edit_templateEvent,
  edit_alarm,
  del_multiple_main_events,
  del_main_event,
  del_multiple_alarms,
  del_mul_general_alaram,
  del_alaram,
  del_multiple_sub_events,
  del_sub_events,
  getUserOccupiedDates,
  // getEventsTemplate,
  status_update,
  main_event_status_update_ongoing,
  main_event_status_update_pending,
  // template_event_status_update_complete,
  // template_event_status_update_ongoing,
  // template_event_status_update_pending,
  sub_event_status_update,
  sub_event_status_update_ongoing,
  sub_event_status_update_pending,
  // del_template_event,
  create_general_alarm,
  edit_general_alarm,
  del_general_alaram,
  get_general_alarm,
  createPaymentIntent,
  get_event_base_alarm,
  delete_user_profile,
  create_main_event_by_template_event,
  // getAllEventsTemplate,
  get_general_alarm_first_near_object,
  // stripe
  userCardList,
  stripeCard,
  userCardDelete,
  setDefaultCard,
  findDefaultCustomerCard,
  checkconflict_by_template,
  getSubEventsById,
  geteventsbydate,
  todayEvents,
  upcomingWeekEvents,
  createCheckoutSession
};
