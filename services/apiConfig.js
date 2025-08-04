import { Platform } from "react-native";

// API Configuration for Lullaby App

// Environment detection
const isDevelopment = __DEV__;
const isAndroid = Platform.OS === "android";
const isIOS = Platform.OS === "ios";

// Base URL configuration
let BASE_URL;

if (isDevelopment) {
  // Development environment
  if (isAndroid) {
    // Android emulator uses 10.0.2.2 instead of localhost
    BASE_URL = "http://10.0.2.2:5294";
  } else if (isIOS) {
    // iOS simulator can use localhost
    BASE_URL = "http://localhost:5294";
  } else {
    // Web or other platforms
    BASE_URL = "http://localhost:5294";
  }
} else {
  // Production environment - replace with your actual production URL
  BASE_URL = "https://your-production-api.com";
}

console.log(
  `API Base URL: ${BASE_URL} (${
    isDevelopment ? "Development" : "Production"
  })`
);

// Authentication & Account Management Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${BASE_URL}/api/accounts/login`,
  REGISTER_NURSING_SPECIALIST: `${BASE_URL}/api/accounts/register/nursingspecialist`,
  REGISTER_MANAGER: `${BASE_URL}/api/accounts/register/manager`,
  REGISTER_CUSTOMER: `${BASE_URL}/api/accounts/register/customer`,
  CREATE_ACCOUNT: `${BASE_URL}/api/accounts/create`,
  GET_ACCOUNT_BY_ID: (id) => `${BASE_URL}/api/accounts/get/${id}`,
  GET_ALL_ACCOUNTS: `${BASE_URL}/api/accounts/getall`,
  GET_ALL_MANAGERS: `${BASE_URL}/api/accounts/managers`,
  GET_ALL_CUSTOMERS: `${BASE_URL}/api/accounts/customers`,
  UPDATE_ACCOUNT: (id) => `${BASE_URL}/api/accounts/update/${id}`,
  UPDATE_NURSING_SPECIALIST: (id) =>
    `${BASE_URL}/api/nursingspecialists/update/${id}`,
  SOFT_DELETE_ACCOUNT: (id) =>
    `${BASE_URL}/api/accounts/remove/${id}`,
  HARD_DELETE_ACCOUNT: (id) =>
    `${BASE_URL}/api/accounts/delete/${id}`,
  BAN_ACCOUNT: (id) => `${BASE_URL}/api/accounts/ban/${id}`,
};

// Zone Endpoints
const ZONE_ENDPOINTS = {
  GET_ALL: `${BASE_URL}/api/zones/getall`,
  GET_BY_ID: (id) => `${BASE_URL}/api/zones/getbyid/${id}`,
  UPDATE: (id) => `${BASE_URL}/api/zones/update/${id}`,
  DELETE: (id) => `${BASE_URL}/api/zones/delete/${id}`,
  CREATE: `${BASE_URL}/api/zones/create`,
};

// Zone Details Endpoints
export const ZONE_DETAIL_ENDPOINTS = {
  GET_ZONE_DETAIL_BY_ID: (id) =>
    `${BASE_URL}/api/zonedetails/get/${id}`,
  GET_ALL_ZONE_DETAILS: `${BASE_URL}/api/zonedetails/getall`,
  CREATE_ZONE_DETAIL: `${BASE_URL}/api/zonedetails/create`,
  UPDATE_ZONE_DETAIL: (id) =>
    `${BASE_URL}/api/zonedetails/update/${id}`,
  DELETE_ZONE_DETAIL: (id) =>
    `${BASE_URL}/api/zonedetails/delete/${id}`,
};

// Care Profiles Endpoints
export const CARE_PROFILE_ENDPOINTS = {
  GET_ALL_CARE_PROFILES: `${BASE_URL}/api/careprofiles/getall`,
  GET_CARE_PROFILE_BY_ID: (id) =>
    `${BASE_URL}/api/careprofiles/get/${id}`,
  CREATE_CARE_PROFILE: `${BASE_URL}/api/careprofiles/create`,
  UPDATE_CARE_PROFILE: (id) =>
    `${BASE_URL}/api/careprofiles/update/${id}`,
  DELETE_CARE_PROFILE: (id) =>
    `${BASE_URL}/api/careprofiles/delete/${id}`,
};

// Relatives Endpoints
export const RELATIVE_ENDPOINTS = {
  GET_ALL_RELATIVES: `${BASE_URL}/api/relatives/getall`,
  GET_RELATIVE_BY_ID: (id) => `${BASE_URL}/api/relatives/get/${id}`,
  GET_RELATIVES_BY_CARE_PROFILE_ID: (careProfileID) =>
    `${BASE_URL}/api/relatives/getbycareprofileid/${careProfileID}`,
  CREATE_RELATIVE: `${BASE_URL}/api/relatives/create`,
  UPDATE_RELATIVE: (id) => `${BASE_URL}/api/relatives/update/${id}`,
  DELETE_RELATIVE: (id) => `${BASE_URL}/api/relatives/delete/${id}`,
};

