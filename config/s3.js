require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWSAccessKeyId,
        secretAccessKey: process.env.AWSSecretKey,
    }
});

// Reusable function to upload a single file to S3
async function uploadToS3(file) {
    const fileStream = fs.createReadStream(file.path);

    const uploadParams = {
        Bucket: process.env.BUCKET,
        Body: fileStream,
        Key: file.filename, // Make sure the filename is unique if necessary
        ContentType: file.mimetype, // Set correct MIME type
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        return {
            fileType: file.mimetype,
            fileSize: file.size,
            fileName: file.originalname,
            path: `https://${process.env.BUCKET}.s3.amazonaws.com/${file.filename}` // Construct the URL
        };
    } catch (error) {
        console.error(`Error uploading ${file.originalname}:`, error);
        throw new Error(`Failed to upload ${file.originalname}`);
    }
}

// Main function to handle both single and multiple file uploads
async function uploadFiles(files) {
    try {
        console.log("Uploading to S3:", files);

        // Check if it's a single file (Array of one file)
        if (!Array.isArray(files.user_image)) {
            console.log("Uploading single file.");
            const result = await uploadToS3(files);
            return { Key: result.path, obj1: result };

        // Handle multiple files (user_image array)
        } else if (files && Array.isArray(files.user_image)) {
            console.log("Uploading multiple files.");
            const uploadPromises = files.user_image.map(uploadToS3);
            const results = await Promise.all(uploadPromises);
            return results.map(result => ({ fileUrl: result.path, obj1: result }));

        } else {
            console.log("No files to upload or invalid format.");
            return []; // Return empty array for no files
        }

    } catch (err) {
        console.error("Error during file upload:", err);
        throw new Error("File upload failed");
    }
}
// const s3 = new S3({
//     region,
//     accessKeyId,
//     secretAccessKey,
// });




// //uploads a file to s3
// async function uploadFiles(files) {
//     try {
//         console.log("uploading to s3>>>>>>>>>>>>>>>>>>>>", files);
//         // Check if files is an array or an object with a property user_image
//         if (Array.isArray(files)) {
//             // Handle single file upload
//             console.log("inside the if condition");
//             const file = files[0]; // Assuming only one file is uploaded
//             const fileStream = fs.createReadStream(file.path);
//             console.log('this is file', file, fileStream);
//             const uploadParams = {
//                 Bucket: process.env.BUCKET,
//                 Body: fileStream,
//                 Key: file.filename,
//             };
//             console.log('this is file', file);
//             const uploadedFile = await s3.upload(uploadParams).promise();
//             let obj1 = {
//                 fileType: file.mimetype,
//                 fileSize: file.size,
//                 fileName: file.originalname,
//                 path: uploadedFile.Location // Assuming you want to include the URL in obj1
//             };
//             return { fileUrl: uploadedFile.Location, obj1 };
//         } else if (files && files.user_image && Array.isArray(files.user_image)) {
//             console.log("inside the if condition");
//             // Handle multiple file upload
//             const uploadPromises = files.user_image.map(async (file) => {
//                 const fileStream = fs.createReadStream(file.path);
//                 console.log('this is file', file, fileStream);
//                 const uploadParams = {
//                     Bucket: process.env.BUCKET,
//                     Body: fileStream,
//                     Key: file.filename,
//                 };
//                 console.log('this is file', file, fileStream, uploadParams);
//                 const uploadedFile = await s3.upload(uploadParams).promise();
//                 let obj1 = {
//                     fileType: file.mimetype,
//                     fileSize: file.size,
//                     fileName: file.originalname,
//                     path: uploadedFile.Location // Assuming you want to include the URL in obj1
//                 };
//                 return { fileUrl: uploadedFile.Location, obj1 };
//             });

//             return Promise.all(uploadPromises);
//         } else {
//             console.log("No files to upload or user_image is not an array");
//             return Promise.resolve([]); // Return a resolved promise with an empty array
//         }
//     }
//     catch (err) {
//         return err;
//     }
// }

// exports.uploadFiles = uploadFiles;

// function uploadFile(file) {
//     try {

//         const fileStream = fs.createReadStream(file.path);
//         const uploadParams = {
//             Bucket: process.env.BUCKET,
//             Body: fileStream,
//             Key: file.filename,
//         };
//          let data = s3Client.upload(uploadParams).promise();
//          console.log("this is updated document>>>>>>>>",data)
//          return data
//     }
//     catch (err) {
//         return err;
//     }
// }

// exports.uploadFile = uploadFile;

// // downloads a file from s3
function getFileStream(req, res) {
    try {
        const params = {
            Key: req.params.key,
            Bucket: process.env.BUCKET,
        };
        return s3Client.getObject(params, function (err, data) {
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.write(data?.Body, 'binary');
            res.end(null, 'binary');
        });
    }
    catch (err) {
        return err;
    }
}
// exports.getFileStream = getFileStream
module.exports = { uploadFiles, getFileStream };
