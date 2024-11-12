const { writeFile } = require("fs");
const fetch = require("node-fetch");
const uid = require("uid-safe");
const { uploadFiles } = require("./s3");

const saveNetworkImage = async (url) => {
  try{

    const networkImage = await fetch(url).catch(function (err) {
      
    });
  if (networkImage.status === 200) {
    const extension = networkImage.headers.get("content-type").split("/").pop();
    const profilePic = await networkImage
      .arrayBuffer()
      .then((buffer) => Buffer.from(buffer));

    const name = await uid(16);

    const image = `${name}.${extension}`.replace("./", "/");

    await writeFile("uploads/profile/" + image, profilePic, (err) => {
      if (err) console.log(err);
      uploadFiles({ path: "uploads/profile/" + image, filename: image })
    });
    return {
      hasError: false,
      image: image,
    };
  } else {
    
    return {
      hasError: true,
      message: "Error while fetching image",
    };
  }
}
catch (err) {
  return err;
}
};
module.exports = { saveNetworkImage };
