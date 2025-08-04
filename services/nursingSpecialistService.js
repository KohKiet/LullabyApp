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

  // Lấy NursingSpecialist theo accountID
  async getNursingSpecialistByAccountId(accountID) {
    try {
      const allResult = await this.getAllNursingSpecialists();
      if (allResult.success) {
        const nursingSpecialist = allResult.data.find(
          (ns) => ns.accountID === accountID
        );
        if (nursingSpecialist) {
          return { success: true, data: nursingSpecialist };
        } else {
          return {
            success: false,
            error: "Nursing specialist not found",
          };
        }
      } else {
        return { success: false, error: allResult.error };
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
        userData.status === "active"
          ? "Hoạt động"
          : userData.status === "unactive"
          ? "Không hoạt động"
          : "N/A",
    };
  }

  // Enrich user data for NursingSpecialist
  async enrichUserData(user) {
    try {
      console.log("🔍 Enriching user data for NursingSpecialist...");
      console.log("🔍 Original user data:", user);

      // Lấy thông tin account từ API accounts
      let accountData = null;
      if (user.accountID || user.id) {
        const accountID = user.accountID || user.id;
        console.log("🔍 Fetching account data for ID:", accountID);

        try {
          const response = await fetch(
            `http://localhost:5294/api/accounts/get/${accountID}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            accountData = await response.json();
            console.log("🔍 Account data fetched:", accountData);
          } else {
            console.log(
              "🔍 Failed to fetch account data:",
              response.status
            );
          }
        } catch (error) {
          console.log("🔍 Error fetching account data:", error);
        }
      }

      // Lấy thông tin nursing specialist từ API nursing specialists
      let nursingData = null;
      if (user.nursingID) {
        const result = await this.getNursingSpecialistById(
          user.nursingID
        );
        if (result.success) {
          nursingData = result.data;
          console.log(
            "🔍 Nursing data fetched by nursingID:",
            nursingData
          );
        }
      } else if (user.accountID || user.id) {
        const result = await this.getNursingSpecialistByAccountId(
          user.accountID || user.id
        );
        if (result.success) {
          nursingData = result.data;
          console.log(
            "🔍 Nursing data fetched by accountID:",
            nursingData
          );
        }
      }

      // Combine data từ cả hai API
      const enrichedData = {
        ...user,
        // Account data (ưu tiên từ API)
        fullName:
          accountData?.fullName || user.fullName || user.full_name,
        full_name:
          accountData?.fullName || user.fullName || user.full_name,
        email: accountData?.email || user.email,
        phoneNumber:
          accountData?.phoneNumber ||
          user.phoneNumber ||
          user.phone_number,
        phone_number:
          accountData?.phoneNumber ||
          user.phoneNumber ||
          user.phone_number,
        accountID:
          accountData?.accountID || user.accountID || user.id,
        roleID: accountData?.roleID || user.roleID || user.role_id,
        role_id: accountData?.roleID || user.roleID || user.role_id,
        status: accountData?.status || user.status,

        // Nursing specialist data (ưu tiên từ API)
        nursingID: nursingData?.nursingID || user.nursingID,
        zoneID: nursingData?.zoneID || user.zoneID,
        gender: nursingData?.gender || user.gender,
        dateOfBirth: nursingData?.dateOfBirth || user.dateOfBirth,
        address: nursingData?.address || user.address,
        experience: nursingData?.experience || user.experience,
        slogan: nursingData?.slogan || user.slogan,
        major: nursingData?.major || user.major,
      };

      // Enrich với zone information nếu có
      if (enrichedData.zoneID) {
        const enrichedWithZone =
          await this.enrichNursingSpecialistData(enrichedData);
        console.log(
          "🔍 Final enriched data with zone:",
          enrichedWithZone
        );
        return enrichedWithZone;
      }

      console.log("🔍 Final enriched data:", enrichedData);
      return enrichedData;
    } catch (error) {
      console.error("🔍 Error enriching user data:", error);
      return user;
    }
  }
}

// Export singleton instance
export default new NursingSpecialistService();
