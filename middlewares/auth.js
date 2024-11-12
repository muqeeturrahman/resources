//// one with id is below this
const { User } = require("../models/User");
const { verify } = require("jsonwebtoken");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const setHeader = (token) => {
  const setToken = token.substring(7);
  return setToken;
};

const auth = async (req, res, next) => {
  if (!req.headers.authorization) {
    res
      .status(401)
      .send({ status: 0, message: "Authentication Field is required" });
  } else {
    const token = setHeader(req.headers.authorization);
    console.log("Extracted Token:", token);

    // const userFind = await User.findOne({
    //   user_authentication: { $in: [token] },
    // });
    verify(token, process.env.JWT_SECRET, async function (err, decoded) {
      if (err)
        return res
          .status(401)
          .json({ error: "authorization is not valid access denied" });
      else {
        const userObj = await User.findOne({ _id: decoded._id });
        if (!userObj)
          return res
            .status(401)
            .json({ error: "authorization is not valid access denied" });
        console.log("this is user", decoded);

        req.user = userObj;
        next();
      }
    });
    // console.log(req.headers.authorization);
    // if (userFind) {
    //   req.user = userFind;
    //   next();
    // } else {
    //   if (req.file?.path) {
    //     fs.unlink(req.file?.path, (err) => { });
    //   }
    // return res.status(401).send({ status: 0, message: "Wrong Auth Token!" });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header("authorization");
    console.log("token", token);

    // if token is empty
    if (!token) {
      console.log("token is not valid access denied");
      return res
        .status(401)
        .json({ error: "authorization is not valid access denied" });
    }
    console.log("test");
    // verify jwt token
    jwt.verify(
      token,
      process.env.JWT_SECRET_ADMIN,
      async function (err, decoded) {
        console.log(err);
        // check if token is invalid
        if (err) {
          console.log("error condition");
          return res
            .status(401)
            .json({ error: "authorization is not valid access denied" });
        } else {
          console.log("success condition");

          req.user = decoded;
          next();
        }
      }
    );
  } catch (error) {
    console.log("catch condition");
    console.log(error.message);
    // error handling
    return res
      .status(401)
      .json({ error: "authorization is not valid access denied" });
  }
};

module.exports = { auth, adminAuth };

// const { User } = require('../models/User');
// const fs = require('fs');

// const setHeader = (token) => {
//   const setToken = token.substring(7);
//   return setToken;
// }

// const auth = async (req, res, next) => {

//   if (!req.body.user_id) {
//     res.status(400).send({ status: 0, message: 'User ID field is required!' });
//   }
//   else if (!req.headers.authorization) {
//     res.status(400).send({ status: 0, message: 'Authentication Field is required' });
//   }

//   else {
//     const userFind = await User.findOne({ _id: req.body.user_id, user_authentication: setHeader(req.headers.authorization) });
//     if (userFind) {
//       req.user = userFind;
//       next();

//     } else {
//       if (req.file) {
//         fs.unlinkSync(req.file.path);
//       }
//       return res.status(400).send({ status: 0, message: 'Wrong Auth Token!' });
//     }
//   }
// }

// module.exports = { auth }
