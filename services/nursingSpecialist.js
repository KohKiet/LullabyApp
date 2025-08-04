import { NURSING_SPECIALIST_ENDPOINTS } from "./apiConfig";

// Network timeout (10 seconds)
const NETWORK_TIMEOUT = 10000;

class NursingSpecialistService {
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

  // Lấy tất cả Nursing Specialists
  async getAllNursingSpecialists() {
    try {
      console.log("🔍 Getting all nursing specialists...");
      const response = await this.fetchWithTimeout(
        NURSING_SPECIALIST_ENDPOINTS.GET_ALL_NURSING_SPECIALISTS,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 All nursing specialists:", data);
        return { success: true, data: data };
      } else {
        console.log(
          "🔍 Failed to get nursing specialists:",
          response.status
        );
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error("🔍 Error getting nursing specialists:", error);
      return { success: false, error: error.message };
    }
  }

  // Lấy Nursing Specialist theo ID
  async getNursingSpecialistById(nursingID) {
    try {
      console.log("🔍 Getting nursing specialist by ID:", nursingID);
      const response = await this.fetchWithTimeout(
        NURSING_SPECIALIST_ENDPOINTS.GET_NURSING_SPECIALIST_BY_ID(
          nursingID
        ),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Nursing specialist data:", data);
        return { success: true, data: data };
      } else {
        console.log(
          "🔍 Failed to get nursing specialist:",
          response.status
        );
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error("🔍 Error getting nursing specialist:", error);
      return { success: false, error: error.message };
    }
  }

  // Lấy Nursing Specialist theo accountID
  async getNursingSpecialistByAccountId(accountID) {
    try {
      console.log(
        "🔍 Getting nursing specialist by accountID:",
        accountID
      );

      // Trước tiên lấy tất cả để tìm nursingID
      const allResult = await this.getAllNursingSpecialists();
      if (!allResult.success) {
        return allResult;
      }

      const nursingSpecialist = allResult.data.find(
        (ns) => ns.accountID === accountID
      );

      if (nursingSpecialist) {
        console.log(
          "🔍 Found nursing specialist:",
          nursingSpecialist
        );
        return { success: true, data: nursingSpecialist };
      } else {
        console.log(
          "🔍 No nursing specialist found for accountID:",
          accountID
        );
        return {
          success: false,
          error: "Nursing specialist not found",
        };
      }
    } catch (error) {
      console.error(
        "🔍 Error getting nursing specialist by accountID:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  // Cập nhật thông tin Nursing Specialist
  async updateNursingSpecialist(nursingID, updateData) {
    try {
      console.log(
        "🔍 Updating nursing specialist with ID:",
        nursingID
      );
      console.log("🔍 Update data:", updateData);

      const response = await this.fetchWithTimeout(
        NURSING_SPECIALIST_ENDPOINTS.UPDATE_NURSING_SPECIALIST(
          nursingID
        ),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json-patch+json",
            accept: "*/*",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Update successful:", data);
        return { success: true, data: data };
      } else {
        let errorMessage = "Failed to update nursing specialist";
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
      console.error("🔍 Error updating nursing specialist:", error);
      return { success: false, error: error.message };
    }
  }

  // Enrich user data với thông tin Nursing Specialist
  async enrichUserData(userData) {
    try {
      console.log(
        "🔍 ===== ENRICHING USER DATA WITH NURSING SPECIALIST ====="
      );
      console.log("🔍 Input userData:", userData);

      // Kiểm tra xem có phải Nursing Specialist không
      const isNursingSpecialist =
        userData.roleID === 2 || userData.role_id === 2;
      if (!isNursingSpecialist) {
        console.log(
          "🔍 Not a nursing specialist, returning original data"
        );
        return userData;
      }

      // Nếu đã có nursingSpecialist object, merge dữ liệu từ đó
      if (userData.nursingSpecialist) {
        console.log(
          "🔍 Found nursingSpecialist object, merging data..."
        );
        const nursingData = userData.nursingSpecialist;

        const enrichedUserData = {
          ...userData,
          nursingID: nursingData.nursingID || userData.nursingID,
          zoneID: nursingData.zoneID || userData.zoneID,
          gender: nursingData.gender || userData.gender,
          dateOfBirth:
            nursingData.dateOfBirth || userData.dateOfBirth,
          fullName:
            userData.fullName ||
            userData.full_name ||
            nursingData.fullName,
          address: nursingData.address || userData.address,
          experience: nursingData.experience || userData.experience,
          slogan: nursingData.slogan || userData.slogan,
          major: nursingData.major || userData.major,
          status: nursingData.status || userData.status,
        };

        console.log(
          "🔍 Enriched user data from nursingSpecialist object:",
          enrichedUserData
        );
        return enrichedUserData;
      }

      // Nếu đã có đầy đủ thông tin thì không cần fetch
      if (userData.nursingID && userData.gender && userData.address) {
        console.log("🔍 Nursing specialist data already complete");
        return userData;
      }

      console.log("🔍 Data incomplete, fetching from API...");

      // Lấy thông tin chi tiết
      let nursingData;
      if (userData.nursingID) {
        // Nếu có nursingID, sử dụng endpoint get/{id}
        const result = await this.getNursingSpecialistById(
          userData.nursingID
        );
        if (result.success) {
          nursingData = result.data;
        }
      } else {
        // Nếu không có nursingID, tìm theo accountID
        const result = await this.getNursingSpecialistByAccountId(
          userData.accountID
        );
        if (result.success) {
          nursingData = result.data;
        }
      }

      if (nursingData) {
        console.log("🔍 Nursing data from API:", nursingData);

        // Merge thông tin mới vào user data
        const enrichedUserData = {
          ...userData,
          nursingID: nursingData.nursingID,
          zoneID: nursingData.zoneID,
          gender: nursingData.gender,
          dateOfBirth: nursingData.dateOfBirth,
          fullName: userData.fullName || nursingData.fullName, // Ưu tiên fullName từ login
          address: nursingData.address,
          experience: nursingData.experience,
          slogan: nursingData.slogan,
          major: nursingData.major,
          status: nursingData.status,
        };

        console.log("🔍 Enriched user data:", enrichedUserData);
        return enrichedUserData;
      } else {
        console.log(
          "🔍 Failed to get nursing data, returning original data"
        );
        return userData;
      }
    } catch (error) {
      console.error("🔍 Error enriching user data:", error);
      return userData;
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

  // Format zone cho display
  formatZoneDisplay(zoneID) {
    if (!zoneID) return "N/A";
    return `Khu vực ${zoneID}`;
  }

  // Format status cho display
  formatStatusDisplay(status) {
    if (status === "active") return "Hoạt động";
    if (status === "unactive") return "Không hoạt động";
    return status || "N/A";
  }

  // Lấy display values cho profile
  getDisplayValues(userData) {
    // Kiểm tra xem có nursingSpecialist object không
    const nursingData = userData.nursingSpecialist || {};

    return {
      fullName:
        userData.fullName ||
        userData.full_name ||
        nursingData.fullName ||
        "N/A",
      gender: userData.gender || nursingData.gender || "N/A",
      dateOfBirth: this.formatDate(
        userData.dateOfBirth || nursingData.dateOfBirth
      ),
      address: userData.address || nursingData.address || "N/A",
      zone: this.formatZoneDisplay(
        userData.zoneID || nursingData.zoneID
      ),
      major: userData.major || nursingData.major || "N/A",
      experience:
        userData.experience || nursingData.experience || "N/A",
      slogan: userData.slogan || nursingData.slogan || "N/A",
      status: this.formatStatusDisplay(
        userData.status || nursingData.status
      ),
    };
  }
}

// Export singleton instance
export default new NursingSpecialistService();
