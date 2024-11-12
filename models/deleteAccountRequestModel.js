const mongoose = require("mongoose");
const deleteRequestSchema =new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required:true
    },
    reason: {
      type: String,
      required:true,
    },
    requestStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default:"pending"
    },
  },
  {
    timestamps: true,
  }
);

const deleteRequestModel = mongoose.model("deleteRequest", deleteRequestSchema);

module.exports =  {deleteRequestModel} 
