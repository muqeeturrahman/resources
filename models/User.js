const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema(
  {
    full_name: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    business_name: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    country: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    state: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    zip_postal_code: {
      type: Number,
      required: false,
      trim: true,
      default: null,
    },
    user_type: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    user_email: {
      type: String,
      required: false,
      trim: true,
      // unique: false,
      match:
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
    },

    // user_email: {
    //     type: String,
    //     required: false,
    //     trim: true,
    //     default: null
    // },
    user_password: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },

    company_name: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    city: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    user_phone: {
      type: String,
      required: false,
      trim: true,
      default: null,
      // match: [/^\+?\d+[\d\s]+$/, 'Please fill a valid telephone number']
    },

    user_verification_code: {
      type: Number,
      required: false,
      trim: true,
      default: null,
    },
    user_is_verified: {
      type: Number,
      default: 0,
      trim: true,
    },
    user_is_profile_complete: {
      type: Number,
      default: 0,
      trim: true,
    },
    notification: {
      type: String,
      default: "on",
      trim: true,
    },
    is_notification: {
      type: Number,
      default: 1,
      trim: true,
    },
    user_authentication: {
      type: String, // Changed to an array of strings
      required: false,

    },

    user_image: {
      type: String,
      required: false,
      default: null,
    },
    cover_image: {
      type: String,
      required: false,
      default: null,
    },
    user_social_token: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    user_social_type: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    devices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "device",
      require: false,
    }],
    isDeactivate: {
      type: Boolean,
      required: false,
      default: false,
    },
    isDeleted: { type: Boolean, required: false, default: false },
    is_member: {
      type: Boolean,
      required: false,
      default: false,
    },
    subscription_package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subscription",
      required: false,
      default: null,
      trim: true,
    },
    userType: {
      type: String,
    },

    // geolocation: {
    //     type: String,
    //     default: "on",
    //     trim: true,
    // },
    // is_geolocation: {
    //     type: Number,
    //     default: 1,
    //     trim: true,
    // },
    // is_favorite: {
    //     type: Number,
    //     default: 0,
    //     trim: true,
    // },
    // stripe_id: {
    //     type: String,
    //     default: null,
    //     trim: true,
    // },
    // is_blocked: {
    //     type: Number,
    //     default: 1,
    //     trim: true,
    // },
  },
  {
    timestamps: true,
  }
);

// user cart schema

const cardSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    card_number: {
      type: Number,
      default: null,
      trim: true,
    },
    exp_month: {
      type: Number,
      default: null,
      trim: true,
    },
    exp_year: {
      type: Number,
      default: null,
      trim: true,
    },
    card_cvc: {
      type: Number,
      default: null,
      trim: true,
    },
    stripe_token: {
      type: String,
      default: null,
      trim: true,
    },
    is_active: {
      type: Number,
      default: 0,
      trim: true,
    },
    is_blocked: {
      type: Number,
      default: 1,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const subscriptionSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
      default: null,
      trim: true,
    },
    // plan_id: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "subscriptionPlans",
    //   require: false,
    //   default: null,
    //   trim: true,
    // },
    // receipt: {
    //     // type: String,
    //     type: Object,
    //     require: false,
    //     default: null,
    // },
    // user_device_type: {
    //     type: String,
    //     require: false,
    //     trim: true,
    //     default: null,
    // },
    // is_blocked: {
    //     type: Number,
    //     require: false,
    //     default: 1,
    // },
    // plan_duration: {
    //     type: String,
    //     require: false,
    //     default: "",
    // },
    plan_type: {
      type: String,
      require: false,
      default: null,
    },
    subscribed_date: {
      type: Date,
      trim: true,
      default: Date.now(),
      // default: moment.utc(new Date()).format("MM DD YYYY")
    },
    expiryDate: {
      type: Date,
      trim: true,
      // default:Date.now()
      default: null,
    },
  },
  { timestamps: true }
);

// Here generate Auth Token
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  // return jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" });
  user.user_authentication = token;
  await user.save();
  return token;
};

// Hash Password save before  saving
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("user_password")) {
    user.user_password = await bcrypt.hash(user.user_password, 8);
  }
  next();
});

const userContactsSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    name: {
      type: String,
      trim: true,
    },

    business_address: {
      type: String,
      trim: true,
    },
    business_name: {
      type: String,
      trim: true,
    },
    phone: {
      type: Number,
    },
    email: {
      type: String,
      trim: true,
      required: true,
    },
    isDeleted: { type: Boolean, required: false, default: false },
    type: {
      type: String,
      enum: [
        "Agent",
        "Client",
        "Closing Services",
        "Attorney",
        "Inspector",
        "Appraiser",
        "others",
      ],
      default: "Agent",
    },
  },
  { timestamps: true }
);

userContactsSchema.index({ name: "text" }, { weights: { name: 8 } });

userContactsSchema.statics = {
  searchPartial: function (q, callback) {
    return this.find(
      {
        name: new RegExp(q, "gi"),
      },
      callback
    );
  },
};

const User = mongoose.model("user", userSchema);
const UserCard = mongoose.model("UserCard", cardSchema);
const SubscriptionModel = mongoose.model("subscription", subscriptionSchema);
const UserContactsModel = mongoose.model("UserContacts", userContactsSchema);

module.exports = { User, UserCard, SubscriptionModel, UserContactsModel };
