const nodemailer = require("nodemailer");
require("dotenv").config();

// Email function
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: true, // use TLS
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const sendEmailForEvents = (email, newmainEventPost, timeZone) => {
  const dateOptions = {
    timeZone: timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  const mailOptions = {
    from: process.env.EMAIL, // sender address
    to: email, // list of receivers
    subject: "Notification for an event", // Subject line
    html: `
    <p>Notification for an event</p>
    <p>Address : ${newmainEventPost.title}</p>
    <p>Purpose : ${newmainEventPost.select_purpose}</p>        
    <p>Description : ${newmainEventPost.description}</p>
    <p>Interval Time : ${newmainEventPost.select_interval_time}</p>
    <p>Start Time : ${new Date(newmainEventPost.startTime).toLocaleString(
      "en-US",
      dateOptions
    )}</p>
    <p>End Time : ${new Date(newmainEventPost.endTime).toLocaleString(
      "en-US",
      dateOptions
    )}</p>    
    <p><span>Regards,</span><br>
    <span>Sky Resources, LLC</span><br>
    <span>skyresourcesapp.com</span>

    </p>
    `, // plain text body
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) console.log(err);
  });
};
const sendEmailForTempEvents = (email, newmainEventPost) => {
  const mailOptions = {
    from: process.env.EMAIL, // sender address
    to: email, // list of receivers
    subject: "Invitation For An Event", // Subject line
    html: `
    <p>Invitation For An Event</p>
    <p>Event Name : ${newmainEventPost.title}</p>
    <p>Purpose : ${newmainEventPost.select_purpose}</p>        
    <p>Description : ${newmainEventPost.description}</p>
    <p>Interval Time : ${newmainEventPost.select_interval_time}</p>        
    <p><span>Regards,</span><br>
    <span>Sky Resources, LLC</span>
    <br>
    <span>skyresourcesapp.com</span>
    </p>
    `, // plain text body
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) console.log(err);
  });
};

module.exports = { sendEmailForEvents, sendEmailForTempEvents };
