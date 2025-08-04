import { RELATIVE_ENDPOINTS } from "./apiConfig";

// Helper function for API calls with timeout
const fetchWithTimeout = async (
  url,
  options = {},
  timeout = 10000
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

class RelativeService {
  // Get all relatives
  static async getAllRelatives() {
    try {
      const url = RELATIVE_ENDPOINTS.GET_ALL_RELATIVES;

      const response = await fetchWithTimeout(url, {}, 30000); // 30 seconds timeout

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get relative by ID
  static async getRelativeById(relativeID) {
    try {
      const url = RELATIVE_ENDPOINTS.GET_RELATIVE_BY_ID(relativeID);

      const response = await fetchWithTimeout(url, {}, 30000); // 30 seconds timeout

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get relatives by care profile ID
  static async getRelativesByCareProfileId(careProfileID) {
    try {
      // Try to get all relatives first, then filter
      const url = RELATIVE_ENDPOINTS.GET_ALL_RELATIVES;

      const response = await fetchWithTimeout(url, {}, 30000); // 30 seconds timeout

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const allRelatives = await response.json();

      // Filter relatives by careProfileID
      const filteredRelatives = allRelatives.filter(
        (relative) => relative.careProfileID === careProfileID
      );

      return { success: true, data: filteredRelatives };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create new relative
  static async createRelative(relativeData) {
    try {
      const response = await fetchWithTimeout(
        RELATIVE_ENDPOINTS.CREATE_RELATIVE,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(relativeData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update relative
  static async updateRelative(relativeID, updateData) {
    try {
      const response = await fetchWithTimeout(
        RELATIVE_ENDPOINTS.UPDATE_RELATIVE(relativeID),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete relative
  static async deleteRelative(relativeID) {
    try {
      const response = await fetchWithTimeout(
        RELATIVE_ENDPOINTS.DELETE_RELATIVE(relativeID),
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Format date for display
  static formatDate(dateString) {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch (error) {
      return dateString;
    }
  }

  // Format gender for display
  static formatGenderDisplay(gender) {
    return gender === "Nam" ? "Nam" : gender === "Nữ" ? "Nữ" : "N/A";
  }

  // Format status for display
  static formatStatusDisplay(status) {
    return status === "Active" ? "Hoạt động" : "Không hoạt động";
  }
}

export default RelativeService;
