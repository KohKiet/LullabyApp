import { API_CONFIG } from "./apiConfig";

class WorkScheduleService {
  // Lấy tất cả work schedules
  async getAllWorkSchedules() {
    try {
      console.log(
        "WorkScheduleService: Fetching all work schedules..."
      );
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/WorkSchedule/GetAll`,
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
          "WorkScheduleService: Work schedules received:",
          data.length,
          "items"
        );
        return { success: true, data: data };
      } else {
        console.log(
          "WorkScheduleService: HTTP Error:",
          response.status
        );
        // Fallback to mock data
        console.log("WorkScheduleService: Using mock data");
        return {
          success: true,
          data: [
            {
              workScheduleID: 1,
              bookingID: 2,
              serviceID: 1,
              nursingID: 1,
              workDate: "2025-08-10T13:45:00",
              endTime: "2025-08-10T13:55:00",
              isAttended: false,
              status: "waiting",
            },
            {
              workScheduleID: 2,
              bookingID: 3,
              serviceID: 2,
              nursingID: 2,
              workDate: "2025-08-13T21:02:00",
              endTime: "2025-08-13T21:22:00",
              isAttended: false,
              status: "waiting",
            },
            {
              workScheduleID: 3,
              bookingID: 11,
              serviceID: 2,
              nursingID: 1,
              workDate: "2025-08-21T10:40:00",
              endTime: "2025-08-21T11:00:00",
              isAttended: false,
              status: "waiting",
            },
          ],
        };
      }
    } catch (error) {
      console.log(
        "WorkScheduleService: Network error:",
        error.message
      );
      // Fallback to mock data
      console.log(
        "WorkScheduleService: Using mock data due to error"
      );
      return {
        success: true,
        data: [
          {
            workScheduleID: 1,
            bookingID: 2,
            serviceID: 1,
            nursingID: 1,
            workDate: "2025-08-10T13:45:00",
            endTime: "2025-08-10T13:55:00",
            isAttended: false,
            status: "waiting",
          },
          {
            workScheduleID: 2,
            bookingID: 3,
            serviceID: 2,
            nursingID: 2,
            workDate: "2025-08-13T21:02:00",
            endTime: "2025-08-13T21:22:00",
            isAttended: false,
            status: "waiting",
          },
          {
            workScheduleID: 3,
            bookingID: 11,
            serviceID: 2,
            nursingID: 1,
            workDate: "2025-08-21T10:40:00",
            endTime: "2025-08-21T11:00:00",
            isAttended: false,
            status: "waiting",
          },
        ],
      };
    }
  }

  // Lấy work schedules theo nursing ID
  async getWorkSchedulesByNursingId(nursingID) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/WorkSchedule/GetAllByNursing/${nursingID}`,
        {
          method: "GET",
          headers: { accept: "*/*" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }

      // Fallback: try fetch all then filter
      const allResult = await this.getAllWorkSchedules();
      if (allResult.success) {
        const filteredSchedules = allResult.data.filter(
          (schedule) => schedule.nursingID === nursingID
        );
        return { success: true, data: filteredSchedules };
      }
      return { success: false, error: `HTTP ${response.status}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy work schedule theo ID
  async getWorkScheduleById(workScheduleID) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/WorkSchedule/${workScheduleID}`,
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

  // Cập nhật trạng thái điểm danh
  async updateIsAttended(workScheduleID) {
    try {
      console.log(
        `WorkScheduleService: Updating attendance for work schedule ID: ${workScheduleID}`
      );

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/WorkSchedule/UpdateIsAttended/${workScheduleID}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "WorkScheduleService: Attendance updated successfully:",
          data
        );
        return { success: true, data: data };
      } else {
        let errorMessage = "Không thể cập nhật điểm danh";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.log(
            "WorkScheduleService: Error response:",
            errorData
          );
        } catch (parseError) {
          console.log(
            "WorkScheduleService: Could not parse error response"
          );
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error(
        "WorkScheduleService: Network error updating attendance:",
        error
      );
      return {
        success: false,
        error: error.message || "Lỗi kết nối mạng",
      };
    }
  }

  // Update work schedule status
  async updateStatus(workScheduleID, status) {
    try {
      console.log(
        "WorkScheduleService: Updating status for work schedule:",
        workScheduleID,
        "to:",
        status
      );

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/WorkSchedule/UpdateStatus/${workScheduleID}/${status}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "WorkScheduleService: Status updated successfully:",
          data
        );
        return { success: true, data: data };
      } else {
        let errorMessage = "Không thể cập nhật trạng thái";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.log(
            "WorkScheduleService: Error response:",
            errorData
          );
        } catch (parseError) {
          console.log(
            "WorkScheduleService: Could not parse error response"
          );
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error(
        "WorkScheduleService: Network error updating status:",
        error
      );
      return {
        success: false,
        error: error.message || "Lỗi kết nối mạng",
      };
    }
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  }

  // Format time for display
  formatTime(dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  }

  // Format datetime for display
  formatDateTime(dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes} - ${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  }

  // Format status for display
  formatStatus(status) {
    switch (status) {
      case "waiting":
        return "Chờ xác nhận";
      case "arrived":
        return "Đã đến";
      case "confirmed":
        return "Đã xác nhận";
      case "in-progress":
        return "Đang thực hiện";
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
      case "waiting":
        return "#FFA500";
      case "arrived":
        return "#4CAF50";
      case "confirmed":
        return "#4CAF50";
      case "in-progress":
        return "#2196F3";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#FF6B6B";
      default:
        return "#666";
    }
  }
}

// Export singleton instance
export default new WorkScheduleService();
