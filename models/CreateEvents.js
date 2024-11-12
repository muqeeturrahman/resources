const mongoose = require("mongoose");
var moment = require("moment");

const alaramSettingSchema = mongoose.Schema(
  {
    main_event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mainevent",
      require: false,
      default: null,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: false,
    },
    title: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    alarm_time: {
      type: String,
      required: false,
      trim: true,
      default: Date.now,
      // default: new Date('2022-02-25')
    },
    attachment: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const subEventsSchema = mongoose.Schema(
  {
    main_event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mainevent",
      require: false,
      default: null,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: false,
    },
    title: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "contact",
      },
    ],
    // address: {
    //   type: String,
    //   required: false,
    //   trim: true,
    //   default: null,
    // },
    // phone_number: {
    //   type: String,
    //   required: false,
    //   trim: true,
    //   default: null,
    //   // match: [/^\+?\d+[\d\s]+$/, 'Please fill a valid telephone number']
    // },
    description: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    // select_duration: {
    //     type: String,
    //     required: false,
    //     trim: true,
    //     default: null
    // },
    date: {
      type: String,
      required: false,
      trim: true,
      default: Date.now,
      // default: new Date('2022-02-25')
    },
    startTime: {
      type: String,
      required: false,
      trim: true,
      // default: Date.now,
      // default: ""
      // default: moment.utc(moment.utc().valueOf()).toDate()
    },
    endTime: {
      type: String,
      required: false,
      trim: true,
      // default: Date.now,
      // default: moment.utc(moment.utc().valueOf()).toDate()
    },
    select_status: {
      type: String,
      required: false,
      enum: ["complete", "pending", "ongoing"],
      default: "pending",
    },
    select_interval_time: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    recurring: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    select_color: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
    select_purpose: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      required: false,
      enum: ["complete", "pending", "ongoing"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);
const mainEventSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: false,
    },
    date: {
      type: String,
      required: false,
      trim: true,
      default: Date.now,

      // default: new Date('2022-02-25')
    },
    startTime: {
      type: String,
      required: false,
      trim: true,
      // default: Date.now,
      // default: ""
      // default: moment.utc(moment.utc().valueOf()).toDate()
    },
    endTime: {
      type: String,
      required: false,
      trim: true,
      // default: Date.now,
      // default: moment.utc(moment.utc().valueOf()).toDate()
    },
    title: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    select_purpose: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    // select_duration: {
    //     type: String,
    //     required: false,
    //     trim: true,
    //     default: null
    // },
    // address: {
    //   type: String,
    //   required: false,
    //   trim: true,
    //   default: null,
    // },
    // phone_number: {
    //   type: String,
    //   required: false,
    //   trim: true,
    //   default: null,
    //   // match: [/^\+?\d+[\d\s]+$/, 'Please fill a valid telephone number']
    // },
    description: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    select_interval_time: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    // alaram_setting: [alaramSettingSchema],
    alarm_setting: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "alarms",
        require: false,
        default: null,
      },
    ],
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserContacts",
        require: false,
        default: null,
      },
    ],
    // sub_events: [subEventsSchema],
    sub_events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subevent",
        require: false,
        default: null,
      },
    ],
    recurring: {
      type: String,
      required: false,
      default: "no recurring",
      enum: ["no recurring", "weekly", "daily", "monthly"]
    },
    select_color: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },

    template: {
      type: Boolean,
      required: false,
      default: false,
    },
    status: {
      type: String,
      required: false,
      enum: ["complete", "pending", "ongoing"],
      default: "pending",
    },
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const templateEventSchema = mongoose.Schema(
  {
    main_event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mainevent",
      require: false,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: false,
    },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserContacts",
      },
    ],
    title: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    select_purpose: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },

    description: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    select_interval_time: {
      //notification time
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    sub_events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "templatesubevent",
        require: false,
        default: [],
      },
    ],
    recurring: {
      type: String,
      required: false,
      default: "no recurring",
      enum: ["no recurring", "weekly", "daily", "monthly"]
    },

    select_color: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    // template: {
    //   type: Boolean,
    //   required: false,
    //   default: false,
    // },
    status: {
      type: String,
      required: false,
      enum: ["complete", "pending", "ongoing"],
      default: "pending",
    },
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
    order: {
      type: Number,
      required: false,
    
  
    },
  },
  {
    timestamps: true,
  }
);
const templateSubEventSchema = mongoose.Schema(
  {
    main_event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "templateevent",
      require: false,
      default: null,
    },
    no_of_days: { type: Number },
    startTime: {
      type: String,
      required: false,
      trim: true,
      // default: ""
      // default: moment.utc(moment.utc().valueOf()).toDate()
    },
    rank: {
      type: Number
    },
    endTime: {
      type: String,
      required: false,
      trim: true,
      // default: Date.now,
      // default: moment.utc(moment.utc().valueOf()).toDate()
    },
    select_purpose: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    select_interval_time: {
      //notification time
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    recurring: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    select_color: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
const contactSchema = mongoose.Schema({
  main_event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mainevent",
    require: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    require: true,
  },
  name: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
});
const generalAlarmSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: false,
    },
    title: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    id: {
      type: String
    },
    date_time: {
      type: String,
      required: false,
      trim: true,
      default: Date.now,
      // default: new Date('2022-02-25')
    },
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const Contact = mongoose.model("contact", contactSchema);
const MainEvent = mongoose.model("mainevent", mainEventSchema);
const TemplatEevent = mongoose.model("templateevent", templateEventSchema);
const TemplatSubEevent = mongoose.model(
  "templatesubevent",
  templateSubEventSchema
);
const SubEvents = mongoose.model("subevent", subEventsSchema);
const Alarams = mongoose.model("alarms", alaramSettingSchema);
const GeneralAlarm = mongoose.model("generalAlarm", generalAlarmSchema);
module.exports = {
  MainEvent,
  SubEvents,
  Alarams,
  TemplatEevent,
  GeneralAlarm,
  Contact,
  TemplatSubEevent,
};
