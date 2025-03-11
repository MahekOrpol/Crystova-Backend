const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const {
  authService,
  userService,
  tokenService,
  emailService,
} = require("../services");
const Joi = require("joi");
const { password } = require("../validations/custom.validation");
const { User, Admin, Token, Register } = require("../models");
const ApiError = require("../utils/ApiError");
const auth = require("../middlewares/auth");
const { jwt } = require("../config/config");
const {
  generateToken,
  generateResetPasswordToken,
} = require("../services/token.service");
const { token } = require("morgan");
const bcrypt = require("bcryptjs");


const register = {
  validation: {
    body: Joi.object().keys({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().required().email(),
      password: Joi.string().required().custom(password),
      ConfirmPassword: Joi.string()
        .required()
        .valid(Joi.ref("password"))
        .messages({ "any.only": "Passwords do not match" }),
    }),
  },
  handler: async (req, res, next) => {
    try {
      const existingUser = await Register.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(httpStatus.BAD_REQUEST).send({ message: "User already registered" });
      }

      // Hash password before saving
      req.body.password = await bcrypt.hash(req.body.password, 10);

      // const newUser = await new Register(req.body).save();
      
      // // Ensure token generation is working
      // const token = await tokenService.generateAuthTokens(newUser);
      // if (!token) {
      //   throw new Error("Token generation failed");
      // }


      const newUser = await new Register(req.body).save();

console.log("New User Created:", newUser); // Debugging log

const token = await tokenService.generateAuthTokens(newUser);
if (!token) {
  throw new Error("Token generation failed");
}


      return res.status(httpStatus.CREATED).send({ token, user: newUser });
    } catch (error) {
      console.error("Register Error:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error.message });
    }
  },
};

  
  const login = {
    validation: {
      body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required(),
      }),
    },
    handler: async (req, res) => {
      const { email, password } = req.body;
  
      const user = await Register.findOne({ email });
      if (!user) {
        return res.status(httpStatus.UNAUTHORIZED).send({ message: "Incorrect email or password" });
      }
  
      // 🔥 Compare hashed password 🔥
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(httpStatus.UNAUTHORIZED).send({ message: "Incorrect email or password" });
      }
  
      const token = await tokenService.generateAuthTokens(user);
      return res.status(httpStatus.OK).send({ token, user });
    },
  };
  

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

// const forgotPassword = catchAsync(async (req, res) => {
//   const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
//   await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
//   res.status(httpStatus.NO_CONTENT).send();
// });

const resetPassword = catchAsync(async (req, res) => {
  await Admin.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(
    req.params
  );
  console.log("res", res);
  await emailService.sendVerificationEmail(req.params.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendOtp = {
  validation: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
    }),
  },
  handler: async (req, res) => {
    const admin = await Admin.findOne({ email: req.body.email });
    if (!admin) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "email not found",
      });
    }

    const generateOTP = () => {
      const digits = "0123456789";
      let OTP = "";

      for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }

      return OTP;
    };

    const randomOTP = generateOTP();
    console.log("Random OTP:", randomOTP);

    const newAdmin = await Admin.findOneAndUpdate(
      { email: req.body.email },
      { generateOTP: randomOTP },
      { new: true, upsert: true }
    );

    await emailService.sendOtpOnEmail(req.body.email, randomOTP);

    return res.status(httpStatus.OK).send(newAdmin);
  },
};

const verifyOTP = {
  validation: {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      generateOTP: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    const { email, generateOTP } = req.body;
    console.log(generateOTP);
    if (generateOTP) {
      const admin = await Admin.findOne({ email, generateOTP });

      if (admin) {
        const token = generateToken({ email: req.body.email, isAdmin: true });

        const newAdmin = await Admin.findOneAndUpdate(
          { email: req.body.email },
          { token: token },
          { new: true, upsert: true }
        );

        return res
          .status(httpStatus.OK)
          .send({
            success: true,
            message: "OTP verification successful!",
            newAdmin,
          });
      } else {
        return res
          .status(httpStatus.BAD_REQUEST)
          .send({ success: false, message: "Invalid OTP." });
      }
    }
  },
};

const forgotPassword = {
  validation: {
    body: Joi.object().keys({
      password: Joi.string().required().custom(password),
      confirmPassword: Joi.string().required(),
      token: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {
    const { password, token } = req.body;

    const admin = await Admin.findOne({ token });
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    } else {
      res
        .status(httpStatus.OK)
        .send({ success: true, message: "Password reset successfully", admin });
    }
    admin.password = password;
    admin.confirmPassword = password;
    await admin.save();
  },
};

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  // forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  sendOtp,
  verifyOTP,
  forgotPassword,
};
