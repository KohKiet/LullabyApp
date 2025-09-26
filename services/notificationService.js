import { API_CONFIG } from "./apiConfig";

class NotificationService {
  // Retry configuration
  static MAX_RETRIES = 2;
  static RETRY_DELAY = 1000;

  // Helper function to delay execution
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Create a new notification for a specific account
  static async createNotification({ accountID, message }) {
    try {
      const response = await this.retryRequest(async () => {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}/api/Notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accountID, message }),
            timeout: 10000,
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `HTTP ${res.status}: ${text || res.statusText}`
          );
        }

        return res;
      });

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      // Silently handle API errors to avoid noisy console overlays in production/dev
      return {
        success: false,
        error: error.message || "Không thể tạo thông báo",
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Thời gian không xác định";
      }

      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.ceil(diffTime / (1000 * 60));

      if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`;
      } else if (diffHours < 24) {
        return `${diffHours} giờ trước`;
      } else if (diffDays === 1) {
        return "Hôm qua";
      } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
      } else {
        return date.toLocaleDateString("vi-VN");
      }
    } catch (error) {
      // Silent error handling
      return "Thời gian không xác định";
    }
  }
}

export default NotificationService;
