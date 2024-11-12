const express = require("express");
const router = express.Router();
const {
  signUp,
  userLogin,
  user_verification,
  userForgotPassword,
  resetPassword,
  SetnewPassAfterForget,
  Notifications,
  socialLogin,
  content,
  editProfile,
  completeProfile,
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
  sentDocument,
  getDocumentById,
  sendDocument,
  inboxDocument,
  userVerification,
  getContactById,
  
} = require("../controllers/userController");

const { auth, adminAuth } = require("../middlewares/auth");
const { upload } = require("../config/utils");
const { getFileStream } = require("../config/s3");
const {
  adminLoginValidator,
  viewUsersValidator,
  blockUnblockUsersValidator,
  updateUserValidator,
  deleteUserValidator,
  sendPushNotificationValidator,
  validationFunction,
  deleteRequestValidator,
} = require("../validators/validators");
// Routes
router.get("/get_previous_events",auth,  getPreviousEvents);
router.post("/signup", signUp);
router.post("/user_verification", user_verification);
router.post("/user_login", userLogin);
router.post("/forgot_password", userForgotPassword);
router.post("/resend_otp", resend_otp);
router.post("/reset_pass", auth, resetPassword);
router.post("/notification", auth, Notifications);
router.post("/set_new_password_afer_forget", SetnewPassAfterForget);
router.post("/social_login", socialLogin);
router.post(
  "/completeProfile",
  upload.fields([{ name: 'user_image', maxCount: 1 }, { name: 'cover_image', maxCount: 1 }]),
  auth,
  completeProfile
);
router.post("/editProfile", upload.fields([{ name: 'user_image', maxCount: 1 }, { name: 'cover_image', maxCount: 1 }]), auth, editProfile);
router.post("/sendDocument", auth, upload.fields([{ name: "user_image", maxCount: 10 }]), sendDocument);
router.post("/createForm",  createForm);

router.get("/inboxDocument",  auth, inboxDocument);
router.get("/getDocumentById/:id",  auth, getDocumentById);
router.get("/sentDocument",  auth, sentDocument);
router.get("/content/:content_type", content);
router.post("/logout", auth, userLogout);
///contacts
router.post("/contact", auth, createContact);
router.get("/contact", auth, getContact);
router.delete("/contact/:id", auth, deleteContact);
router.patch("/contact/:id", auth, updateContact);
router.post("/settoken", auth, settoken);
// subscription
router.post("/subscription", subscription);

router.get("/image/:key", getFileStream);

router.post("/delteUser", auth, deleteUser);
router.post("/createForm",  createForm);
// admin routes
router.post("/adminSignUp", adminSignUp);
router.post("/adminLogin", adminLoginValidator, validationFunction, adminLogin);
router.get(
  "/viewUsers",
  adminAuth,
  // viewUsersValidator,
  // validationFunction,
  viewUsers
);
router.post("/userVerification", userVerification);
router.get("/getContactById/:id", getContactById);
router.get("/getAllMainEvents", adminAuth,getAllMainEvents)
router.put("/deletMainEventsById/:event_id", adminAuth,deletMainEventById)
router.put("/deletSubEventsById/:event_sub_id", adminAuth,deletSubEventById)
router.put("/editMainEvents/:event_id",adminAuth,editMainEventById)
router.put("/editSubEvents/:sub_event_id",adminAuth,editSubEventById)
router.put(
  "/blockUnblockUsers",
  adminAuth,
  blockUnblockUsersValidator,
  validationFunction,
  blockUnblockUsers
);
router.patch(
  "/updateUser",
  adminAuth,
  updateUserValidator,
  validationFunction,
  updateUser
);
router.delete(
  "/deleteUsers",
  adminAuth,
  deleteUserValidator,
  validationFunction,
  deleteUsers
);

router.get("/getDashboard",
adminAuth,
getDashboardUser
)

router.post(
  "/sendPushNotification",
  adminAuth,
  sendPushNotificationValidator,
  validationFunction,
  sendPushNotification
);
router.post(
  "/deleteAccount",
  // deleteRequestValidator,
  // validationFunction,
  deleteRequest
);
router.get("/getDeleteRequest", getDeleteRequests);
router.put("/acceptRejectDeleteRequest",deleteRequestStatus);
module.exports = router;
