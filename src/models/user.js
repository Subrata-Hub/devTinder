const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 50,
    },
    lastName: {
      type: String,
      maxLength: 30,
    },
    emailId: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address: " + value);
        }
      },
    },

    password: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Enter a strong password: " + value);
        }
      },
    },

    age: {
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      validate(value) {
        if (!["male", "female", "others"].includes(value)) {
          throw new Error("Gender data is not valid");
        }
      },
    },
    photoUrl: {
      type: String,
      default:
        "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740",
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Invalid image url: " + value);
        }
      },
    },
    about: {
      type: String,
      default: "This is default about of the user",
    },
    skills: {
      type: [String],
    },

    location: {
      type: String,
    },

    city: {
      type: String,
    },

    phoneNumber: {
      type: String,
      minLength: [10, "Phone number should have a minimum of 10 digits"],
      maxLength: [10, "Phone number should have a maximum of 10 digits"],
      match: [/^\d{10}$/, "Phone number should only contain digits"],
    },

    alternativeEmail: {
      type: String,
      lowercase: true,
      // unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address: " + value);
        }
      },
    },
    brithday: {
      type: String,
      validate(value) {
        if (!validator.isDate(value)) {
          throw new Error("Invalid date: " + value);
        }
      },
    },
    hobbies: {
      type: [String],
    },

    passwordResetCode: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },

  {
    timestamps: true,
  }
);

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, "subrata$123@321", {
    expiresIn: "7d",
  });

  return token;
};

userSchema.methods.validatePassword = async function (userInputPassword) {
  const passwordHash = this.password;

  const isPasswordValid = await bcrypt.compare(userInputPassword, passwordHash);
  return isPasswordValid;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
