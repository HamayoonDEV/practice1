import JWTServce from "../services/JWTservices.js";
import UserDTO from "../DTO/UserDto.js";
import User from "../models/user.js";
const auth = async (req, res, next) => {
  //validate tokens
  const { refreshToken, accessToken } = req.cookies;

  if (!refreshToken || !accessToken) {
    const error = {
      status: 401,
      message: "unAuthrized!",
    };
    return next(error);
  }
  //verfiy accessToken
  let _id;
  try {
    _id = JWTServce.verifyAccessToken(accessToken)._id;
  } catch (error) {
    return next(error);
  }
  let user;
  try {
    user = await User.findOne({ _id });
  } catch (error) {
    return next(error);
  }
  const userDto = new UserDTO(user);
  req.user = userDto;
  next();
};

export default auth;
