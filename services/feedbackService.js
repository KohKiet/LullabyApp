import { API_CONFIG } from "./apiConfig";

class FeedbackService {
  async submitFeedback({
    nursingID,
    customizeTaskID,
    serviceID,
    rate,
    content,
  }) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/Feedback`,
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json-patch+json",
          },
          body: JSON.stringify({
            nursingID,
            customizeTaskID,
            serviceID,
            rate,
            content,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        let errorMessage = "Không thể gửi đánh giá";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (_) {}
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || "Lỗi kết nối mạng",
      };
    }
  }

  async getFeedbackByCustomizeTaskID(customizeTaskID) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/Feedback/${customizeTaskID}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        // Treat non-2xx as not found/no feedback
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || "Lỗi kết nối mạng",
      };
    }
  }

  async getAllFeedbacks() {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/Feedback/GetAll`,
        {
          method: "GET",
          headers: { accept: "*/*" },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }
      return { success: false, error: `HTTP ${response.status}` };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Lỗi kết nối mạng",
      };
    }
  }
}

export default new FeedbackService();
