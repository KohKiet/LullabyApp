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

  // Lấy tất cả zones
  async getAllZones() {
    try {
      const response = await fetch(ZONE_ENDPOINTS.GET_ALL_ZONES, {
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
      const response = await fetch(
        ZONE_ENDPOINTS.GET_ZONE_BY_ID(id),
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

  // Lấy NursingSpecialist theo major (specialist hoặc nurse)
  async getNursingSpecialistsByMajor(major) {
    try {
      const allResult = await this.getAllNursingSpecialists();
      if (allResult.success) {
        const filteredSpecialists = allResult.data.filter(
          (specialist) => specialist.major === major
        );
        return { success: true, data: filteredSpecialists };
      } else {
        return { success: false, error: allResult.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy tất cả specialists (major = "specialist")
  async getAllSpecialists() {
    return this.getNursingSpecialistsByMajor("specialist");
  }

  // Lấy tất cả nurses (major = "nurse")
  async getAllNurses() {
    return this.getNursingSpecialistsByMajor("nurse");
  }

  // Lấy thông tin chi tiết của NursingSpecialist với account data
  async getDetailedNursingSpecialist(nursingID) {
    try {
      const nursingResult = await this.getNursingSpecialistById(
        nursingID
      );
      if (!nursingResult.success) {
        return nursingResult;
      }

      const nursingData = nursingResult.data;

      if (nursingData.accountID) {
        try {
          const accountResponse = await fetch(
            `http://localhost:5294/api/accounts/get/${nursingData.accountID}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (accountResponse.ok) {
            const accountData = await accountResponse.json();

            const detailedData = {
              ...nursingData,
              fullName: accountData.fullName || nursingData.fullName,
              email: accountData.email,
              phoneNumber: accountData.phoneNumber,
              accountID: accountData.accountID,
              roleID: accountData.roleID,
              status: accountData.status,
              createAt: accountData.createAt,
              nursingID: nursingData.nursingID,
              zoneID: nursingData.zoneID,
              gender: nursingData.gender,
              dateOfBirth: nursingData.dateOfBirth,
              address: nursingData.address,
              experience: nursingData.experience,
              slogan: nursingData.slogan,
              major: nursingData.major,
            };

            return { success: true, data: detailedData };
          } else {
            return { success: true, data: nursingData };
          }
        } catch (accountError) {
          return { success: true, data: nursingData };
        }
      } else {
        return { success: true, data: nursingData };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy danh sách chi tiết tất cả nursing specialists với account data
  async getAllDetailedNursingSpecialists() {
    try {
      const allResult = await this.getAllNursingSpecialists();
      if (!allResult.success) {
        return allResult;
      }

      const accountIds = allResult.data
        .map((specialist) => specialist.accountID)
        .filter((id) => id != null);

      const accountDataMap = new Map();
      for (const accountId of accountIds) {
        try {
          const accountResponse = await fetch(
            `http://localhost:5294/api/accounts/get/${accountId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            accountDataMap.set(accountId, accountData);
          }
        } catch (error) {
          // Ignore individual account fetch errors
        }
      }

      const detailedSpecialists = allResult.data.map((specialist) => {
        const accountData = accountDataMap.get(specialist.accountID);

        if (accountData) {
          const detailedData = {
            ...specialist,
            fullName: accountData.fullName || specialist.fullName,
            email: accountData.email,
            phoneNumber: accountData.phoneNumber,
            accountID: accountData.accountID,
            roleID: accountData.roleID,
            status: accountData.status,
            createAt: accountData.createAt,
            nursingID: specialist.nursingID,
            zoneID: specialist.zoneID,
            gender: specialist.gender,
            dateOfBirth: specialist.dateOfBirth,
            address: specialist.address,
            experience: specialist.experience,
            slogan: specialist.slogan,
            major: specialist.major,
          };

          return detailedData;
        } else {
          return specialist;
        }
      });

      return { success: true, data: detailedSpecialists };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy danh sách chi tiết specialists với account data
  async getAllDetailedSpecialists() {
    try {
      const allDetailedResult =
        await this.getAllDetailedNursingSpecialists();
      if (!allDetailedResult.success) {
        return allDetailedResult;
      }

      const specialistsData = allDetailedResult.data.filter(
        (specialist) => specialist.major === "specialist"
      );

      return { success: true, data: specialistsData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy danh sách chi tiết nurses với account data
  async getAllDetailedNurses() {
    try {
      const allDetailedResult =
        await this.getAllDetailedNursingSpecialists();
      if (!allDetailedResult.success) {
        return allDetailedResult;
      }

      const nursesData = allDetailedResult.data.filter(
        (nurse) => nurse.major === "nurse"
      );

      return { success: true, data: nursesData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new NursingSpecialistService();
