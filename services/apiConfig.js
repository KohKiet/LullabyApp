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
