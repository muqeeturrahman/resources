const nodemailer = require("nodemailer");
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

const sendEmailForSubEvents = (email, newsubEventPost, timeZone) => {
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
    subject: "Invitation For An Event", // Subject line
    html: `
    <p>Invitation For An Event</p>
    <p>Purpose : ${newsubEventPost.select_purpose}</p>
    <p>Description : ${newsubEventPost.description}</p>
    <p>Interval Time : ${newsubEventPost.select_interval_time}</p>
    <p>Recurring : ${newsubEventPost.recurring}</p>
    <p>Start Time : ${new Date(newsubEventPost.startTime).toLocaleString(
      "en-US",
      dateOptions
    )}</p>
    <p>End Time : ${new Date(newsubEventPost.endTime).toLocaleString(
      "en-US",
      dateOptions
    )}</p>
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

module.exports = { sendEmailForSubEvents };
