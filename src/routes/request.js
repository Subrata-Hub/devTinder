const express = require("express");
const { userauth } = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const sendMail = require("../utils/sendEmail");

const requestRouter = express.Router();

requestRouter.post(
  "/request/send/:status/:toUserId",
  userauth,
  async (req, res) => {
    try {
      const fromUserId = req.user?._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      const allowedStatus = ["ignored", "interested"];

      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          message: "Invalid status type: " + status,
        });
      }

      const toUser = await User.findById(toUserId);

      console.log(toUser);

      if (!toUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const existingConectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingConectionRequest) {
        return res.status(400).json({
          message: "Connection request already exit",
        });
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();

      // console.log(data);

      // const message = `<strong>${req.user.firstName} is ${status} in ${toUser.firstName}</strong>`;
      // const message = `<div>
      //   <div class="">
      //     <h1>tindervibe</h1>
      //     <div>
      //       <img src=${toUser.photoUrl}/>
      //     </div>
      //   </div>
      //   <div>
      //     <img src=${req.user.photoUrl}/>
      //     <h2>${req.user.firstName}</h2>
      //   </div>
      //   <div>
      //     <button>
      //       <a>Accept</a>
      //     </button>
      //      <button>
      //       <a>View Profile</a>
      //      </button>

      //   </div>
      // </div>`;

      const message = `<div style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td style="padding: 20px 0;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border: 1px solid #cccccc; border-radius: 8px; overflow: hidden;">
                    
                    <tr>
                        <td align="center" style="padding: 20px 0 20px 0; background-color: #fd5068; color: #ffffff;">
                            <h1 style="font-size: 28px; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">tindervibe</h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 30px 30px 30px; text-align: center;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <img src="${toUser?.photoUrl}" alt="Your Photo" width="100" height="100" style="display: block; border-radius: 50%; margin: 0 auto;" />
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="padding: 20px 0;">
                                        <h2 style="margin: 0; color: #333333; font-size: 24px;">${req.user.firstName} sent you a vibe!</h2>
                                        <p style="margin: 10px 0 0 0; color: #555555; font-size: 16px;">See if you're a match.</p>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding-top: 20px;">
                                        <img src="${req?.user?.photoUrl}" alt="sender_photo's Photo" width="150" height="150" style="display: block; border-radius: 50%; margin: 0 auto; border: 4px solid #f0f0f0;" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 20px 30px 40px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" width="50%" style="padding-right: 10px;">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="border-radius: 25px; background-color: #2dbd73;">
                                                    <a href="" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 25px; padding: 15px 25px; border: 1px solid #2dbd73; display: inline-block; font-weight: bold;">Accept Vibe</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="center" width="50%" style="padding-left: 10px;">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="border-radius: 25px; background-color: #ffffff;">
                                                    <a href="" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: #fd5068; text-decoration: none; border-radius: 25px; padding: 15px 25px; border: 1px solid #fd5068; display: inline-block; font-weight: bold;">View Profile</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 30px 30px; background-color: #eeeeee; text-align: center;">
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #888888;">
                                You received this email because you have a tindervibe account.
                                <br><br>
                                &copy; 2025 tindervibe. All Rights Reserved.
                                <br>
                                <a href="" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>
                </td>
              </tr>
          </table>
      </div>`;

      await sendMail(toUser?.emailId, message, "I Want to connect");

      res.json({
        message: `${req.user.firstName} is ${status} in ${toUser.firstName}`,
        data,
      });
      // const message = `${req.user.firstName} is ${status} in ${toUser.firstName}
    } catch (error) {
      res.status(400).send("ERROR:" + error.message);
    }
  }
);

requestRouter.post(
  "/request/review/:status/:requestId",
  userauth,
  async (req, res) => {
    try {
      const toUserId = req.user._id;
      const { status, requestId } = req.params;
      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "status not allowed" });
      }

      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: toUserId,
        status: "interested",
      });

      // console.log(connectionRequest);

      if (!connectionRequest) {
        return res
          .status(404)
          .json({ message: "Connection request not found" });
      }

      connectionRequest.status = status;

      const data = await connectionRequest.save();

      if (data) {
        const userToSentEmail = await User.findOne({
          _id: data?.fromUserId,
        });

        const subject = `${userToSentEmail?.firstName}, start a conversation with your new connection, ${req?.user?.firstName}`;
        const message = `
          <div style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td style="padding: 20px 0;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border: 1px solid #cccccc; border-radius: 8px; overflow: hidden;">

                  <tr style="display: flex; justify-content: space-between">
                        <td align="center" style="padding: 20px 0 20px 0 ">
                        <h1 style="font-size: 20px; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                              tindervibe
                            </h1>
                            <img src="${userToSentEmail.photoUrl}" alt="Your Photo" width="70" height="70" style="display: block; border-radius: 50%; margin: 0 auto;/>
                        
                            
                        </td>
                    </tr>
                    
                    <tr>
                        <td align="center" style="padding: 20px 0 20px 0;">
                            <h2 style="font-size: 20px; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                              ${req?.user?.firstName} has accepted your invitation.Let's start a conversation
                            </h2>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 30px 30px 30px; text-align: center;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <img src="${req.user.photoUrl}" alt="Your Photo" width="100" height="100" style="display: block; border-radius: 50%; margin: 0 auto;" />
                                        <h2>${req?.user.firstName}  ${req.user?.lastName}</h2>
                                        <button>Message</button>
                                    </td>
                                </tr>
                                
                               
                            </table>
                        </td>
                    </tr>
                    
                    
                    
                    <tr>
                        <td style="padding: 30px 30px; background-color: #eeeeee; text-align: center;">
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #888888;">
                                You received this email because you have a tindervibe account.
                                <br><br>
                                &copy; 2025 tindervibe. All Rights Reserved.
                                <br>
                                <a href="" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>
                </td>
              </tr>
          </table>
      </div>

        `;
        await sendMail(userToSentEmail?.emailId, message, subject);
      }

      // console.log(data);

      //  const message = `<strong>connection request ${status} </strong>`;

      res.json({ message: `connection request ${status}`, data });
    } catch (error) {
      res.status(400).send("ERROR:" + error.message);
    }
  }
);

module.exports = requestRouter;
