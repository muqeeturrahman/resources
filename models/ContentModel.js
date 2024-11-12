const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    content_type: {
        type: String,
        enum: ['pp', 'tc'],
        default: 'pp'
    },
    content_content: {
        type: String,
    }
}, {
    timestamps: true
});



const Content = mongoose.model('content', contentSchema);

module.exports = { Content };