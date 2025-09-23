import { MEDICAL_NOTE_ENDPOINTS } from "./apiConfig";

// Network timeout (10 seconds)
const NETWORK_TIMEOUT = 10000;

class MedicalNoteService {
  // Helper function to create fetch with timeout
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

  // Lấy tất cả medical notes
  async getAllMedicalNotes() {
    try {
      const response = await this.fetchWithTimeout(
        MEDICAL_NOTE_ENDPOINTS.GET_ALL,
        {
          method: "GET",
          headers: {
            accept: "*/*",
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

  // Lấy medical note theo ID
  async getMedicalNoteById(medicalNoteID) {
    try {
      const response = await this.fetchWithTimeout(
        MEDICAL_NOTE_ENDPOINTS.GET_BY_ID(medicalNoteID),
        {
          method: "GET",
          headers: {
            accept: "*/*",
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

  // Lấy medical notes theo customize task ID
  async getMedicalNotesByCustomizeTaskId(customizeTaskID) {
    try {
      const response = await this.fetchWithTimeout(
        MEDICAL_NOTE_ENDPOINTS.GET_BY_CUSTOMIZE_TASK_ID(
          customizeTaskID
        ),
        {
          method: "GET",
          headers: {
            accept: "*/*",
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

  // Lấy medical notes theo booking ID
  async getMedicalNotesByBookingId(bookingID) {
    try {
      const response = await this.fetchWithTimeout(
        MEDICAL_NOTE_ENDPOINTS.GET_BY_BOOKING_ID(bookingID),
        {
          method: "GET",
          headers: {
            accept: "*/*",
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

  // Tạo medical note mới (cho Nurse)
  async createMedicalNote(medicalNoteData) {
    try {
      const response = await this.fetchWithTimeout(
        MEDICAL_NOTE_ENDPOINTS.CREATE,
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(medicalNoteData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cập nhật medical note (cho Nurse)
  async updateMedicalNote(medicalNoteID, updateData) {
    try {
      const response = await this.fetchWithTimeout(
        MEDICAL_NOTE_ENDPOINTS.UPDATE(medicalNoteID),
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json-patch+json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Xóa medical note (cho Nurse)
  async deleteMedicalNote(medicalNoteID) {
    try {
      const response = await this.fetchWithTimeout(
        MEDICAL_NOTE_ENDPOINTS.DELETE(medicalNoteID),
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Format date cho medical note
  formatDate(dateString) {
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

  // Format date time cho medical note
  formatDateTime(dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  }
}

// Export singleton instance
export default new MedicalNoteService();
