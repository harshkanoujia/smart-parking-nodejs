const SYSTEM_FAILURE = "Something failed.";
const INVALID_USER = "No user registered with given Id";
const INACTIVE_ACCOUNT = "Account is not active. Please get in touch with app admin.";
const TOKEN = 'There might be a problem while generating Token. !'



//admin.js
const ADMIN_CONSTANTS = {
  NOT_FOUND: 'No Admin account is found',
  INVALID_ADMIN: 'The Admin is not valid',
  VALIDATION_FAILED: 'Validation failed',
  INVALID_EMAIL_PASSWORD: "Your email or password is not correct.",
  INVALID_EMAIL: "Invalid Email.",
  INVALID_PASSWORD: 'Invalid Password. Try again !',
  BLOCKED_ACCOUNT: "Your account is blocked. Please contact admin.",
  INVALID_MANAGER: "No MANAGER with given Id found.",
  DUPLICATE_MANAGER: "MANAGER with given email already exists.",
  MANAGER_DELETE_SUCCESS: "Manager account deleted  successfully",
  MANAGER_STATUS_UPDATE: "Manager account Status updated successfully",
  DUPLICATE_DATA: "Email which you are trying to submit for this manager is already taken.",
  TOKEN_NOT_GENREATE: TOKEN,
  LOGGED_IN: "You are logged in successfully.",
  LOGGED_OUT: "Logged Out successfully",
  SYSTEM_FAILURE: SYSTEM_FAILURE,
  SERVER_NOT_RESPOND: 'Server did not respond correctly.',
}

// manager.js
const MANAGER_CONSTANTS = {
  INACTIVE_ACCOUNT: INACTIVE_ACCOUNT,
  INVALID_ID: "No manager registered with given Id",
  INVALID_EMAIL: "The email provided is not registered. Please sign up to continue.",
  USERNAME_ALREADY_EXISTS: "UserName already registered",
  EMAIL_ALREADY_EXISTS: "Email already registered",
  MOBILE_ALREADY_EXISTS: "Mobile number already registered.",
  INVALID_PASSWORD: 'Invalid Password. Try again !',
  INVALID_CREDENTIALS: 'Invalid credentials. check again !',
  MOBILE_EMAIL_ALREADY_EXISTS: "Mobile and email are already registered.",
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

// users.js
const USER_CONSTANTS = {
  INACTIVE_ACCOUNT: INACTIVE_ACCOUNT,
  INVALID_USER: INVALID_USER,
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
  LOGGED_IN: "You are logged in successfully.",
  LOGGED_OUT: "Logged Out successfully",
  DELETE_SUCCESS: "User account is deleted."
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
  CONTACT_ADMIN: "Your account is in blocked state.Please Contact Admin ",
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
  INVALID_BOOKING: "booking with given Id not found.",
  INVALID_SERVICE: "Service with given Id not found",
  INVALID_CARMODEL: "This membership is not for the car Model which you have specified.Please select other card option to continue with the services",
  INITIAL_STAGE: "The booking you are trying to do is already at it's initial stage",
  ARRIVED_SUCCESS: "Provider has arrived",
  STARTED_SUCCESS: "Provider has started his job",
  END_JOB_SUCCESS: "Provider has completed his job",
  MOVING_DESTINATION: "Provider has started moving to the destination",
  REACHED_DESTINATION: "Provider has reached the destination",
  FAILED_BOOKING: "Payment is not going through for this booking. Please get in touch with app admin.",
  INVALID_CARD: "Card with given Id not found.",
  INVALID_PROVIDER: "Provider with given Id not found.",
  MEDIA_SERVICE: "Images and Video need to be uploaded",
  INVALID_PLAN: "There is no membership plan with this given Id.Kindly check Whether you have any activated plan or not",
  PAYMENT_FAILED: "Payment Failed. Please check your payment method and try again.",
  INPROGRESS_SUCCESS: "Provider has started the service",
  PROVIDER_INPROGRESS_FAILURE: "Your task is already in progress.",
  NOT_STARTED: "Provider has not yet started his journey",
  CANT_BOOK: "You can't accept multiple requests. You can accept another request once you have started the service of current request.",
  CANCEL_SUBMIT_SUCCESS: "Booking Cancelled Successfully.",
  UPLOADED_SUCCESSFULLY: "Image is uploaded successfully.",
  CANCEL_BOOKING: "Are you sure you want to cancel?",
  CANT_BE_CANCELLED: "Request can't be cancelled once the service is started.",
  REFUND_PENDING: "If you cancel your booking now, You will be charged with $10",
  REFUND_SUBMIT_SUCCESS: "Refund status for the booking updated successfully.",
  NO_REFUND: "If you cancel your booking now, There will be no Refund",
  ZERO_CHARGES: "Are you sure you want to Cancel this Request?",
  CANCEL_CHARGES: "You will be Charged a $10 cancellation fee. Are you sure you would like to Cancel this Request?",
  CANCEL_NOT_AVAILABLE: "You are not authorized to cancel the booking at this stage",
  MEDIA: "Please upload video for maximum 30 secounds or upload one picture",
};

// OTP.js
const OTP_CONSTANTS = {
  INVALID_USER: INVALID_USER,
  NO_USER_REGISTERED_ERROR: "No user registered with given mobile number",
  DUPLICATE_MOBILE_NUMBER: "Mobile number entered is already registered. Please try to login.",
  INVALID_MOBILE_NUMBER: "Invalid mobile number entered. Please provide valid US mobile number.",
  EMAIL_SENDING_FAILED: "Email sending failed due to some application issue",
  OTP_GENERATED_SUCCESSFULLY: "Verification code generated successfully",
  OTP_VERIFIED: "Verification code verified for new user",
  INVALID_OTP: "Invalid Code",
  OTP_MAX_LIMIT_ERROR: "Max attempts to verify code breached",
  OTP_EXPIRED: "Verification code expired",
  OTP_VERIFIED_NEW_USER: "Verification code verified for new user",
};


module.exports = {
  ADMIN_CONSTANTS,
  MANAGER_CONSTANTS,
  USER_CONSTANTS,
  AUTH_CONSTANTS,
  BOOKING_CONSTANTS,
  OTP_CONSTANTS,
  SYSTEM_FAILURE
}