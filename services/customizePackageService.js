import { TEMPLATE_ENDPOINTS } from "./apiConfig";

const NETWORK_TIMEOUT = 10000;

class CustomizePackageService {
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

  // Lấy tất cả Customize Packages
  async getAllCustomizePackages() {
    try {
      const url = `${TEMPLATE_ENDPOINTS.CUSTOMIZE_PACKAGES}/GetAll`;
      console.log("CustomizePackageService: Fetching from URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "CustomizePackageService: Response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "CustomizePackageService: Data received:",
          data.length,
          "items"
        );
        return {
          success: true,
          data: data,
        };
      } else {
        console.log(
          "CustomizePackageService: HTTP Error:",
          response.status,
          response.statusText
        );
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.log(
        "CustomizePackageService: Network error:",
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Lấy Customize Packages theo bookingID
  async getCustomizePackagesByBookingId(bookingID) {
    try {
      const result = await this.getAllCustomizePackages();
      if (result.success) {
        const packages = result.data.filter(
          (pkg) => pkg.bookingID === bookingID
        );
        return {
          success: true,
          data: packages,
        };
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Format giá tiền
  formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }
}

export default new CustomizePackageService();
