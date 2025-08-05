import { RELATIVE_ENDPOINTS } from "./apiConfig";

// Network timeout (10 seconds)
const NETWORK_TIMEOUT = 10000;

class RelativeService {
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

  // Lấy tất cả relatives
  async getAllRelatives() {
    try {
      const response = await this.fetchWithTimeout(
        RELATIVE_ENDPOINTS.GET_ALL_RELATIVES,
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

  // Lấy relative theo ID
  async getRelativeById(relativeID) {
    try {
      const response = await this.fetchWithTimeout(
        RELATIVE_ENDPOINTS.GET_RELATIVE_BY_ID(relativeID),
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

  // Lấy relatives theo care profile ID
  async getRelativesByCareProfileId(careProfileID) {
    try {
      const allResult = await this.getAllRelatives();
      if (!allResult.success) {
        return allResult;
      }

      const filteredRelatives = allResult.data.filter(
        (relative) => relative.careProfileID === careProfileID
      );

      return { success: true, data: filteredRelatives };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Tạo relative mới
  async createRelative(relativeData) {
    try {
      const response = await this.fetchWithTimeout(
        RELATIVE_ENDPOINTS.CREATE_RELATIVE,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(relativeData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        let errorMessage = "Create failed";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cập nhật relative
  async updateRelative(relativeID, updateData) {
    try {
      const response = await this.fetchWithTimeout(
        RELATIVE_ENDPOINTS.UPDATE_RELATIVE(relativeID),
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
          errorMessage =
            errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Xóa relative
  async deleteRelative(relativeID) {
    try {
      const response = await this.fetchWithTimeout(
        RELATIVE_ENDPOINTS.DELETE_RELATIVE(relativeID),
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
          errorMessage =
            errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: error.message };
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

  // Format gender display
  formatGenderDisplay(gender) {
    if (gender === "nam" || gender === "male") return "Nam";
    if (gender === "nữ" || gender === "female") return "Nữ";
    return gender || "N/A";
  }

  // Format status display
  formatStatusDisplay(status) {
    if (status === "active") return "Hoạt động";
    if (status === "inactive") return "Không hoạt động";
    return status || "N/A";
  }
}

// Export singleton instance
export default new RelativeService();
