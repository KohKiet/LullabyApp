import { CARE_PROFILE_ENDPOINTS } from "./apiConfig";

// Network timeout (10 seconds)
const NETWORK_TIMEOUT = 10000;

class CareProfileService {
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
      console.log("🔍 Getting all care profiles...");
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
        console.log("🔍 All care profiles:", data);
        return { success: true, data: data };
      } else {
        console.log(
          "🔍 Failed to get care profiles:",
          response.status
        );
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error("🔍 Error getting care profiles:", error);
      return { success: false, error: error.message };
    }
  }

  // Lấy Care Profile theo ID
  async getCareProfileById(careProfileID) {
    try {
      console.log("🔍 Getting care profile by ID:", careProfileID);
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
        console.log("🔍 Care profile data:", data);
        return { success: true, data: data };
      } else {
        console.log(
          "🔍 Failed to get care profile:",
          response.status
        );
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error("🔍 Error getting care profile:", error);
      return { success: false, error: error.message };
    }
  }

  // Lấy Care Profiles theo accountID
  async getCareProfilesByAccountId(accountID) {
    try {
      console.log(
        "🔍 Getting care profiles by accountID:",
        accountID
      );

      // Lấy tất cả care profiles và filter theo accountID
      const allResult = await this.getAllCareProfiles();
      if (!allResult.success) {
        return allResult;
      }

      const careProfiles = allResult.data.filter(
        (profile) => profile.accountID === accountID
      );

      console.log("🔍 Care profiles for accountID:", careProfiles);
      return { success: true, data: careProfiles };
    } catch (error) {
      console.error(
        "🔍 Error getting care profiles by accountID:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  // Tạo Care Profile mới
  async createCareProfile(careProfileData) {
    try {
      console.log("🔍 Creating care profile...");
      console.log("🔍 Care profile data:", careProfileData);

      const response = await this.fetchWithTimeout(
        CARE_PROFILE_ENDPOINTS.CREATE_CARE_PROFILE,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(careProfileData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Care profile created successfully:", data);
        return { success: true, data: data };
      } else {
        let errorMessage = "Failed to create care profile";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message ||
            errorData.error ||
            `HTTP ${response.status}`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.log("🔍 Create failed:", errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("🔍 Error creating care profile:", error);
      return { success: false, error: error.message };
    }
  }

  // Cập nhật Care Profile
  async updateCareProfile(careProfileID, updateData) {
    try {
      console.log("🔍 Updating care profile with ID:", careProfileID);
      console.log("🔍 Update data:", updateData);

      const response = await this.fetchWithTimeout(
        CARE_PROFILE_ENDPOINTS.UPDATE_CARE_PROFILE(careProfileID),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Care profile updated successfully:", data);
        return { success: true, data: data };
      } else {
        let errorMessage = "Failed to update care profile";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message ||
            errorData.error ||
            `HTTP ${response.status}`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.log("🔍 Update failed:", errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("🔍 Error updating care profile:", error);
      return { success: false, error: error.message };
    }
  }

  // Xóa Care Profile
  async deleteCareProfile(careProfileID) {
    try {
      console.log("🔍 Deleting care profile with ID:", careProfileID);

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
        console.log("🔍 Care profile deleted successfully");
        return { success: true };
      } else {
        let errorMessage = "Failed to delete care profile";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message ||
            errorData.error ||
            `HTTP ${response.status}`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.log("🔍 Delete failed:", errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("🔍 Error deleting care profile:", error);
      return { success: false, error: error.message };
    }
  }

  // Format date cho display
  formatDate(dateString) {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (error) {
      return "N/A";
    }
  }

  // Format status cho display
  formatStatusDisplay(status) {
    if (status === "Active") return "Hoạt động";
    if (status === "Inactive") return "Không hoạt động";
    return status || "N/A";
  }
}

// Export singleton instance
export default new CareProfileService();
