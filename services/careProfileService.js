import { CARE_PROFILE_ENDPOINTS } from "./apiConfig";

// Network timeout (10 seconds)
const NETWORK_TIMEOUT = 10000;

class CareProfileService {
  // Map backend English errors to Vietnamese for display
  translateErrorMessage(message) {
    if (!message) return message;

    // Match: CareProfile name must match the first CareProfile name: '...'
    const matchName = message.match(
      /CareProfile name must match the first CareProfile name:?\s*'([^']+)'/i
    );
    if (matchName) {
      const firstName = matchName[1];
      return `Tên hồ sơ chăm sóc phải trùng với tên hồ sơ đầu tiên: '${firstName}'.`;
    }

    // Generic fallbacks
    if (/Create failed/i.test(message)) return "Tạo hồ sơ thất bại";
    if (/Update failed/i.test(message))
      return "Cập nhật hồ sơ thất bại";
    if (/Delete failed/i.test(message)) return "Xóa hồ sơ thất bại";

    return message;
  }
  // Helper function to create fetch with timeout
  async fetchWithTimeout(url, options, timeout = NETWORK_TIMEOUT) {
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
  }

  // Lấy tất cả Care Profiles
  async getAllCareProfiles() {
    try {
      const response = await this.fetchWithTimeout(
        CARE_PROFILE_ENDPOINTS.GET_ALL_CARE_PROFILES,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy Care Profile theo ID
  async getCareProfileById(careProfileID) {
    try {
      const response = await this.fetchWithTimeout(
        CARE_PROFILE_ENDPOINTS.GET_CARE_PROFILE_BY_ID(careProfileID),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy Care Profiles theo accountID
  async getCareProfilesByAccountId(accountID) {
    try {
      const allResult = await this.getAllCareProfiles();
      if (!allResult.success) {
        return allResult;
      }

      const careProfiles = allResult.data.filter(
        (profile) => profile.accountID === accountID
      );
      return { success: true, data: careProfiles };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Tạo Care Profile mới
  async createCareProfile(careProfileData) {
    try {
      const response = await this.fetchWithTimeout(
        CARE_PROFILE_ENDPOINTS.CREATE_CARE_PROFILE,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json-patch+json",
          },
          body: JSON.stringify(careProfileData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        let errorMessage = "Create failed";
        try {
          const errorData = await response.json();
          errorMessage = this.translateErrorMessage(
            errorData.message || errorData.error || errorMessage
          );
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        return {
          success: false,
          error: this.translateErrorMessage(errorMessage),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: this.translateErrorMessage(error.message),
      };
    }
  }

  // Cập nhật Care Profile
  async updateCareProfile(careProfileID, updateData) {
    try {
      const response = await this.fetchWithTimeout(
        CARE_PROFILE_ENDPOINTS.UPDATE_CARE_PROFILE(careProfileID),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json-patch+json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        let errorMessage = "Update failed";
        try {
          const errorData = await response.json();
          errorMessage = this.translateErrorMessage(
            errorData.message || errorData.error || errorMessage
          );
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        return {
          success: false,
          error: this.translateErrorMessage(errorMessage),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: this.translateErrorMessage(error.message),
      };
    }
  }

  // Xóa Care Profile
  async deleteCareProfile(careProfileID) {
    try {
      const response = await this.fetchWithTimeout(
        CARE_PROFILE_ENDPOINTS.DELETE_CARE_PROFILE(careProfileID),
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        let errorMessage = "Delete failed";
        try {
          const errorData = await response.json();
          errorMessage = this.translateErrorMessage(
            errorData.message || errorData.error || errorMessage
          );
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        return {
          success: false,
          error: this.translateErrorMessage(errorMessage),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: this.translateErrorMessage(error.message),
      };
    }
  }

  // Format date cho display
  formatDate(dateString) {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (error) {
      return dateString;
    }
  }

  // Format status display
  formatStatusDisplay(status) {
    if (status === "active") return "Hoạt động";
    if (status === "inactive") return "Không hoạt động";
    return status || "N/A";
  }
}

// Export singleton instance
export default new CareProfileService();
