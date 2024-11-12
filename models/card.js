const mongoose = require("mongoose");

const cardSchema = mongoose.Schema({

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        require: false,
    },
    name: {
        type: String
    },
    cardNo: {
        type: String
    },
    expMonth: { type: Number },
    expYear: { type: Number },
    cvv: { type: Number }
}, {
    timestamps: true,
})

const cardModel = mongoose.model("card", cardSchema);

module.exports = { cardModel }