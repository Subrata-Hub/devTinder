// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

const sgMail = require("@sendgrid/mail");

const sendMail = async (recipient, message, subject) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // sgMail.setDataResidency('eu');
  // uncomment the above line if you are sending mail using a regional EU subuser

  const msg = {
    to: recipient, // Change to your recipient
    from: "update@tindervibe.online", // Change to your verified sender
    subject: subject,
    text: "and easy to do anywhere, even with Node.js",
    html: message,
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
};

module.exports = sendMail;
