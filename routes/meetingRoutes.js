

const express = require("express");
const router = express.Router();
const { auth, adminAuth } = require("../middlewares/auth");
const { schedulemeeting,getAdminMeetings,getUserMeetings,updateMeeting,deleteMeeting, getSchedule } = require("../controllers/meetingController");

router.post("/meet/schedule",auth,schedulemeeting)
router.get("/admin/meet",adminAuth,getAdminMeetings)
router.get("/user/meet",auth,getUserMeetings)
router.patch("/meet/:id",adminAuth,updateMeeting)
router.delete("/meet/:id",adminAuth,deleteMeeting)
router.get("/meet/schedule",auth,getSchedule)


module.exports = router;
