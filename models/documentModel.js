const mongoose = require("mongoose");
const documentSchema = mongoose.Schema({

    sendFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    To: {
        type: String,
    },
    message: {
        type: String,
    },
    subject: {
        type: String,
    },
    attachment: [{
        url: String,  // URL to the file in S3
        fileType: String, // Type of the file (e.g., 'image/png', 'application/pdf')
        fileSize: Number,
        fileName:String,
    }]
}, {
    timestamps: true,
})

const documentModel = mongoose.model("documentSchema", documentSchema);

module.exports = { documentModel }