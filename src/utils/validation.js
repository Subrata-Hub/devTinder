const validator = require("validator");

const validateSignupData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName) {
    throw new Error("Name is not valid");
  } else if (firstName.length < 4 || lastName.length > 50) {
    throw new Error("Firstname should be 4-50 charecter");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Email is not valid");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Please enter a strong password");
  }
};

const validateEditProfileData = (req) => {
  const allowedEditFields = [
    "firstName",
    "lastName",
    "emailId",
    "photoUrl",
    "gender",
    "age",
    "about",
    "location",
    "city",
    "skills",
    "phoneNumber",
    "alternativeEmail",
    "brithday",
    "hobbies",
  ];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field)
  );
  return isEditAllowed;
};

const validateOnlyUserEmailField = (req) => {
  const allowedEmailField = ["emailId"];

  const isEmailAllowed = Object.keys(req.body).every((field) =>
    allowedEmailField.includes(field)
  );

  return isEmailAllowed;
};

const validateUserEmailField = (req) => {
  const allowedEmailField = ["emailId", "code", "password"];

  const isEmailAllowed = Object.keys(req.body).every((field) =>
    allowedEmailField.includes(field)
  );

  return isEmailAllowed;
};

const validateProfilePasswordData = (req) => {
  const allowedEditFields = ["password", "emailId"];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field)
  );
  return isEditAllowed;
};

module.exports = {
  validateSignupData,
  validateEditProfileData,
  validateProfilePasswordData,
  validateUserEmailField,
  validateOnlyUserEmailField,
};
