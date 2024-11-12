

const { Types } = require("mongoose");
const { TemplatEevent, TemplatSubEevent, MainEvent } = require("../models/CreateEvents");
const templatecreate = async (req, res) => {
  try {
    const {
      contacts,
      title,
      select_purpose,
      description,
      select_interval_time,
      recurring,
      select_color,
      sub_events,
    } = req.body;
    let temp = await TemplatEevent.find({ user_id: req.user.id }); // find all the template 
    var order = temp.length+1 // take template length as a order number of the newly templateEvent 
    var tempdata = new TemplatEevent({
      user_id: req.user._id,
      contacts,
      title,
      select_purpose,
      description,
      select_interval_time,
      recurring,
      select_color,
      order
    });
    tempdata = await tempdata.save();
    if (sub_events?.length > 0) {
      tempdata.sub_events = []
      sub_events.map(async (item, index) => {

        var tempsub = new TemplatSubEevent({
          ...item,
          rank: index + 1,
          main_event: tempdata._id,
        });
        tempsub = await tempsub.save();
        tempdata.sub_events.push(tempsub)
        await TemplatEevent.findByIdAndUpdate(tempdata._id, {
          $push: { sub_events: tempsub._id },
        });

        if (!sub_events[index + 1]) {
          return res.status(200).send({
            status: 1,
            message: "You have created template event successfully",
            data: tempdata,
          });
        }
      });
    } else {

      if (tempdata) {
        return res.status(200).send({
          status: 1,
          message: "You have created template event successfully",
          data: tempdata,
        });
      } else {
        return res.status(200).send({
          status: 0,
          message: "Error in creating template",
        });
      }
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const getTemplateById=async(req,res)=>{
  try{
const {id}=req.params
const template = await TemplatEevent.findById(id).populate("contacts sub_events")
return res.status(200).send({
  status: 1,
  message: "template",
  data:template
});
  }
  catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const defaultTemplate = async (req, res, next) => {
  try {
    console.log("userid", req.user._id);
    const mainEvents = await TemplatEevent.insertMany([
      {
        contacts: [],
        title: "",
        select_purpose: "Buyer - Agreement Execution",
        description: "Congratulations on having your offer accepted! I'll be sending over the signed agreement for your records shortly. This is an exciting first step towards homeownership. Please inform your lender that your offer has been accepted. We’ll keep you updated with key dates and tasks to ensure everything moves forward smoothly.",
        select_interval_time: "10 Minutes",
        sub_events: [],
        recurring: "no recurring",
        select_color: "Color(0xff8bc34a)",
        status: "pending",
        isDeleted: false,
        user_id: req.user._id,
        order: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        contacts: [],
        title: "",
        select_purpose: "Seller - Agreement Executed",
        description: "Your property offer has been accepted—excellent news! I'll send you the signed agreement shortly. We’ll ensure everything is set up for a smooth journey to settlement.",
        select_interval_time: "10 Minutes",
        sub_events: [],
        recurring: "no recurring",
        select_color: "Color(0xffff9800)",
        status: "pending",
        isDeleted: false,
        user_id: req.user._id,
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        contacts: [],
        title: "",
        select_purpose: "Buyer - Real Estate Meeting",
        description: "I’m thrilled to meet with you and start this exciting journey toward finding your perfect home! During our meeting, I’ll provide a Consumer Notice to clarify the roles and duties in our potential real estate relationship. This document is informative, not a contract, but it will help you understand the various ways I can support you as your agent. We’ll review all necessary steps and set clear expectations for a smooth process. Looking forward to guiding you to your new home!",
        select_interval_time: "10 Minutes",
        sub_events: [],
        recurring: "no recurring",
        select_color: "Color(0xffcddc39)",
        status: "pending",
        isDeleted: false,
        user_id: req.user._id,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        contacts: [],
        title: "",
        select_purpose: "Seller - Real Estate Meeting",
        description: "Congratulations on taking the first step towards selling your property! I am looking forward to our meeting where I will go over the Consumer Notice that outlines our potential relationship and the duties I owe to you as a real estate agent. This notice is not a contract but a guide to help us navigate through the selling process effectively. We'll discuss all the necessary steps to ensure that we can move forward smoothly and efficiently. Excited to assist you in making this a successful sale!",
        select_interval_time: "10 Minutes",
        sub_events: [],
        recurring: "no recurring",
        select_color: "Color(0xffff5722)",
        status: "pending",
        isDeleted: false,
        user_id: req.user._id,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        contacts: [],
        title: "",
        select_purpose: "Appraisal Inspection & Completion",
        description: "Prepare Files for Inspection.\nBatteries Charged and Directions",
        select_interval_time: "40 Minutes",
        sub_events: [],
        recurring: "no recurring",
        select_color: "Color(0xffffeb3b)",
        status: "pending",
        isDeleted: false,
        user_id: req.user._id,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        contacts: [],
        title: "",
        select_purpose: "Client - Phone Call",
        description: "",
        select_interval_time: "10 Minutes",
        sub_events: [],
        recurring: "no recurring",
        select_color: "Color(0xfff44336)",
        status: "pending",
        isDeleted: false,
        user_id: req.user._id,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        contacts: [],
        title: "",
        select_purpose: "Personal",
        description: "Personal Time",
        select_interval_time: "10 Minutes",
        sub_events: [],
        recurring: "no recurring",
        select_color: "Color(0xff673ab7)",
        status: "pending",
        isDeleted: false,
        user_id: req.user._id,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    const subEvents = await TemplatSubEevent.insertMany([
      {
        main_event: mainEvents[0]._id,
        select_purpose: "Initial Deposit",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "Please prepare to make your initial deposit within the next 5 days. This deposit secures your commitment to the property and keeps our process on track.",
        select_color: "Color(0xff8bc34a)",
        no_of_days: 5,
        startTime: "9:30 AM",
        endTime: "9:35 AM",
        rank: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {

        main_event: mainEvents[0]._id,
        select_purpose: "Contact Closing Company",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "Reaching out to a closing company, will start the sale moving forward. They will verify all the information with you and initiate a title search to ensure there are no legal impediments to your ownership of the property. This is a critical step to protect your investment.",
        select_color: "Color(0xff8bc34a)",
        no_of_days: 6,
        startTime: "9:30 AM",
        endTime: "9:35 AM",
        rank: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {

        main_event: mainEvents[0]._id,
        select_purpose: "Inspection Period Ends",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "We need to complete all home inspections by this date. Following the inspections, we’ll discuss any necessary actions based on the findings.",
        select_color: "Color(0xff8bc34a)",
        no_of_days: 10,
        startTime: "9:30 AM",
        endTime: "9:35 AM",
        rank: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        main_event: mainEvents[0]._id,
        select_purpose: "Negotiate Repairs",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "Should there be any issues from the inspections, I’ll negotiate with the seller on your behalf for necessary repairs. This ensures your new home meets your expectations.",
        select_color: "Color(0xff8bc34a)",
        no_of_days: 15,
        startTime: "9:30 AM",
        endTime: "9:35 AM",
        rank: 5,
        createdAt: new Date(),
        updatedAt: new Date(),

      },
      {
        main_event: mainEvents[0]._id,
        select_purpose: "Mortgage Application",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "It's important to submit your complete mortgage application soon. This step is essential to secure your financing on time.",
        select_color: "Color(0xff8bc34a)",
        no_of_days: 7,
        startTime: "9:30 AM",
        endTime: "9:35 AM",
        rank: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {

        main_event: mainEvents[0]._id,
        select_purpose: "Mortgage Rate Lock-In",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "We will be looking to lock in your mortgage rate soon to secure a favorable interest rate for your home loan. This helps ensure your future payments are stable.",
        select_color: "Color(0xff8bc34a)",
        no_of_days: 15,
        startTime: "9:30 AM",
        endTime: "9:35 AM",
        rank: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        main_event: mainEvents[0]._id,
        select_purpose: "Document Review",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "We will go over the Settlement Statement together to ensure all financial details are correct before closing. This final review helps avoid any surprises on the closing day.\n\nPrepare to bring any legal documents or closing. Also, do not forget your ID.",
        select_color: "Color(0xff8bc34a)",
        no_of_days: 38,
        startTime: "9:30 AM",
        endTime: "9:35 AM",
        rank: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {

        main_event: mainEvents[0]._id,
        select_purpose: "Closing and Possession",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "Closing day you'll sign the final documents and receive the keys to your new home. I'm excited to help you reach this wonderful milestone!",
        select_color: "Color(0xff8bc34a)",
        no_of_days: 40,
        startTime: "9:30 AM",
        endTime: "9:35 AM",
        rank: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        main_event: mainEvents[1]._id,
        select_purpose: "Respond to Inspections",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "Once we receive the inspection reports, we'll need to address any concerns promptly to keep the sale moving forward",
        select_color: "Color(0xffff9800)",
        no_of_days: 10,
        startTime: "9:40 AM",
        endTime: "9:45 AM",
        rank: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        main_event: mainEvents[1]._id,
        select_purpose: "Closing Day",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "Transfer Ownership on closing day, you'll sign off on the transfer documents. It’s the final step in successfully selling your property. Congratulations on reaching this point!",
        select_color: "Color(0xffff9800)",
        no_of_days: 40,
        startTime: "9:40 AM",
        endTime: "9:45 AM",
        rank: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        main_event: mainEvents[1]._id,
        select_purpose: "Finalize Documents and Utilities",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "Let’s ensure all documents are in order, settlement statement has been reviewed and utilities arrangements are ready for transfer. These final steps are crucial for a successful closing.",
        select_color: "Color(0xffff9800)",
        no_of_days: 38,
        startTime: "9:40 AM",
        endTime: "9:45 AM",
        rank: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        main_event: mainEvents[1]._id,
        select_purpose: "Final Walkthrough  & Utilities Preparation",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "We'll prepare for the final walkthrough with the buyer, ensuring the property is in the agreed condition to finalize the sale and contact the utility companies to schedule transfer of ownership.",
        select_color: "Color(0xffff9800)",
        no_of_days: 30,
        startTime: "9:40 AM",
        endTime: "9:45 AM",
        rank: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        main_event: mainEvents[1]._id,
        select_purpose: "Prepare for Inspections",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "Please prepare your property for buyer inspections. Ensuring everything is accessible and presentable will facilitate this process.",
        select_color: "Color(0xffff9800)",
        no_of_days: 5,
        startTime: "9:40 AM",
        endTime: "9:45 AM",
        rank: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        main_event: mainEvents[1]._id,
        select_purpose: "Deed Preparation",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "To start the process rolling, if you have a attorney that you would like to prepare the deed for transfer, you can reach out to them. If you do not have a desired attorney, we can recommend ones in the area or closing companies that can also prepare the deed as well.",
        select_color: "Color(0xffff9800)",
        no_of_days: 5,
        startTime: "9:40 AM",
        endTime: "9:45 AM",
        rank: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        main_event: mainEvents[1]._id,
        select_purpose: "Complete Agreed Repairs",
        select_interval_time: "10 Minutes",
        recurring: "no recurring",
        isDeleted: false,
        description: "Any repairs agreed upon with the buyer will need to be completed by this date. Prompt action here is key to maintaining the trust and momentum of the sale.",
        select_color: "Color(0xffff9800)",
        no_of_days: 20,
        startTime: "9:40 AM",
        endTime: "9:45 AM",
        rank: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    for (const subEvent of subEvents) {
      // Find the main event corresponding to this subEvent
      const mainEvent = mainEvents.find(event => event._id === subEvent.main_event);


      // If mainEvent is found, add the subEvent ID to its sub_events array
      if (mainEvent) {
        mainEvent.sub_events.push(subEvent._id);
        await mainEvent.save();
      }
    }

    res.status(200).send({
      message: "data get successfully",
      status: 0,
      data: { mainEvents, subEvents }
    });

  }
  catch (error) {
    return res.status(400).send({ status: 0, message: error.message });
  }
}

const orderChange = async (req, res, next) => {
  try {
    console.log("api is hitting>>>>>>>>>>>>>>");
    const { oldOrderEventId, oldOrderEvemtOrder, newOrderEventId, newOrderEventorder } = req.body;
    console.log("oldOrderEventId", oldOrderEventId);
    console.log("oldOrderEvemtOrder", oldOrderEvemtOrder);
    console.log("newOrderEventId", newOrderEventId);
    console.log("newOrderEventorder", newOrderEventorder);

    const event = await TemplatEevent.findByIdAndUpdate(oldOrderEventId, { order: oldOrderEvemtOrder }, { new: true })
    const event1 = await TemplatEevent.findByIdAndUpdate(newOrderEventId, { order: newOrderEventorder }, { new: true })
    res.status(200).send({
      message: "data get successfully",
      status: 1,
      data: { event, event1 }
    });
  }
  catch (error) {
    return res.status(400).send({ status: 0, message: error.message });
  }
}

const changeOrderTemp = async (req, res, next) => {
  try {
    console.log("API is hitting>>>>>>>>>>>>>>");
    const { temmpID, oldOrder, newOrder } = req.body;
    console.log("temmpID", temmpID);
    console.log("oldOrder", oldOrder);
    console.log("newOrder", newOrder);

    if (newOrder < oldOrder) {
      console.log("Reordering required");

      // Find documents within the range of newOrder and oldOrder
      const temp = await TemplatEevent.find({
        order: { $gte: newOrder, $lte: oldOrder },
        user_id: req.user._id
      }).sort({ order: 1 });

      // Loop through each document to adjust order
      for (const element of temp) {
        if (element._id != temmpID) {
          element.order = element.order + 1; // Increment order
          await element.save(); // Save the changes
        } else {
          element.order = newOrder; // Assign new order
          await element.save(); // Save the changes
        }
      }

      console.log("Reordering complete");
      res.status(200).send({
        message: "data get successfully",
        status: 1,
        data: temp
      });
    }else{
      console.log("Reordering required");

      // Find documents within the range of newOrder and oldOrder
      const temp = await TemplatEevent.find({
        order: { $lte : newOrder, $gte: oldOrder },
        user_id: req.user._id
      }).sort({ order: 1 });

      // Loop through each document to adjust order
      for (const element of temp) {
        if (element._id != temmpID) {
          element.order = element.order - 1; // Increment order
          await element.save(); // Save the changes
        } else {
          element.order = newOrder; // Assign new order
          await element.save(); // Save the changes
        }
      }

      console.log("Reordering complete");
      res.status(200).send({
        message: "data get successfully",
        status: 1,
        data: temp
      });
    }
  }
  catch (error) {
    return res.status(400).send({ status: 0, message: error.message });
  }
}
const templateget = async (req, res) => {
  try {
    const newData = await TemplatEevent.aggregate([
      {
        $match: {
          user_id: Types.ObjectId(req.user._id.toString()),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "templatesubevents",
          localField: "sub_events",
          foreignField: "_id",
          as: "sub_events",
        },
      },
     
      {
        $lookup: {
          from: "usercontacts",
          localField: "contacts",
          foreignField: "_id",
          as: "contacts",
        },
      },
    ]);

    if (newData.length > 0) {
      const ret = [];
      console.log("newData>>>>>>>>>>>>", newData);
      newData.map((item, index) => {
        if (item.main_event) {
          ret.push({
            _id: item._id,
            title: item.title,
            select_purpose: item.select_purpose,
            description: item.description,
            select_interval_time: item.select_interval_time,
            recurring: item.recurring,
            select_color: item.select_color,
            user_id: item.user_id,
            contacts: item.contacts,
            order: item.order,
            sub_events: item.sub_events.sort((a, b) => a.rank - b.rank),
            main_event: item.main_event

          });
        } else {

          ret.push({
            _id: item._id,
            title: item.title,
            select_purpose: item.select_purpose,
            description: item.description,
            select_interval_time: item.select_interval_time,
            recurring: item.recurring,
            select_color: item.select_color,
            user_id: item.user_id,
            order: item.order,
            contacts: item.contacts,
            sub_events: item.sub_events.sort((a, b) => a.rank - b.rank),


          });
        }
        console.log("ret1 bfore sorting>>>>>>>>>>>>", ret);
        const ret1 = ret.sort((a, b) => b.order - a.order)
        // if (item.sub_events?.length > 0) {
        //   item.sub_events.map((item2) => {
        //     ret.push({
        //       _id: item2._id,
        //       main_event_id: item2.main_event,
        //       select_purpose: item2.select_purpose,
        //       select_interval_time: item2.select_interval_time,
        //       recurring: item2.recurring,
        //       select_color: item2.select_color,
        //       description: item2.description,
        //       no_of_days: item2.no_of_days,
        //       startTime: item2.startTime,
        //       endtime: item2.endTime,
        //     });
        //   });
        // }
        if (!newData[index + 1]) {
          res.status(200).send({
            data: ret1,
            message: "data get successfully",
            status: 1,
          });
        }
      });
    } else {
      res.status(200).send({
        message: "data get successfully",
        status: 0,
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const templateupdate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await TemplatEevent.findOne({
      user_id: req.user._id,
      _id: id,
      isDeleted: false,
    });
    if (!data) {
      return res
        .status(200)
        .send({ status: 0, message: "Couldn't find template" });
    }
    const object_update = {
      contacts: req.body.contacts,
      title: req.body.title,
      select_purpose: req.body.select_purpose,
      description: req.body.description,
      select_interval_time: req.body.select_interval_time,
      recurring: req.body.recurring,
      select_color: req.body.select_color,
      order: req.body.order

    };
    for (const key in object_update) {
      if (object_update[key] === "" || object_update[key] === undefined) {
        delete object_update[key];
      }
    }
    const updateddata = await TemplatEevent.updateOne(
      { _id: id },
      object_update,
      {
        new: true,
      }
    );
    if (updateddata.nModified == 1) {
      return res.status(200).send({
        status: 1,
        message: "template updated successfully",
      });
    }
    return res.status(200).send({
      status: 0,
      message: "Error occured!",
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};

const templatedelete = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await TemplatEevent.findOne({
      user_id: req.user._id,
      _id: id,
      isDeleted: false,
    });
    if (!data) {
      return res
        .status(200)
        .send({ status: 0, message: "Couldn't find template" });
    }
    await TemplatSubEevent.updateMany(
      { _id: { $in: data.sub_events } },
      { isDeleted: true }
    );
    const deletedata = await TemplatEevent.updateOne(
      { _id: id },
      {
        isDeleted: true,
      }
    );
    if (deletedata.nModified == 1) {
      return res.status(200).send({
        status: 1,
        message: "template deleted successfully",
      });
    }
    return res.status(200).send({
      status: 0,
      message: "Error occured",
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const tempsubeventcreate = async (req, res) => {
  try {
    const {
      main_event,
      no_of_days,
      startTime,
      endtime,
      select_purpose,
      select_interval_time,
      recurring,
      description,
      select_color,
      rank
    } = req.body;
    var subeventdata = new TemplatSubEevent({
      main_event,
      no_of_days,
      startTime,
      endtime,
      select_purpose,
      select_interval_time,
      recurring,
      description,
      select_color,
      rank
    });
    subeventdata = await subeventdata.save();
    if (subeventdata) {
      await TemplatEevent.findByIdAndUpdate(main_event, {
        $push: { sub_events: subeventdata._id },
      });
      return res.status(200).send({
        status: 1,
        message:
          "You have created sub event of given template event successfully",
        data: subeventdata,
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "Error in creating template",
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const tempsubeventupdate = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await TemplatSubEevent.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!data) {
      return res
        .status(200)
        .send({ status: 0, message: "Couldn't find sub event" });
    }
    const {
      main_event,
      no_of_days,
      startTime,
      endTime,
      select_purpose,
      select_interval_time,
      recurring,
      description,
      select_color
    } = req.body;

    const object_update = {
      main_event,
      no_of_days,
      startTime,
      endTime,
      select_purpose,
      select_interval_time,
      recurring,
      select_color,
      description
    };
    for (const key in object_update) {
      if (object_update[key] === "" || object_update[key] === undefined) {
        delete object_update[key];
      }
    }
    const updateddata = await TemplatSubEevent.updateOne(
      { _id: id },
      object_update,
      {
        new: true,
      }
    );
    if (updateddata.nModified == 1) {
      return res.status(200).send({
        status: 1,
        message: "sub event updated successfully",
      });
    }
    return res.status(200).send({
      status: 0,
      message: "Error occured!",
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const tempsubeventdelete = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await TemplatSubEevent.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!data) {
      return res
        .status(200)
        .send({ status: 0, message: "Couldn't find subevent" });
    }
    await TemplatEevent.findOneAndUpdate(
      {
        _id: data.main_event,
      },
      { $pull: { sub_events: id } }
    );
    const deletedata = await TemplatSubEevent.updateOne(
      { _id: id },
      {
        isDeleted: true,
      }
    );

    if (deletedata.nModified == 1) {
      return res.status(200).send({
        status: 1,
        message: "template deleted successfully",
      });
    }
    return res.status(200).send({
      status: 0,
      message: "Error occured",
    });
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
const tempsubeventcreate1 = async (req, res) => {
  try {
   const templateSubEventArray=req.body;

 
   const subeventdata=await TemplatSubEevent.insertMany(templateSubEventArray)
    if (subeventdata) {
      for (const e of subeventdata) {
        console.log(e,"e");
        await TemplatEevent.findByIdAndUpdate(e.main_event, {
          $push: { sub_events: e._id },
        });
      }
   
      return res.status(200).send({
        status: 1,
        message:
          "You have created sub event of given template event successfully",
        data: subeventdata,
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "Error in creating template",
      });
    }
  } catch (e) {
    return res.status(400).send({ status: 0, message: e.message });
  }
};
module.exports = {
  templatecreate,
  tempsubeventcreate1,
  templateget,
  templateupdate,
  templatedelete,
  tempsubeventcreate,
  tempsubeventupdate,
  tempsubeventdelete,
  defaultTemplate,
  orderChange,
  changeOrderTemp,
  getTemplateById
};
