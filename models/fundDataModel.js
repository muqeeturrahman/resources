const mongoose = require("mongoose");

const fundingDataSchema = mongoose.Schema({

    title: { type: String },
    description: { type: String },
    amount: {
        type: Number,
        min: 3.99,
        max: 60.01
    },

}, {
    timestamps: true,
})

const fundingDataModel = mongoose.model("fundingData", fundingDataSchema);

module.exports = { fundingDataModel }