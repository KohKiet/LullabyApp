import { Platform } from "react-native";

// API Configuration for Lullaby App

// Environment detection
const isDevelopment = __DEV__;
const isAndroid = Platform.OS === "android";
const isIOS = Platform.OS === "ios";

// Base URL configuration
const BASE_URL = "https://cool-dhawan.103-28-36-58.plesk.page";

console.log("API Config: Using production URL:", BASE_URL);
console.log(
  "API Config: Service Types URL:",
  `${BASE_URL}/api/servicetypes/getall`
);

// Authentication & Account Management Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${BASE_URL}/api/accounts/login`,
  REGISTER: `${BASE_URL}/api/accounts/register`,
  GET_USER_PROFILE: (id) => `${BASE_URL}/api/accounts/get/${id}`,
  UPDATE_USER: (id) => `${BASE_URL}/api/accounts/update/${id}`,
  HEALTH_CHECK: `${BASE_URL}/api/health`,
};

// Zone Endpoints
export const ZONE_ENDPOINTS = {
  GET_ALL_ZONES: `${BASE_URL}/api/zones/getall`,
  GET_ZONE_BY_ID: (id) => `${BASE_URL}/api/zones/getbyid/${id}`,
  UPDATE_ZONE: (id) => `${BASE_URL}/api/zones/update/${id}`,
  DELETE_ZONE: (id) => `${BASE_URL}/api/zones/delete/${id}`,
  CREATE_ZONE: `${BASE_URL}/api/zones/create`,
};

// Nursing Specialists Endpoints
export const NURSING_SPECIALIST_ENDPOINTS = {
  GET_ALL_NURSING_SPECIALISTS: `${BASE_URL}/api/nursingspecialists/getall`,
  GET_NURSING_SPECIALIST_BY_ID: (id) =>
    `${BASE_URL}/api/nursingspecialists/get/${id}`,
  CREATE_NURSING_SPECIALIST: `${BASE_URL}/api/nursingspecialists/create`,
  UPDATE_NURSING_SPECIALIST: (id) =>
    `${BASE_URL}/api/nursingspecialists/update/${id}`,
  DELETE_NURSING_SPECIALIST: (id) =>
    `${BASE_URL}/api/nursingspecialists/delete/${id}`,
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

// Role Endpoints
export const ROLE_ENDPOINTS = {
  GET_ALL_ROLES: `${BASE_URL}/api/roles/getall`,
  GET_ROLE_BY_ID: (id) => `${BASE_URL}/api/roles/get/${id}`,
  CREATE_ROLE: `${BASE_URL}/api/roles/create`,
  UPDATE_ROLE: (id) => `${BASE_URL}/api/roles/update/${id}`,
  DELETE_ROLE: (id) => `${BASE_URL}/api/roles/delete/${id}`,
};

// Zone Detail Endpoints
export const ZONE_DETAIL_ENDPOINTS = {
  GET_ALL_ZONE_DETAILS: `${BASE_URL}/api/zonedetails/getall`,
  GET_ZONE_DETAIL_BY_ID: (id) =>
    `${BASE_URL}/api/zonedetails/get/${id}`,
  CREATE_ZONE_DETAIL: `${BASE_URL}/api/zonedetails/create`,
  UPDATE_ZONE_DETAIL: (id) =>
    `${BASE_URL}/api/zonedetails/update/${id}`,
  DELETE_ZONE_DETAIL: (id) =>
    `${BASE_URL}/api/zonedetails/delete/${id}`,
};

// Service Type Endpoints
export const SERVICE_TYPE_ENDPOINTS = {
  GET_ALL_SERVICE_TYPES: `${BASE_URL}/api/servicetypes/getall`,
  GET_SERVICE_TYPE_BY_ID: (id) =>
    `${BASE_URL}/api/servicetypes/get/${id}`,
  CREATE_SERVICE_TYPE: `${BASE_URL}/api/servicetypes/create`,
  UPDATE_SERVICE_TYPE: (id) =>
    `${BASE_URL}/api/servicetypes/update/${id}`,
  DELETE_SERVICE_TYPE: (id) =>
    `${BASE_URL}/api/servicetypes/delete/${id}`,
};

// Template Endpoints
export const TEMPLATE_ENDPOINTS = {
  BOOKINGS: `${BASE_URL}/api/Booking`,
  BLOGS: `${BASE_URL}/api/blogs`,
  BLOG_CATEGORIES: `${BASE_URL}/api/blogcategories`,
  FEEDBACKS: `${BASE_URL}/api/feedbacks`,
  HOLIDAYS: `${BASE_URL}/api/holidays`,
  INVOICES: `${BASE_URL}/api/invoices`,
  MEDICAL_NOTES: `${BASE_URL}/api/medicalnotes`,
  NOTIFICATIONS: `${BASE_URL}/api/notifications`,
  SERVICE_TASKS: `${BASE_URL}/api/servicetasks`,
  TRANSACTION_HISTORIES: `${BASE_URL}/api/transactionhistories`,
  WALLETS: `${BASE_URL}/api/wallets`,
  WORK_SCHEDULES: `${BASE_URL}/api/workschedules`,
  CUSTOMIZE_PACKAGES: `${BASE_URL}/api/CustomizePackage`,
  CUSTOMIZE_TASKS: `${BASE_URL}/api/CustomizeTask`,
  NURSING_SPECIALIST_SERVICE_TYPES: `${BASE_URL}/api/nursingspecialist_servicetypes`,
};

// Wallet Endpoints
export const WALLET_ENDPOINTS = {
  BASE_URL: BASE_URL,
  GET_ALL_WALLETS: `${BASE_URL}/api/Wallet/GetAll`,
  GET_WALLET_BY_ID: (id) => `${BASE_URL}/api/Wallet/${id}`,
  CREATE_WALLET: `${BASE_URL}/api/Wallet/create`,
  UPDATE_WALLET: (id) => `${BASE_URL}/api/Wallet/update/${id}`,
  DELETE_WALLET: (id) => `${BASE_URL}/api/Wallet/delete/${id}`,
};

// Medical Note Endpoints
export const MEDICAL_NOTE_ENDPOINTS = {
  GET_ALL: `${BASE_URL}/api/MedicalNote/GetAll`,
  GET_BY_ID: (id) => `${BASE_URL}/api/MedicalNote/${id}`,
  GET_BY_CUSTOMIZE_TASK_ID: (customizeTaskID) =>
    `${BASE_URL}/api/MedicalNote/GetByCustomizeTaskId/${customizeTaskID}`,
  GET_BY_BOOKING_ID: (bookingID) =>
    `${BASE_URL}/api/MedicalNote/GetByBookingId/${bookingID}`,
  CREATE: `${BASE_URL}/api/MedicalNote`,
  UPDATE: (id) => `${BASE_URL}/api/MedicalNote/${id}`,
  DELETE: (id) => `${BASE_URL}/api/MedicalNote/${id}`,
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
  WALLET_ENDPOINTS,
  MEDICAL_NOTE_ENDPOINTS,
};
