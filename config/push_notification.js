var FCM = require("fcm-node");
const admin = require("firebase-admin");

const serviceAccount = require("./sky-resrouces-live-0e136ab16aae.json")
// var serverKey ="AAAAacxJ7gg:APA91bH8Unpz1fEt_zrLDnEdEJ9-tRIDnYOCOC5HcpFCvP1JJ6cuuZmOCDW0g7trS8qQN2p-tCKPutJu_xn_t7vaypSTb3HxrRJCnPzwwZDeyA_HlOquVfwsP4BXm31GXaBMqDAq6U9a";
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// var serverKey="AAAARlyQzK0:APA91bH3ARbErU_TgZPFqDSSbcLShdOCjCBp27EYILTt4rYrG82YsmMZgwh-HixmKOhGzE6tGCVffmja55Tu7TObr_M8iD_nrJUeAJXhg-BP4DFCNizJwxr4cKGlXU69CsKFjvdjW1Xn"
// var fcm = new FCM(serverKey);

const push_notifications = (notification_obj) => {
  console.log('this is all>>>>>>>>>>>>', notification_obj)
  console.log('this is devoce token>>>>>>>>>>>>', notification_obj.user_device_token)

  var message = {
    to: notification_obj.user_device_token,
    collapse_key: "your_collapse_key",

    notification: {
      title: notification_obj.title,
      body: notification_obj.body,
      sound: "default"
    },
  };

  fcm.send(message, function (err, response) {
    if (err) {
      console.log("err:", err);

    }
  });
};

const send_notifications = (tokens, notification, data) => {
  console.log("tokens", tokens);
  // console.log("object", object);
  console.log("data", data);

  const message = {
    data,
    notification,
    tokens,
  };
  console.log("message>>>>>>", message);
  try {

    if (tokens?.length > 0) {
      return admin.messaging()
        .sendEachForMulticast(message)
        .then((response) => {
          console.log('Successfully sent message:', response);
          return response;
        })
        .catch((error) => {
          console.log('Error sending message:', error);
          throw error;
        });
    }
  }
  catch (err) {
    return res.send(err.message);
  }
}

module.exports = { push_notifications, send_notifications };
