
const multer = require("multer");
const jwt = require("jsonwebtoken");

const nodemailer = require("nodemailer");
// Email function
const transporter = nodemailer.createTransport({
 service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: true,  // use TLS

    
    auth: {
        user: "notification@skyresourcesapp.com",
        pass: "dnsivzwadzptqesz",
    },
});

const sendEmail = (email, verificationCode) => {
  const mailOptions = {
    from: "notification@skyresourcesapp.com", // sender address
    to: email, // list of receivers
    subject: "Email From Sky Resources", // Subject line
    html: `
    <p>Your Account  Verification Otp Code is ${verificationCode} </p>
    <p>Thank you for using our application!</p>
    <p><span>Regards,</span><br>
    <span>Sky Resources, LLC</span>
    </p>
    `, // plain text body
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) console.log(err);
    
  });
};
const sendEmailForm = (email, data) => {
  const mailOptions = {
    from: "notification@skyresourcesapp.com", // sender address
    to: email, // list of receivers
    subject: "Email From Sky Resources", // Subject line
    html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h3>Form Submission Details</h3>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.user_email}</p>
      <p><strong>Phone:</strong> ${data.user_phone}</p>
      <p><strong>Message:</strong> ${data.message}</p>
      <br>
      <p>Sky Resources, LLC</p>
    </div>
    `, // formatted HTML body
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) console.log(err);
  });
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname == "user_image") {
      cb(null, "./uploads/profile/");
    }
    if (file.fieldname == "attachment") {
      cb(null, "./uploads/voice/");
    }
    if (file.fieldname == "job_image") {
      cb(null, "./uploads/jobsimage/");
    }
    if (file.fieldname == "file") {
      cb(null, "./uploads/resumefiles/");
    }
    if (file.fieldname == "company_profile_image") {
      cb(null, "./uploads/companyProfileImages/");
    }
    if (file.fieldname == "cover_image") {
      cb(null, "./uploads/profile/");
    }
    if (file.fieldname == "category_image") {
      cb(null, "./uploads/category/");
    }
    if (file.fieldname == "hf_images[]") {
      cb(null, "./uploads/feedback/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});

function fileFilter(req, file, cb) {
  cb(null, true);
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "audio/mpeg" ||
    file.mimetype === "audio/mp4" ||
    file.mimetype === "audio/mpeg" ||
    file.mimetype === "audio/mp3" ||
    file.mimetype === "application/ogg" ||
    file.mimetype === "application/msword" || // for .doc files
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // for .docx files
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 500,
  },
  fileFilter: fileFilter,
});

const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

const createToken = (user) => {
  return jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" });
};



module.exports = { generateToken, createToken,sendEmailForm, sendEmail, upload };



