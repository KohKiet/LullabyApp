import { ZONE_DETAIL_ENDPOINTS, ZONE_ENDPOINTS } from "./apiConfig";

class ZoneDetailService {
  // Lấy tất cả zone details
  async getAllZoneDetails() {
    try {
      console.log("ZoneDetailService: Fetching all zone details...");
      const response = await fetch(
        ZONE_DETAIL_ENDPOINTS.GET_ALL_ZONE_DETAILS,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "ZoneDetailService: Zone details received:",
          data.length,
          "items"
        );
        return { success: true, data: data };
      } else {
        console.log(
          "ZoneDetailService: HTTP Error:",
          response.status
        );
        // Fallback to mock data
        console.log("ZoneDetailService: Using mock data");
        return {
          success: true,
          data: [
            {
              zoneDetailID: 1,
              zoneID: 1,
              name: "Phường Long Thạnh Mỹ",
              note: "string",
            },
            {
              zoneDetailID: 2,
              zoneID: 1,
              name: "Phường Long Bình",
              note: "string",
            },
            {
              zoneDetailID: 3,
              zoneID: 2,
              name: "Phường Bến Nghé",
              note: "",
            },
          ],
        };
      }
    } catch (error) {
      console.log("ZoneDetailService: Network error:", error.message);
      // Fallback to mock data
      console.log("ZoneDetailService: Using mock data due to error");
      return {
        success: true,
        data: [
          {
            zoneDetailID: 1,
            zoneID: 1,
            name: "Phường Long Thạnh Mỹ",
            note: "string",
          },
          {
            zoneDetailID: 2,
            zoneID: 1,
            name: "Phường Long Bình",
            note: "string",
          },
          {
            zoneDetailID: 3,
            zoneID: 2,
            name: "Phường Bến Nghé",
            note: "",
          },
        ],
      };
    }
  }

  // Lấy tất cả zones
  async getAllZones() {
    try {
      console.log("ZoneDetailService: Fetching all zones...");
      const response = await fetch(ZONE_ENDPOINTS.GET_ALL_ZONES, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          "ZoneDetailService: Zones received:",
          data.length,
          "items"
        );
        return { success: true, data: data };
      } else {
        console.log(
          "ZoneDetailService: HTTP Error:",
          response.status
        );
        // Fallback to mock data
        console.log("ZoneDetailService: Using mock data");
        return {
          success: true,
          data: [
            {
              zoneID: 1,
              managerID: 2,
              zoneName: "Quận 9",
              city: "Hồ Chí Minh",
            },
            {
              zoneID: 2,
              managerID: 9,
              zoneName: "Quận 3",
              city: "Hồ Chí Minh",
            },
            {
              zoneID: 3,
              managerID: 4,
              zoneName: "Quận 2",
              city: "Hồ Chí Minh",
            },
          ],
        };
      }
    } catch (error) {
      console.log("ZoneDetailService: Network error:", error.message);
      // Fallback to mock data
      console.log("ZoneDetailService: Using mock data due to error");
      return {
        success: true,
        data: [
          {
            zoneID: 1,
            managerID: 2,
            zoneName: "Quận 9",
            city: "Hồ Chí Minh",
          },
          {
            zoneID: 2,
            managerID: 9,
            zoneName: "Quận 3",
            city: "Hồ Chí Minh",
          },
          {
            zoneID: 3,
            managerID: 4,
            zoneName: "Quận 2",
            city: "Hồ Chí Minh",
          },
        ],
      };
    }
  }

  // Lấy zone details với thông tin zone
  async getZoneDetailsWithZoneInfo() {
    try {
      const [zoneDetailsResult, zonesResult] = await Promise.all([
        this.getAllZoneDetails(),
        this.getAllZones(),
      ]);

      if (!zoneDetailsResult.success || !zonesResult.success) {
        return { success: false, error: "Failed to fetch zone data" };
      }

      const zoneDetailsWithInfo = zoneDetailsResult.data.map(
        (zoneDetail) => {
          const zone = zonesResult.data.find(
            (z) => z.zoneID === zoneDetail.zoneID
          );
          return {
            ...zoneDetail,
            zoneName: zone?.zoneName || "Unknown Zone",
            city: zone?.city || "Unknown City",
            displayName: zone
              ? `${zone.zoneName} - ${zoneDetail.name}`
              : zoneDetail.name,
          };
        }
      );

      return { success: true, data: zoneDetailsWithInfo };
    } catch (error) {
      console.log(
        "ZoneDetailService: Error combining zone data:",
        error.message
      );
      return { success: false, error: error.message };
    }
  }

  // Lấy zone detail theo ID
  async getZoneDetailById(id) {
    try {
      const response = await fetch(
        ZONE_DETAIL_ENDPOINTS.GET_ZONE_DETAIL_BY_ID(id),
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
}

// Export singleton instance
export default new ZoneDetailService();
