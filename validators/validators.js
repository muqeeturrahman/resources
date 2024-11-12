const { check, body, validationResult } = require("express-validator");
const mongoose = require("mongoose");

// custom validators
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const userId = check("userId", "userId is required")
  .not()
  .isEmpty()
  .custom((value) => isValidObjectId(value))
  .withMessage("Invalid UserId");

exports.validationFunction = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// admin validators

// auth validators
exports.adminLoginValidator = [
  check("user_email", "user_email is required").not().isEmpty().isEmail(),
  check("user_password", "user_password is required")
    .not()
    .isEmpty()
    .isString(),
];

// user management validators
exports.viewUsersValidator = [
  check("status", "status is required").not().isEmpty().isBoolean(),
];

exports.blockUnblockUsersValidator = [userId];

exports.updateUserValidator = [userId];

exports.deleteUserValidator = [userId];

exports.sendPushNotificationValidator = [
  check("title", "title is required").not().isEmpty().isString(),
  check("body", "body is required").not().isEmpty().isString(),
];

exports.deleteRequestValidator = [
  check("user_email", "user_email is required").not().isEmpty().isString(),
  check("user_password", "user_password is required")
    .not()
    .isEmpty()
    .isString(),
  check("reason", "reason is required").not().isEmpty().isString(),
];

