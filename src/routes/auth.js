const express = require("express");
const bcrypt = require("bcrypt");
const validator = require("validator");

const User = require("../models/user");
const {
  validateSignupData,
  validateProfilePasswordData,
  validateOnlyUserEmailField,
} = require("../utils/validation");
const { isUserExit, authorizationCheck } = require("../middleware/auth");
const sendMail = require("../utils/sendEmail");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    // validate the data
    validateSignupData(req);
    const { firstName, lastName, emailId, password } = req.body;
    // hash the password
    // const {password} = req.body
    const passwordHash = await bcrypt.hash(password, 10);
    // creating a new instance of the user models
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });
    const savedUser = await user.save();

    const token = await savedUser.getJWT();

    res.cookie("token", token, {
      expires: new Date(Date.now() + 80 * 3600000),
    });

    res.json({ message: "User created successfully", data: savedUser });
  } catch (err) {
    res.status(400).send("Error saving the user:" + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId: emailId });

    if (!user) {
      throw new Error("Invalid cradential");
    }

    // const isPasswordValidate = await bcrypt.compare(password, user.password);

    // offload isPasswordValidate logic into mongo schema method
    const isPasswordValidate = await user.validatePassword(password);
    if (isPasswordValidate) {
      // create JWT Token
      // const token = await jwt.sign({ _id: user._id }, "subrata$123@321", {
      //   expiresIn: "7d",
      // });

      // Offload this logic into mongo schema method

      const token = await user.getJWT();
      // Add the token to the cookie and send the responce back to the user
      res.cookie("token", token, {
        expires: new Date(Date.now() + 100 * 3600000),
      });
      res.send(user);
    } else {
      throw new Error("Invalid cradential");
    }
  } catch (error) {
    res.status(400).send("Error saving the user:" + error.message);
  }
});

authRouter.post("/findAccoundbyemail", async (req, res) => {
  try {
    if (!validateOnlyUserEmailField(req)) {
      throw new Error("Invalid account search request");
    }

    const userEmailId = req.body.emailId;

    if (!validator.isEmail(userEmailId)) {
      throw new Error("Email not valid");
    }

    const findUer = await User.findOne({ emailId: userEmailId });

    if (!findUer) {
      throw new Error(
        `No user Found for this ${userEmailId} . Please try again with other email.`
      );
    }

    res.send(findUer);
  } catch (error) {
    res.status(404).send("Error finding the user:" + error.message);
  }
});

authRouter.post("/recover", isUserExit, async (req, res) => {
  try {
    const user = req.user;

    const min = 100000;
    const max = 999999;

    if (!user) {
      throw new Error("User not found");
    }

    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    user.passwordResetCode = randomNumber.toString();
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const subject = `${randomNumber} is your password reset code`;

    const message = `
        <body style="margin: 0; padding: 0; background-color: #f4f4f4;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td style="padding: 20px 0;">
                <table  border="0" cellpadding="0" cellspacing="0" class="container" style="border-collapse: collapse; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">

                <tr>
    <td>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="left" style="padding: 20px 0 20px 30px;">
                    <h1 style="font-size: 20px; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                        tindervibe
                    </h1>
                </td>

                <td align="right" style="padding: 20px 30px 20px 0;">
                    <img src="${user.photoUrl}" alt="Your Photo" width="70" height="70" style="display: block; border-radius: 50%;"/>
                </td>
            </tr>
        </table>
    </td>
</tr>
                    
                  

                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #333333;">Password Reset Request</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0; font-size: 16px; color: #555555; line-height: 1.5;">Hi ${user?.firstName},</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 25px;">
                                        <p style="margin: 0; font-size: 16px; color: #555555; line-height: 1.5;">We received a request to reset your password. Enter the code below to proceed.</p>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding-bottom: 25px;">
                                        <div style="background-color: #f0f0f0; border-radius: 5px; padding: 15px 20px; text-align: center;">
                                            <p style="margin: 0; font-size: 28px; font-weight: bold; color: #333333; letter-spacing: 4px;">
                                                ${randomNumber}
                                            </p>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="center" style="border-radius: 5px; background-color: #007bff;">
                                                    <a href="[Password Reset Link]" target="_blank" style="font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 15px 25px; border: 1px solid #007bff; display: inline-block;">Change Password</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="border-top: 1px solid #eeeeee; padding-top: 20px;">
                                        <p style="margin: 0; font-size: 14px; color: #777777; line-height: 1.5;">
                                            If you didn't request this change, you can safely ignore this email. If you're concerned, please 
                                            <a href="[Secure Account Link]" style="color: #007bff; text-decoration: underline;">secure your account.</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f4f4f4; padding: 20px 30px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0; font-size: 12px; color: #999999;">
                                            &copy; 2025 [Your Company Name]. All rights reserved.<br>
                                            [Your Company Address], [City], [State] [Zip]
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
      `;

    await sendMail(user.emailId, message, subject);

    res.send("Recovery code has been sent to your email.");
  } catch (error) {
    res.status(400).send("Error saving the user:" + error.message);
  }

  // res.send(user);
});

authRouter.post(
  "/recover/verify-code",
  isUserExit,
  authorizationCheck,
  (req, res) => {
    try {
      res.send({
        message: "Code verified successfully. You can now reset your password.",
        emailId: req.user.emailId, // Send email back to use in the next step
      });
    } catch (error) {
      res.status(400).send("Error saving the user:" + error.message);
    }
  }
);

authRouter.post("/password-reset", isUserExit, async (req, res) => {
  try {
    if (!validateProfilePasswordData(req)) {
      throw new Error("Invalid edit request");
    }

    const user = req.user;

    const userNewPassword = req.body.password;

    if (!validator.isStrongPassword(userNewPassword)) {
      throw new Error("Enter your strong password");
    }

    const hashedPassword = await bcrypt.hash(userNewPassword, 10);

    user.password = hashedPassword;

    const savedUser = await user.save();

    const token = await savedUser.getJWT();

    res.cookie("token", token, {
      expires: new Date(Date.now() + 80 * 3600000),
    });

    res.send({ user, message: "Password Reset Successfully" });
  } catch (error) {
    res.status(400).send(`Error: ${error.message}`);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send("Logout successfull");
});

module.exports = authRouter;
