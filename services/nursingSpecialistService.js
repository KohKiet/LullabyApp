import {
  NURSING_SPECIALIST_ENDPOINTS,
  ZONE_ENDPOINTS,
} from "./apiConfig";

class NursingSpecialistService {
  // Lấy tất cả NursingSpecialists
  async getAllNursingSpecialists() {
    try {
      const response = await fetch(
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
        return { success: true, data: data };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy NursingSpecialist theo ID
  async getNursingSpecialistById(id) {
    try {
      const response = await fetch(
        NURSING_SPECIALIST_ENDPOINTS.GET_NURSING_SPECIALIST_BY_ID(id),
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

  // Cập nhật NursingSpecialist
  async updateNursingSpecialist(id, updateData) {
    try {
      const response = await fetch(
        NURSING_SPECIALIST_ENDPOINTS.UPDATE_NURSING_SPECIALIST(id),
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
            errorData.message ||
            errorData.error ||
            `HTTP ${response.status}`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy tất cả zones
  async getAllZones() {
    try {
      const response = await fetch(ZONE_ENDPOINTS.GET_ALL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

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

  // Lấy zone theo ID
  async getZoneById(id) {
    try {
      const response = await fetch(ZONE_ENDPOINTS.GET_BY_ID(id), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

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

  // Enrich NursingSpecialist data với zone information
  async enrichNursingSpecialistData(nursingSpecialist) {
    try {
      if (nursingSpecialist.zoneID) {
        const zoneResult = await this.getZoneById(
          nursingSpecialist.zoneID
        );
        if (zoneResult.success) {
          return {
            ...nursingSpecialist,
            zoneName: zoneResult.data.zoneName,
            city: zoneResult.data.city,
          };
        }
      }
      return nursingSpecialist;
    } catch (error) {
      return nursingSpecialist;
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

  // Format zone display
  formatZoneDisplay(zoneName, city) {
    if (!zoneName && !city) return "N/A";
    if (zoneName && city) return `${zoneName} - ${city}`;
    return zoneName || city || "N/A";
  }

  // Get display values for profile fields
  getDisplayValues(userData) {
    if (!userData) return {};

    return {
      fullName: userData.fullName || userData.full_name || "N/A",
      gender:
        userData.gender === "Nam"
          ? "Nam"
          : userData.gender === "Nữ"
          ? "Nữ"
          : "N/A",
      dateOfBirth: this.formatDate(userData.dateOfBirth),
      address: userData.address || "N/A",
      zone: this.formatZoneDisplay(userData.zoneName, userData.city),
      major: userData.major || "N/A",
      experience: userData.experience || "N/A",
      slogan: userData.slogan || "N/A",
      status:
        userData.status === "Active"
          ? "Hoạt động"
          : "Không hoạt động",
    };
  }

  // Enrich user data for NursingSpecialist
  async enrichUserData(user) {
    try {
      // Nếu user đã có nursingID, lấy thông tin chi tiết
      if (user.nursingID) {
        const result = await this.getNursingSpecialistById(
          user.nursingID
        );
        if (result.success) {
          const enrichedData = await this.enrichNursingSpecialistData(
            result.data
          );
          return {
            ...user,
            ...enrichedData,
            // Map lại các field để phù hợp với app
            fullName: enrichedData.fullName || user.fullName,
            full_name: enrichedData.fullName || user.fullName,
            nursingID: enrichedData.nursingID,
            accountID: enrichedData.accountID,
            zoneID: enrichedData.zoneID,
            gender: enrichedData.gender,
            dateOfBirth: enrichedData.dateOfBirth,
            address: enrichedData.address,
            experience: enrichedData.experience,
            slogan: enrichedData.slogan,
            major: enrichedData.major,
            status: enrichedData.status,
          };
        }
      }

      return user;
    } catch (error) {
      return user;
    }
  }
}

// Export singleton instance
export default new NursingSpecialistService();
