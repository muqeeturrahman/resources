const mongoose = require("mongoose");
const questionSchema = new mongoose.Schema({
  
      name: {
        type: String,
        required: true,
        
      },
      user_email: {
        type: String,
        required: true,
        trim: true,
        // unique: false,
        match:
          /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
      },
      user_phone: {
        type: String,
        required: false,
        trim: true,
        default: null,
        // match: [/^\+?\d+[\d\s]+$/, 'Please fill a valid telephone number']
      },
      message: {
        type: String,
        required: true,
        
      },
  
}, {
    timestamps: true
});



const questionsModel = mongoose.model('questions', questionSchema);

module.exports = { questionsModel };




