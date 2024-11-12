const express = require("express");
const router = express.Router();
const {
  create_Main_Events,
  create_alaram,
  create_Sub_Events,
  get_main_events,
  get_main_events_by_event_id,
  get_main_events_by_user_id,
  edit_main_event_by_event_id,
  edit_subevent,
  // edit_templateEvent,
  edit_alarm,
  del_main_event,
  del_alaram,
  del_sub_events,
  // del_template_event,
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
  create_general_alarm,
  edit_general_alarm,
  del_general_alaram,
  del_mul_general_alaram,
  get_general_alarm,
  get_event_base_alarm,
  delete_user_profile,
  get_general_alarm_first_near_object,
  create_main_event_by_template_event,
  // getAllEventsTemplate,
  // stripe
  userCardList,
  stripeCard,
  userCardDelete,
  setDefaultCard,
  findDefaultCustomerCard,
  checkConflicts,
  get_filtered_main_events,
  del_multiple_main_events,
  del_multiple_alarms,
  del_multiple_sub_events,
  checkconflict_by_template,
  getSubEventsById,
  geteventsbydate,
  todayEvents,
  upcomingWeekEvents,
  createCheckoutSession,
  createPaymentIntent,
  createPrice,
  create_Sub_Events1,
  createCheckoutSession1
} = require("../controllers/functionControllers");

const { upload } = require("../config/utils");
const { auth, adminAuth } = require("../middlewares/auth");
const {
  templatecreate,
  templateget,
  templateupdate,
  templatedelete,
  tempsubeventcreate,
  tempsubeventupdate,
  tempsubeventdelete,
  defaultTemplate,
  orderChange,
  changeOrderTemp,
  tempsubeventcreate1,
  getTemplateById
} = require("../controllers/templateController");

// Routes
router.post("/web/create-sub-events", auth, create_Sub_Events1);
router.post("/create-main-event", auth, create_Main_Events);
router.post("/defaultTemplate", auth, defaultTemplate);
router.post("/orderChange", auth, orderChange);
router.post("/changeOrderTemp", auth, changeOrderTemp);
router.post("/check_conflicts", auth, checkConflicts);
router.post("/create-alarm", upload.single("attachment"), auth, create_alaram);
router.post("/create-general-alarm", auth, create_general_alarm);
router.post("/create-sub-events", auth, create_Sub_Events);
router.get("/get-main-events", auth, get_main_events);
router.get(
  "/get-main-events-by-event-id/:mainEventId",
  auth,
  get_main_events_by_event_id
);
router.post("/createPrice", createPrice);
router.post("/get_filtered_events", auth, get_filtered_main_events);
router.get("/get-main-events-by-user-id", auth, get_main_events_by_user_id);
router.post("/filterEvents", auth, todayEvents);
router.get("/upcomingWeekEvents", auth, upcomingWeekEvents);
router.post("/edit_main_event/:mainEventId", auth, edit_main_event_by_event_id);
router.post("/edit_subevent/:sub_event_id", auth, edit_subevent);
// router.post("/edit_templateEvent/:template_event_id", auth, edit_templateEvent);
router.post(
  "/edit_alarm/:alarm_id",
  upload.single("attachment"),
  auth,
  edit_alarm
);
router.post("/edit_general_alarm/:alarm_id", auth, edit_general_alarm);
router.post("/createCheckoutSesssion", createCheckoutSession1);
router.post("/del_general_alarm/:alarm_id", auth, del_general_alaram);
router.get("/get_general_alarm", auth, get_general_alarm);
router.get(
  "/get_single_general_alarm",
  auth,
  get_general_alarm_first_near_object
);
router.get("/get_event_base_alarm/:mainEventId", auth, get_event_base_alarm);
router.post("/del_main_event/:event_id", auth, del_main_event);
router.post("/del_multiple_main_events", auth, del_multiple_main_events);
router.post("/del_mul_general_alaram", auth, del_mul_general_alaram);
router.post("/del_multiple_alarms", auth, del_multiple_alarms);
// router.post("/del_template_event/:event_id", auth, del_template_event);

router.post("/del_alarm/:alarm_id", auth, del_alaram);
router.post("/del_multiple_sub_events", auth, del_multiple_sub_events);
router.post("/del_sub_events/:sub_event_id", auth, del_sub_events);
router.post("/generate-checkout-url", auth, createCheckoutSession);
router.post("/create-payment-intent",createPaymentIntent)
router.get("/getUserOccupiedDates", auth, getUserOccupiedDates);

// by user id of a single user
// router.get("/getEventsTemplate", auth, getEventsTemplate);

// all tem e
// router.get("/getAllEventsTemplate", auth, getAllEventsTemplate);

router.post("/status_update/:event_id", auth, status_update);

router.post(
  "/mainEvent_status_update_ongoing/:event_id",
  auth,
  main_event_status_update_ongoing
);

router.post(
  "/mainEvent_status_update_pending/:event_id",
  auth,
  main_event_status_update_pending
);

// router.post(
//   "/templateEvent_status_update_complete/:event_id",
//   auth,
//   template_event_status_update_complete
// );

// router.post(
//   "/templateEvent_status_update_ongoing/:event_id",
//   auth,
//   template_event_status_update_ongoing
// );

// router.post(
//   "/templateEvent_status_update_pending/:event_id",
//   auth,
//   template_event_status_update_pending
// );

router.post("/subevent_status_update/:event_id", auth, sub_event_status_update);

router.post(
  "/subEvent_status_update_ongoing/:event_id",
  auth,
  sub_event_status_update_ongoing
);

router.post(
  "/subEvent_status_update_pending/:event_id",
  auth,
  sub_event_status_update_pending
);

router.post("/delete_user_profile", auth, delete_user_profile);
router.get("/get_subevents_by_id/:id", auth, getSubEventsById);
///// stripe //////////

router.get("/userCardList", auth, userCardList);

router.post("/stripeCard", auth, stripeCard);

router.post("/userCardDelete", auth, userCardDelete);

router.post("/setDefaultCard", auth, setDefaultCard);

router.get("/get-default-stripe-card", auth, findDefaultCustomerCard);

router.post(
  "/create-main-event-by-template-event",
  auth,
  create_main_event_by_template_event
);
router.post("/checkconflict_by_template", auth, checkconflict_by_template);

router.get("/template", auth, templateget);
router.post("/template", auth, templatecreate);
router.put("/template/:id", auth, templateupdate);
router.delete("/template/:id", auth, templatedelete);
router.post("/template/web/subevent", auth, tempsubeventcreate1);
router.post("/template/subevent", auth, tempsubeventcreate);
router.put("/template/subevent/:id", auth, tempsubeventupdate);
router.delete("/template/subevent/:id", auth, tempsubeventdelete);
router.post("/geteventsbydate", auth, geteventsbydate);
router.get("/getTemplateById/:id", getTemplateById);


module.exports = router;
