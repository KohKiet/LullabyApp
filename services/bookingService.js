import { TEMPLATE_ENDPOINTS } from "./apiConfig";

const NETWORK_TIMEOUT = 10000;

class BookingService {
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

  // Lấy tất cả bookings
  async getAllBookings() {
    try {
      const url = `${TEMPLATE_ENDPOINTS.BOOKINGS}/GetAll`;
      console.log("BookingService: Fetching from URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "BookingService: Response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "BookingService: Data received:",
          data.length,
          "items"
        );
        return {
          success: true,
          data: data,
        };
      } else {
        console.log(
          "BookingService: HTTP Error:",
          response.status,
          response.statusText
        );
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.log("BookingService: Network error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Tạo booking cho dịch vụ lẻ (nhiều dịch vụ)
  async createServiceBooking(bookingData) {
    try {
      const url = `${TEMPLATE_ENDPOINTS.BOOKINGS}/CreateServiceBooking`;
      console.log(
        "BookingService: Creating service booking from URL:",
        url
      );
      console.log(
        "BookingService: Request body:",
        JSON.stringify(bookingData, null, 2)
      );

      const response = await this.fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json-patch+json",
        },
        body: JSON.stringify(bookingData),
      });

      console.log(
        "BookingService: Response status:",
        response.status
      );
      console.log(
        "BookingService: Response status text:",
        response.statusText
      );

      if (response.ok) {
        const data = await response.json();
        console.log("BookingService: Booking created:", data);
        return {
          success: true,
          data: data,
        };
      } else {
        const errorText = await response.text();
        console.log(
          "BookingService: Error response body:",
          errorText
        );
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.log("BookingService: Network error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Tạo booking cho gói dịch vụ (1 package)
  async createPackageBooking(bookingData) {
    try {
      const url = `${TEMPLATE_ENDPOINTS.BOOKINGS}/CreatePackageBooking`;
      console.log(
        "BookingService: Creating package booking from URL:",
        url
      );
      console.log(
        "BookingService: Request body:",
        JSON.stringify(bookingData, null, 2)
      );

      const response = await this.fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json-patch+json",
        },
        body: JSON.stringify(bookingData),
      });

      console.log(
        "BookingService: Response status:",
        response.status
      );
      console.log(
        "BookingService: Response status text:",
        response.statusText
      );

      if (response.ok) {
        const data = await response.json();
        console.log("BookingService: Booking created:", data);
        return {
          success: true,
          data: data,
        };
      } else {
        const errorText = await response.text();
        console.log(
          "BookingService: Error response body:",
          errorText
        );
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.log("BookingService: Network error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getBookingById(bookingID) {
    try {
      console.log(
        "BookingService: Getting booking by ID:",
        bookingID
      );
      const url = `${TEMPLATE_ENDPOINTS.BOOKINGS}/${bookingID}`;
      console.log("BookingService: URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "BookingService: Response status:",
        response.status
      );
      console.log(
        "BookingService: Response status text:",
        response.statusText
      );

      if (response.ok) {
        const data = await response.json();
        console.log("BookingService: Booking data:", data);
        return {
          success: true,
          data: data,
        };
      } else {
        const errorBody = await response.text();
        console.error("BookingService: Error response:", errorBody);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error("BookingService: Network error:", error);
      return {
        success: false,
        error: "Network request failed",
      };
    }
  }

  // Format ngày tháng
  formatDate(date) {
    return new Date(date).toISOString();
  }

  // Format trạng thái booking
  formatStatus(status) {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  }
}

export default new BookingService();
