// const mongoose = require('mongoose');
// // process.env.DB
// // let connection;

// const connect = async () => {
//     try {
//         // mongoose.set('useFindAndModify', false);

//         const connection = await mongoose.connect(process.env.DB, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//             useCreateIndex: true
//         });

//         console.log('DB connection created.');
//         return connection;
//     } catch (err) {
//         console.log(err.message);
//     }
// }

// module.exports = connect;
'use strict';

const mongoose = require('mongoose');

class DB_CONNECT {
    constructor() {
        mongoose.set('strictQuery', true);
        mongoose.connect(process.env.DB)
            .then(() => console.log(`Connected to DB!`)) //: ${process.env.MONGODB_URL}`))
            .catch((error) => console.log("db error: ", error));
    }
}

module.exports = DB_CONNECT;