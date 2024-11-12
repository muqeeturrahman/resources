

const OAuth2Client  = require("google-auth-library");
const  {saveNetworkImage} = require("./saveNetworkImage.js");





const accessTokenValidator = async (accessToken, socialType) => {
  // const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, GOOGLE_CLIENT_ID } = process.env;
  const GOOGLE_CLIENT_ID = "1032301465589-40bki147b0llaukgutir625cguf3h3en.apps.googleusercontent.com"
  let name, email, dateOfBirth, profilePic, gender, imageUrl;
  switch (socialType) {
    // case "facebook": {
    //   if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    //     return {
    //       hasError: true,
    //       message: "Facebook app id or secret is not provided",
    //     };
    //   }
    //   const { data } = await fetch(
    //     `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
    //   ).then((r) => r.json());

    //   if (!data.is_valid && data.error) {
    //     return {
    //       hasError: true,
    //       message: data.error.message,
    //     };
    //   }
    //   const { user_id } = data;
    //   const getUserData = await fetch(
    //     `https://graph.facebook.com/${user_id}?fields=id,name,email,picture,age_range,gender,birthday&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
    //   ).then((r) => {
    //     return r.json();
    //   });
    //   name = getUserData.name;
    //   imageUrl = getUserData.picture.data.url;

    
    //   gender = getUserData.gender;
    //   email = user_id;
    //   dateOfBirth = getUserData.birthday;

    
    //   break;
    // }
    case "google": {
      if (!GOOGLE_CLIENT_ID) {
        return {
          hasError: true,
          message: "Google client id is not provided",
        };
      }
      // const GOOGLE_PUBLIC_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
      // const response = await fetch(GOOGLE_PUBLIC_KEYS_URL);
      // const keys = await response.json();
      
      // const decoded = jwt.sign(accessToken, keys);
      



      const client = new OAuth2Client.OAuth2Client(GOOGLE_CLIENT_ID);
      const googleResponse = await client.verifyIdToken({
        idToken: accessToken,
        requiredAudience: GOOGLE_CLIENT_ID,
      });
      const data = googleResponse.getPayload();
      

      if (!data.aud && data.error) {
        return {
          hasError: true,
          message: data.error.message,
        };
      }
      
      name = data.name;
      imageUrl = data.picture;
      email = data.email;
      break;
    }
    case "apple": {
      return {
        hasError: true,
        message: "Apple login is not supported yet",
      };
    }
    default: {
      return {
        hasError: true,
        message: "Invalid social type",
      };
    }
  }
  const { hasError, message, image } = await saveNetworkImage(imageUrl);
  if (hasError) {
    return {
      hasError: true,
      message,
    };
  }

  return {
    hasError: false,
    data: {
      name,
      image,
      email,
      dateOfBirth,
      profilePic,
      gender,
    },
  };
};
module.exports = {   accessTokenValidator};