// Service Types Endpoints
export const SERVICE_TYPE_ENDPOINTS = {
  GET_SERVICE_TYPE_BY_ID: (id) =>
    `${BASE_URL}/api/servicetypes/get/${id}`,
  GET_ALL_SERVICE_TYPES: `${BASE_URL}/api/servicetypes/getall`,
  GET_SERVICE_TYPES_BY_MAJOR: (major) =>
    `${BASE_URL}/api/servicetypes/getbymajor/${major}`,
  CREATE_SINGLE_SERVICE: `${BASE_URL}/api/servicetypes/createsingle`,
  CREATE_PACKAGE_SERVICE: `${BASE_URL}/api/servicetypes/createpackage`,
  UPDATE_SERVICE_TYPE: (id) =>
    `${BASE_URL}/api/servicetypes/update/${id}`,
  ACTIVATE_SERVICE_TYPE: (id) =>
    `${BASE_URL}/api/servicetypes/activate/${id}`,
  SOFT_DELETE_SERVICE_TYPE: (id) =>
    `${BASE_URL}/api/servicetypes/softdelete/${id}`,
  DELETE_SERVICE_TYPE: (id) =>
    `${BASE_URL}/api/servicetypes/delete/${id}`,
};

// Nursing Specialists Endpoints
export const NURSING_SPECIALIST_ENDPOINTS = {
  GET_ALL_NURSING_SPECIALISTS: `${BASE_URL}/api/nursingspecialists/getall`,
  GET_NURSING_SPECIALIST_BY_ID: (id) =>
    `${BASE_URL}/api/nursingspecialists/get/${id}`,
  UPDATE_NURSING_SPECIALIST: (id) =>
    `${BASE_URL}/api/nursingspecialists/update/${id}`,
  DELETE_NURSING_SPECIALIST: (id) =>
    `${BASE_URL}/api/nursingspecialists/delete/${id}`,
  CHANGE_SPECIALIST_STATUS: (id) =>
    `${BASE_URL}/api/nursingspecialists/changestatus/${id}`,
};

// Roles Endpoints
export const ROLE_ENDPOINTS = {
  GET_ROLE_BY_ID: (id) => `${BASE_URL}/api/roles/get/${id}`,
  GET_ALL_ROLES: `${BASE_URL}/api/roles/getall`,
  CREATE_ROLE: `${BASE_URL}/api/roles/create`,
  UPDATE_ROLE: (id) => `${BASE_URL}/api/roles/update/${id}`,
  DELETE_ROLE: (id) => `${BASE_URL}/api/roles/delete/${id}`,
};

// Template Endpoints (Not Fully Implemented)
export const TEMPLATE_ENDPOINTS = {
  // Bookings
  BOOKINGS: `${BASE_URL}/api/bookings`,

  // Blogs
  BLOGS: `${BASE_URL}/api/blogs`,
  BLOG_CATEGORIES: `${BASE_URL}/api/blogcategories`,

  // Feedback
  FEEDBACKS: `${BASE_URL}/api/feedbacks`,

  // Holidays
  HOLIDAYS: `${BASE_URL}/api/holidays`,

  // Invoices
  INVOICES: `${BASE_URL}/api/invoices`,

  // Medical Notes
  MEDICAL_NOTES: `${BASE_URL}/api/medicalnotes`,

  // Notifications
  NOTIFICATIONS: `${BASE_URL}/api/notifications`,

  // Service Tasks
  SERVICE_TASKS: `${BASE_URL}/api/servicetasks`,

  // Transaction History
  TRANSACTION_HISTORIES: `${BASE_URL}/api/transactionhistories`,

  // Wallets
  WALLETS: `${BASE_URL}/api/wallets`,

  // Work Schedules
  WORK_SCHEDULES: `${BASE_URL}/api/workschedules`,

  // Customize Packages
  CUSTOMIZE_PACKAGES: `${BASE_URL}/api/customizepackages`,

  // Customize Tasks
  CUSTOMIZE_TASKS: `${BASE_URL}/api/customizetasks`,

  // Nursing Specialist Service Types
  NURSING_SPECIALIST_SERVICE_TYPES: `${BASE_URL}/api/nursingspecialist_servicetypes`,
};

// API Configuration Object
export const API_CONFIG = {
  BASE_URL,
  AUTH_ENDPOINTS,
  ZONE_ENDPOINTS,
  ZONE_DETAIL_ENDPOINTS,
  CARE_PROFILE_ENDPOINTS,
  SERVICE_TYPE_ENDPOINTS,
  NURSING_SPECIALIST_ENDPOINTS,
  RELATIVE_ENDPOINTS,
  ROLE_ENDPOINTS,
  TEMPLATE_ENDPOINTS,
};

// Default export
export default API_CONFIG;
