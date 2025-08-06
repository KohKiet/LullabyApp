import { TEMPLATE_ENDPOINTS } from "./apiConfig";

const NETWORK_TIMEOUT = 10000;

class CustomizeTaskService {
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

  // Lấy tất cả Customize Tasks
  async getAllCustomizeTasks() {
    try {
      const url = `${TEMPLATE_ENDPOINTS.CUSTOMIZE_TASKS}/GetAll`;
      console.log("CustomizeTaskService: Fetching from URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "CustomizeTaskService: Response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "CustomizeTaskService: Data received:",
          data.length,
          "items"
        );
        return {
          success: true,
          data: data,
        };
      } else {
        console.log(
          "CustomizeTaskService: HTTP Error:",
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
        "CustomizeTaskService: Network error:",
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Lấy Customize Tasks theo bookingID
  async getCustomizeTasksByBookingId(bookingID) {
    try {
      const result = await this.getAllCustomizeTasks();
      if (result.success) {
        const tasks = result.data.filter(
          (task) => task.bookingID === bookingID
        );
        return {
          success: true,
          data: tasks,
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

  // Cập nhật nursingID cho CustomizeTask
  async updateNursing(customizeTaskId, nursingId) {
    try {
      const url = `${TEMPLATE_ENDPOINTS.CUSTOMIZE_TASKS}/UpdateNursing/${customizeTaskId}/${nursingId}`;
      console.log(
        "CustomizeTaskService: Updating nursing from URL:",
        url
      );

      const response = await this.fetchWithTimeout(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "CustomizeTaskService: Response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log("CustomizeTaskService: Nursing updated:", data);
        return {
          success: true,
          data: data,
        };
      } else {
        const errorText = await response.text();
        console.log(
          "CustomizeTaskService: Error response body:",
          errorText
        );
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.log(
        "CustomizeTaskService: Network error:",
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new CustomizeTaskService();
