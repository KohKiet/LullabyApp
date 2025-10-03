import { API_CONFIG } from "./apiConfig";

class NotificationService {
  static BASE_URL = "https://phamlequyanh.name.vn/api";

  // Retry configuration
  static MAX_RETRIES = 2;
  static RETRY_DELAY = 1000;

  // Helper function to delay execution
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Create a new notification for a specific account
  static async createNotification(accountID, message) {
    try {
      const response = await fetch(`${this.BASE_URL}/Notification`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountID: accountID,
          message: message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result,
          message: result.message || "Notification sent successfully",
        };
      } else {
        return {
          success: false,
          error: result.message || "Failed to send notification",
        };
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Helper function to retry failed requests
  static async retryRequest(requestFn, retries = this.MAX_RETRIES) {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0) {
        await this.delay(this.RETRY_DELAY);
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  // Get all notifications for all users (admin use)
  static async getAllNotifications() {
    try {
      const response = await this.retryRequest(async () => {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}/api/Notification/GetAll`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10 second timeout
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      });

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      // Silent error handling
      return {
        success: false,
        error: error.message || "Không thể kết nối đến máy chủ",
      };
    }
  }

  // Get notifications for a specific account
  static async getNotificationsByAccount(accountID) {
    try {
      const response = await this.retryRequest(async () => {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}/api/Notification/GetAllByAccount/${accountID}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10 second timeout
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      });

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      // Silent error handling
      return {
        success: false,
        error: error.message || "Không thể tải thông báo",
      };
    }
  }

  // Mark notification as read using real API
  static async markAsRead(notificationID) {
    try {
      const response = await this.retryRequest(async () => {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}/api/Notification/IsRead/${notificationID}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10 second timeout
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      });

      const data = await response.json();
      console.log(
        `Marked notification ${notificationID} as read on server:`,
        data
      );
      return { success: true, data };
    } catch (error) {
      // Silent error handling
      return {
        success: false,
        error: error.message || "Không thể đánh dấu đã đọc",
      };
    }
  }

  // Get unread count for an account
  static async getUnreadCount(accountID) {
    try {
      const result = await this.getNotificationsByAccount(accountID);
      if (result.success) {
        const unreadCount = result.data.filter(
          (notification) => !notification.isRead
        ).length;
        return { success: true, count: unreadCount };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      // Silent error handling
      return {
        success: false,
        error: error.message || "Không thể đếm thông báo chưa đọc",
      };
    }
  }

  // Format notification date
  static formatDate(dateString) {
    class NotificationService {
      static BASE_URL = "https://phamlequyanh.name.vn/api";

      // ...existing methods

      static async notifyNurseOfPayment(bookingData, nurseAccountID) {
        try {
          // Format thời gian
          const startTime = this.formatTime(bookingData.startTime);
          const endTime = this.formatTime(bookingData.endTime);
          const date = this.formatDate(bookingData.startTime);

          const message =
            `Bạn có lịch mới! Booking #${bookingData.bookingID} - ` +
            `Thời gian: ${startTime} đến ${endTime} vào ngày ${date}. ` +
            `Khách hàng: ${bookingData.customerName || "Khách hàng"}`;

          return await this.createNotification(
            nurseAccountID,
            message
          );
        } catch (error) {
          console.error("Error notifying nurse:", error);
          return {
            success: false,
            error: error.message,
          };
        }
      }

      static formatTime(dateString) {
        if (!dateString) return "";

        try {
          const date = new Date(dateString);
          return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        } catch (error) {
          return dateString;
        }
      }

      static formatDate(dateString) {
        if (!dateString) return "";

        try {
          const date = new Date(dateString);
          return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        } catch (error) {
          return dateString;
        }
      }

      static async createNotification(accountID, message) {
        try {
          const response = await fetch(
            `${this.BASE_URL}/Notification`,
            {
              method: "POST",
              headers: {
                accept: "*/*",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accountID: accountID,
                message: message,
              }),
            }
          );

          const result = await response.json();

          if (response.ok) {
            return {
              success: true,
              data: result,
              message:
                result.message || "Notification sent successfully",
            };
          } else {
            return {
              success: false,
              error: result.message || "Failed to send notification",
            };
          }
        } catch (error) {
          console.error("Error creating notification:", error);
          return {
            success: false,
            error: error.message,
          };
        }
      }
    }

    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  }

  static async notifyNurseOfPayment(bookingData, nurseAccountID) {
    try {
      // Format thời gian
      const startTime = this.formatTime(bookingData.startTime);
      const endTime = this.formatTime(bookingData.endTime);
      const date = this.formatDate(bookingData.startTime);

      const message =
        `Bạn có lịch mới! Booking #${bookingData.bookingID} - ` +
        `Thời gian: ${startTime} đến ${endTime} vào ngày ${date}. ` +
        `Khách hàng: ${bookingData.customerName || "Khách hàng"}`;

      return await this.createNotification(nurseAccountID, message);
    } catch (error) {
      console.error("Error notifying nurse:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static formatTime(dateString) {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      return dateString;
    }
  }

  static formatDateTime(dateString) {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  }
}

export default NotificationService;
