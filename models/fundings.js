const mongoose = require("mongoose");

const fundingSchema = mongoose.Schema({

    email: { type: String, required: true,},
    amount: {
        type: Number,
        min: 3.99,
        max: 60.01
    },

}, {
    timestamps: true,
})

const fundingsModel = mongoose.model("fundingsWeb", fundingSchema);

module.exports = { fundingsModel }