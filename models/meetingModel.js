const mongoose = require("mongoose");

const meetingSchema = mongoose.Schema({

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        require: false,
    },
    amount: {
        type: Number
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "passed"],
        default: "pending"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    link: {
        type: String,
    },
    date: {
        type: String,
    },
    time: {
        type: String,

    },

    paymentType: {
        type: String,
        enum: ["stripe", "visa"],
        default: "stripe"
    },
    paymentId: {
        type: String,
    }

}, {
    timestamps: true,
})

const meetingModel = mongoose.model("meeting", meetingSchema);

module.exports = { meetingModel }