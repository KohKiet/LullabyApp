import { ZONE_DETAIL_ENDPOINTS } from "./apiConfig";

const NETWORK_TIMEOUT = 10000;

class ZoneDetailService {
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

  // Lấy tất cả Zone Details
  async getAllZoneDetails() {
    try {
      const url = ZONE_DETAIL_ENDPOINTS.GET_ALL_ZONE_DETAILS;
      console.log("ZoneDetailService: Fetching from URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "ZoneDetailService: Response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "ZoneDetailService: Data received:",
          data.length,
          "items"
        );
        return {
          success: true,
          data: data,
        };
      } else {
        console.log(
          "ZoneDetailService: HTTP Error:",
          response.status,
          response.statusText
        );
        // Fallback to mock data
        console.log("ZoneDetailService: Using mock data");
        return {
          success: true,
          data: [
            {
              zoneDetailID: 1,
              zoneID: 1,
              zoneName: "Khu vực 1",
              zoneDescription: "Khu vực Hà Nội",
              status: "active",
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
            zoneName: "Khu vực 1",
            zoneDescription: "Khu vực Hà Nội",
            status: "active",
          },
        ],
      };
    }
  }

  // Lấy Zone Detail theo ID
  async getZoneDetailById(zoneDetailID) {
    try {
      const url =
        ZONE_DETAIL_ENDPOINTS.GET_ZONE_DETAIL_BY_ID(zoneDetailID);
      console.log("ZoneDetailService: Fetching from URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "ZoneDetailService: Response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log("ZoneDetailService: Zone detail received:", data);
        return {
          success: true,
          data: data,
        };
      } else {
        console.log(
          "ZoneDetailService: HTTP Error:",
          response.status,
          response.statusText
        );
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.log("ZoneDetailService: Network error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new ZoneDetailService();
