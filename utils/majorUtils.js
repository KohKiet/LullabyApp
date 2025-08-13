/**
 * Utility functions for handling major/specialty values
 * Ensures consistent handling of "Nurse", "nurse", "Specialist", "specialist"
 */

// Normalize major value to lowercase for consistent comparison
export const normalizeMajor = (major) => {
  if (!major) return null;
  return major.toString().toLowerCase();
};

// Check if a major is a nurse type
export const isNurse = (major) => {
  const normalized = normalizeMajor(major);
  return normalized === "nurse";
};

// Check if a major is a specialist type
export const isSpecialist = (major) => {
  const normalized = normalizeMajor(major);
  return normalized === "specialist";
};

// Get display text for major
export const getMajorDisplayText = (major) => {
  const normalized = normalizeMajor(major);
  switch (normalized) {
    case "nurse":
      return "Điều dưỡng viên";
    case "specialist":
      return "Tư vấn viên";
    default:
      return major || "Không xác định";
  }
};

// Get Vietnamese display text for major
export const getMajorVietnameseText = (major) => {
  const normalized = normalizeMajor(major);
  switch (normalized) {
    case "nurse":
      return "điều dưỡng viên";
    case "specialist":
      return "tư vấn viên";
    default:
      return "nhân viên";
  }
};

// Compare two major values (case-insensitive)
export const compareMajor = (major1, major2) => {
  return normalizeMajor(major1) === normalizeMajor(major2);
};

// Get major from service info with fallback
export const getRequiredMajor = (serviceInfo, fallback = "nurse") => {
  return serviceInfo?.major || fallback;
};
