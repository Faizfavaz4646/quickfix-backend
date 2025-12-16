const validator = require("validator");


const validateSignupData = (data) => {
  const errors = {};

  // Name validation
  if (!data.name) {
    errors.name = "Name is required";
  }

  // Email validation
  if (!validator.isEmail(data.emailId)) {
    errors.email = "Email address is invalid";
  }

  // Password validation
  if (!validator.isStrongPassword(data.password)) {
    errors.password = "Password is not strong enough";
  }

  // Role validation
  const allowedRoles = ["client", "worker"];
  if (!data.role || !allowedRoles.includes(data.role)) {
    errors.role = "Role is required and must be either 'client' or 'worker'";
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
};
const validateClientProfileData = (data) => {
  const allowedFields = [
    "phone",
    "gender",
    "state",
    "district",
    "city",
    "zip",
    "profilePic",
    "requests",
    "completedJobs",
    "activeJobs",
    "notifications",
    "ratings",
    "reviews",
    "preferences"
  ];

  return Object.keys(data).every(field =>
    allowedFields.includes(field)
  );
};


module.exports = { validateSignupData,validateClientProfileData };

