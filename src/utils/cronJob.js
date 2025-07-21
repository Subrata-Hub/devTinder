const cron = require("node-cron");

const { subDays, startOfDay, endOfDay } = require("date-fns");
const ConnectionRequest = require("../models/connectionRequest");
const sendMail = require("./sendEmail");

cron.schedule("4 56 * * * *", async () => {
  // send emaill to all people who have got connection request

  try {
    const yesterday = subDays(new Date(), 1);

    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    const pendingRequest = await ConnectionRequest.find({
      status: "interested",
      createdAt: {
        $gte: yesterdayStart,
        $lt: yesterdayEnd,
      },
    }).populate("fromUserId toUserId");

    const listOffEmail = [
      ...new Set(pendingRequest.map((req) => req.toUserId.emailId)),
    ];

    for (const email of listOffEmail) {
      try {
        const message = `There are so many friend request pending pleasr login to portal`;
        // await sendMail(
        //   email,
        //   message,
        //   `new frien request pending for ${email}`
        // );
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
  console.log("Hellow World" + new Date());
});
