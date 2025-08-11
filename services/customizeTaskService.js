import { API_CONFIG } from "./apiConfig";

class CustomizeTaskService {
  // Lấy tất cả customize tasks
  async getAllCustomizeTasks() {
    try {
      console.log(
        "CustomizeTaskService: Fetching all customize tasks..."
      );
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/CustomizeTask/GetAll`,
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
          "CustomizeTaskService: Customize tasks received:",
          data.length,
          "items"
        );
        return { success: true, data: data };
      } else {
        console.log(
          "CustomizeTaskService: HTTP Error:",
          response.status
        );
        // Fallback to mock data
        console.log("CustomizeTaskService: Using mock data");
        return {
          success: true,
          data: [
            {
              customizeTaskID: 4,
              customizePackageID: 2,
              serviceID: 1,
              nursingID: 1,
              serviceTaskID: null,
              bookingID: 2,
              taskOrder: 1,
              status: "isScheduled",
            },
            {
              customizeTaskID: 10,
              customizePackageID: 5,
              serviceID: 2,
              nursingID: 2,
              serviceTaskID: null,
              bookingID: 3,
              taskOrder: 2,
              status: "isScheduled",
            },
            {
              customizeTaskID: 22,
              customizePackageID: 12,
              serviceID: 2,
              nursingID: 1,
              serviceTaskID: null,
              bookingID: 9,
              taskOrder: 1,
              status: "isScheduled",
            },
          ],
        };
      }
    } catch (error) {
      console.log(
        "CustomizeTaskService: Network error:",
        error.message
      );
      // Fallback to mock data
      console.log(
        "CustomizeTaskService: Using mock data due to error"
      );
      return {
        success: true,
        data: [
          {
            customizeTaskID: 4,
            customizePackageID: 2,
            serviceID: 1,
            nursingID: 1,
            serviceTaskID: null,
            bookingID: 2,
            taskOrder: 1,
            status: "isScheduled",
          },
          {
            customizeTaskID: 10,
            customizePackageID: 5,
            serviceID: 2,
            nursingID: 2,
            serviceTaskID: null,
            bookingID: 3,
            taskOrder: 2,
            status: "isScheduled",
          },
          {
            customizeTaskID: 22,
            customizePackageID: 12,
            serviceID: 2,
            nursingID: 1,
            serviceTaskID: null,
            bookingID: 9,
            taskOrder: 1,
            status: "isScheduled",
          },
        ],
      };
    }
  }

  // Lấy customize tasks theo nursing ID
  async getCustomizeTasksByNursingId(nursingID) {
    try {
      const allResult = await this.getAllCustomizeTasks();
      if (allResult.success) {
        const filteredTasks = allResult.data.filter(
          (task) => task.nursingID === nursingID
        );
        return { success: true, data: filteredTasks };
      } else {
        return { success: false, error: allResult.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy customize tasks theo bookingID
  async getCustomizeTasksByBookingId(bookingID) {
    try {
      console.log(
        "CustomizeTaskService: Fetching customize tasks for bookingID:",
        bookingID
      );

      // Lấy tất cả customize tasks và lọc theo bookingID
      const allTasksResult = await this.getAllCustomizeTasks();

      if (allTasksResult.success) {
        const tasksForBooking = allTasksResult.data.filter(
          (task) => task.bookingID === parseInt(bookingID)
        );

        console.log(
          "CustomizeTaskService: Found",
          tasksForBooking.length,
          "tasks for booking",
          bookingID
        );

        return { success: true, data: tasksForBooking };
      } else {
        return allTasksResult;
      }
    } catch (error) {
      console.log(
        "CustomizeTaskService: Error getting tasks by booking ID:",
        error.message
      );
      return { success: false, error: error.message };
    }
  }

  // Lấy customize task theo ID
  async getCustomizeTaskById(customizeTaskID) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/CustomizeTask/${customizeTaskID}`,
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

  // Update nursing assignment for a customize task
  async updateNursing(customizeTaskID, nursingID) {
    try {
      const url = `${API_CONFIG.BASE_URL}/api/CustomizeTask/UpdateNursing/${customizeTaskID}/${nursingID}`;
      console.log("CustomizeTaskService.updateNursing URL:", url);
      const response = await fetch(url, {
        method: "PUT",
        headers: { accept: "*/*" },
      });
      console.log(
        "CustomizeTaskService.updateNursing status:",
        response.status
      );
      if (response.ok) {
        const data = await response.json();
        console.log(
          "CustomizeTaskService.updateNursing success:",
          data
        );
        return { success: true, data };
      }
      let errorPayload = null;
      try {
        errorPayload = await response.json();
      } catch (_) {
        errorPayload = await response.text();
      }
      const message =
        (errorPayload &&
          (errorPayload.message || JSON.stringify(errorPayload))) ||
        `HTTP ${response.status}`;
      console.warn(
        "CustomizeTaskService.updateNursing failed:",
        message
      );
      return { success: false, error: message };
    } catch (error) {
      console.error(
        "CustomizeTaskService.updateNursing exception:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  // Format status for display
  formatStatus(status) {
    switch (status) {
      case "pending":
        return "Chờ phân công";
      case "isScheduled":
        return "Đã lên lịch";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  }

  // Get status color
  getStatusColor(status) {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "isScheduled":
        return "#4CAF50";
      case "completed":
        return "#2196F3";
      case "cancelled":
        return "#FF6B6B";
      default:
        return "#666";
    }
  }
}

// Export singleton instance
export default new CustomizeTaskService();
