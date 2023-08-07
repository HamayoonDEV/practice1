import Joi from "joi";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import UserDTO from "../DTO/UserDto.js";
import JWTServce from "../services/JWTservices.js";
import RefreshToken from "../models/token.js";
const passwordPattren =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[ -/:-@\[-`{-~]).{6,64}$/;

const controller = {
  //Register router
  async register(req, res, next) {
    //validate user input using joi
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      name: Joi.string().max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().pattern(passwordPattren).required(),
      confirmpassword: Joi.ref("password"),
    });
    //validate userLoginSchema of error occurs will handle through middleware
    const { error } = userRegisterSchema.validate(req.body);

    if (error) {
      return next(error);
    }
    const { username, name, email, password } = req.body;

    // password hashing through bcryptjs module
    const hashedPassword = await bcrypt.hash(password, 10);

    //match username and and email if already registerd
    let user;
    let accessToken;
    let refreshToken;
    try {
      const usernameInUse = await User.exists({ username });
      const emailInUse = await User.exists({ email });
      if (usernameInUse) {
        const error = {
          status: 409,
          message: "username is not avaliable please choose anOther!!!",
        };
        return next(error);
      }
      if (emailInUse) {
        const error = {
          status: 409,
          message: "email is already in use please use anOther email!!!",
        };
        return next(error);
      }
      //store in database

      try {
        const userToRegister = new User({
          username,
          name,
          email,
          password: hashedPassword,
        });
        user = await userToRegister.save();
        //genrate tokens
        accessToken = JWTServce.accessToken({ _id: user._id }, "30m");
        refreshToken = JWTServce.refreshToken({ _id: user._id }, "60m");
      } catch (error) {
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    //store Refresh token
    await JWTServce.storeRefreshToken(refreshToken, user._id);
    //sending tokens to the cookie
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    //sending response
    res.status(200).json({ user, auth: true });
  },

  //login router
  async login(req, res, next) {
    //validate user input by Joi
    const userLoginSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      password: Joi.string().pattern(passwordPattren).required(),
    });
    //validate userLoginSchema if error occur middleware will handle it
    const { error } = userLoginSchema.validate(req.body);

    if (error) {
      return next(error);
    }
    const { username, password } = req.body;
    //match username and password from database
    let user;
    try {
      user = await User.findOne({ username });
      if (!user) {
        const error = {
          status: 400,
          message: "invalid username!!",
        };
        return next(error);
      }
      //match password using bcrypt
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        const error = {
          status: 400,
          message: "invalid password!!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    //adding tokens
    const accessToken = JWTServce.accessToken({ _id: user._id }, "30m");
    const refreshToken = JWTServce.refreshToken({ _id: user._id }, "60m");
    //update refresh token to the database
    try {
      await RefreshToken.updateOne(
        {
          _id: user._id,
        },
        {
          token: refreshToken,
        },
        {
          upsert: true,
        }
      );
    } catch (error) {
      return next(error);
    }

    //sending tokens to the cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });

    //using data transfor object
    const userDto = new UserDTO(user);
    res.status(201).json({ user: userDto, auth: true });
  },

  //logout controller
  async logout(req, res, next) {
    const { refreshToken } = req.cookies;
    //delete refresh Token from db
    try {
      await RefreshToken.deleteOne({ token: refreshToken });
    } catch (error) {
      return next(error);
    }
    //clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    //send response
    res.status(200).json({ user: null, auth: false });
  },
};

export default controller;
