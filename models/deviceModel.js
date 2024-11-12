const mongoose = require("mongoose");
const DeviceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "user",
        },
        lastSeen: {
            type: Date,
            default: Date.now(),
        },
        deviceType: {
            type: String,
            // enum: ["android", "postman", "mac"],
            default: "android",
        },
        deviceToken: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const deviceModel = mongoose.model("device", DeviceSchema);

module.exports = { deviceModel }
