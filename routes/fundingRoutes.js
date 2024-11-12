const express = require("express");
const router = express.Router();
const { auth, adminAuth } = require("../middlewares/auth");
const {
  createFund,
  getUserFunds,
  getAdminFunds,
  updateFund,
  deleteFund,
  createFundData,
  getFundData,
  updateFundData,
  deleteFundData,
  recurringFund,
  deleteFunding,
  addRecentFund,
  paymentStatus
} = require("../controllers/fundingController");

router.delete("/deleteFunding/:id", deleteFunding);
router.post("/fund",adminAuth,createFundData)
router.get("/fund", getFundData);
router.put("/funddata/:id", adminAuth, updateFundData);
router.delete("/funddata/:id", adminAuth, deleteFundData);
addRecentFund

router.post("/fund/create-fund",auth,addRecentFund)

router.post("/fund/create", auth, createFund);
router.post("/fund/recurringFund", auth, recurringFund);
router.get("/user/getfunds", auth, getUserFunds);
router.get("/admin/getfunds", adminAuth, getAdminFunds);
router.patch("/fund/:id", auth, updateFund);
router.delete("/fund/:id", adminAuth, deleteFund);
router.post("/paymentStatus/:id", paymentStatus);
module.exports = router;
