const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const fundingSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: false,
    },
    date: {
      type: String,
      required: false,
      trim: true,
      // default: Date.now,
    },
    startTime: {
      type: String,
      required: false,
      trim: true,
    },
    endTime: {
      type: String,
      required: false,
      trim: true,

    },

    title: { type: String },
    description: { type: String },
    amount: {
      type: Number,
      min: 3.99,
      max: 60.01,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    paymentType: {
      type: String,
      enum: ["stripe", "visa", "applepay", "googlepay"],
      default: "stripe",
    },
    paymentId: {
      type: String,
    },
    fundCode: {
      type: String,
      unique: true,
    },
    fundingType: {
      type: String,
      enum: ["payNow","recurring"],
      default: "payNow",
    },
  },
  {
    timestamps: true,
  }
);

fundingSchema.pre('save', function (next) {
  if (!this.fundCode) {
    this.fundCode = uuidv4();
  }
  next();
});
const fundingModel = mongoose.model("funding", fundingSchema);

module.exports = { fundingModel }