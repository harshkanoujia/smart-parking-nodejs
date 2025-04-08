const SYSTEM_FAILURE = "Something failed.";
const INVALID_USER = "No user registered with given Id";
const INACTIVE_ACCOUNT = "Account is not active. Please get in touch with app admin.";


//admin.js
const ADMIN_CONSTANTS = {
  NOT_FOUND: 'No Admin account is found',
  INVALID_EMAIL: "Invalid Email.",
  INVALID_PASSWORD: 'Invalid Password. Try again !',
  MANAGER_STATUS_UPDATE: "Manager account Status updated successfully",
  USER_STATUS_UPDATE: "User account Status updated successfully",
  LOGGED_IN: "You are logged in successfully.",
  LOGGED_OUT: "You are logged out successfully",
}

// manager.js
const MANAGER_CONSTANTS = {
  INACTIVE_ACCOUNT: INACTIVE_ACCOUNT,
  INVALID_CREDENTIALS: 'Invalid credentials. check again !',
  INVALID_PASSWORD: 'Invalid Password. Try again !',
  INVALID_ID: "No manager registered with given Id",
  MOBILE_EMAIL_ALREADY_EXISTS: "Mobile and email are already registered.",
  CREATED_SUCCESS: "Account created successfully.",
  UPDATE_SUCCESS: "Account updated successfully",
  LOGGED_IN: "You are logged in successfully.",
  LOGGED_OUT: "You are logged out successfully",
  DELETE_SUCCESS: "Account Deleted Successfully."
};

// users.js
const USER_CONSTANTS = {
  INACTIVE_ACCOUNT: INACTIVE_ACCOUNT,
  INVALID_USER: INVALID_USER,
  BLOCKED_ACCOUNT: "Your account is blocked. Please contact admin.",
  INVALID_CREDENTIALS: 'Invalid credentials. check again !',
  USERNAME_ALREADY_EXISTS: "UserName already registered",
  EMAIL_ALREADY_EXISTS: "Email already registered",
  MOBILE_ALREADY_EXISTS: "Mobile number already registered",
  MOBILE_EMAIL_ALREADY_EXISTS: "Mobile and email are already registered",
  INVALID_PASSWORD: 'Invalid Password. Try again !',
  ALL_CHECKS_VALID: "All check are valid. Proceed for OTP",
  VERIFICATION_SUCCESS: "Continue for OTP.",
  INVALID_OTP: "Invalid OTP passed",
  OTP_MISSING: "No OTP passed. OTP is required for registration.",
  OTP_MISSING_UPDATE: "No OTP passed. OTP is required for update.",
  CREATED_SUCCESS: "Account created successfully.",
  UPDATE_SUCCESS: "Account updated successfully",
  LOGGED_IN: "You are logged in successfully.",
  LOGGED_OUT: "Logged Out successfully",
  DELETE_SUCCESS: "Account deleted Successfully."
};

// auth.js
const AUTH_CONSTANTS = {
  INVALID_USER: INVALID_USER,
  INVALID_AUTH_TOKEN: "Invalid Token.",
  EXPIRED_TOKEN: "Token has been expired.",
  VERIFICATION_FAILED: "Token verification failed.",
  ACCESS_DENIED: "Access denied. No authorization token provided",
  RESOURCE_FORBIDDEN: "You don't have access to the request resource.",
  TOKEN_NOT_GENREATE: "There might be a problem while generating Token. !",
  INVALID_CREDENTIALS: "Invalid email/userName or password",
  INVALID_PASSWORD: "You have entered incorrect old password. Please try again with valid password.",
  INACTIVE_ACCOUNT: INACTIVE_ACCOUNT,
  CONTACT_ADMIN: "Your account is in blocked state. Please Contact Admin ",
  CHANGE_PASSWORD_REQUEST_SUCCESS: "Password recovery link has been sent to your registered email.",
  CHANGE_PASSWORD_REQUEST_EMAIL_FAILURE: "Email sending failed due to some application issue.",
  INVALID_EMAIL: "The email provided is not registered. Please sign up to continue.",
  INVALID_RECOVERY_LINK: "Password link expired or not valid.",
  PASSWORD_CHANGE_SUCCESS: "Password changed succesfully",
  INVALID_OTP: "Invalid OTP passed",
  INVALID_MOBILE: "No user found with given mobile number.",
  MOBILE_REQUIRED: '"mobile" is required',
  OTP_TOKEN_REQUIRED: '"otpToken" is required',
  INVALID_EMAIL_MOBILE: 'The email/mobile you provided is not registered',
  SESSION_EXPIRED: "Your session has been expired.",
  SYSTEM_FAILURE: SYSTEM_FAILURE,
};

//booking constants
const BOOKING_CONSTANTS = {
  INVALID_USER: INVALID_USER,
  SLOT_NOT_AVALIABLE: "Oh Sorry !. There is no slot left now in this area",
  INVALID_BOOKING: "booking with given Id not found.",
  CANCEL_SUBMIT_SUCCESS: "Booking Cancelled Successfully.",
  SUBMIT_SUCCESS: "Booking Created Successfully.",
  INVALID_VEHICLE_USER: "Your Vehicle is not allowed in this Parking. !Choose Different area.",
};

const PARK_AREA_CONSTANTS = {
  AREA_CREATED_SUCCESS: "Parking Area created successfully.",
  NOT_FOUND: "Area not found !"
}

const PARK_AREA_SLOT_CONSTANTS = {
  AREA_NOT_FOUND: "Parking Area not found !",
  VEHICLE_NOT_FOUND: "vehicle not found !",
  NOT_FOUND: "Slot not found !"
}

module.exports = {
  ADMIN_CONSTANTS,
  MANAGER_CONSTANTS,
  USER_CONSTANTS,
  AUTH_CONSTANTS,
  BOOKING_CONSTANTS,
  PARK_AREA_CONSTANTS,
  PARK_AREA_SLOT_CONSTANTS
}