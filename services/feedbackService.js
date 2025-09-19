import { API_CONFIG } from "./apiConfig";

class FeedbackService {
  // Trả về điểm trung bình (number) cho nursingID
  async getAverageRatingByNursing(nursingID) {
    try {
      const url = `${API_CONFIG.BASE_URL}/api/Feedback/AverageRatingByNursing/${nursingID}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "*/*",
        },
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      // API có thể trả về text số thuần (ví dụ: "4.3")
      const text = await response.text();
      const value = parseFloat(text);
      if (!Number.isNaN(value)) {
        return { success: true, data: value };
      }

      // Fallback nếu server trả JSON
      try {
        const json = JSON.parse(text);
        const numeric =
          typeof json === "number" ? json : parseFloat(json?.value);
        return {
          success: true,
          data: Number.isNaN(numeric) ? 0 : numeric,
        };
      } catch (_) {
        return { success: true, data: 0 };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Gửi đánh giá
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

  // Lấy feedback theo CustomizeTaskID
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
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || "Lỗi kết nối mạng",
      };
    }
  }

  // Lấy tất cả feedbacks
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
