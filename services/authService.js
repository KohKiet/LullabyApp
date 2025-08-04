import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_ENDPOINTS } from "./apiConfig";

// User storage key
const USER_STORAGE_KEY = "user";
const TOKEN_STORAGE_KEY = "auth_token";

// Network timeout (10 seconds)
const NETWORK_TIMEOUT = 10000;

class AuthService {
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

  // Lưu thông tin user
  async saveUser(userData) {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy thông tin user
  async getUser() {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        return { success: true, data: JSON.parse(userData) };
      } else {
        return { success: false, error: "No user data found" };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lưu token
  async saveToken(token) {
    try {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy token
  async getToken() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      return { success: true, data: token };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Kiểm tra đăng nhập
  async isLoggedIn() {
    try {
      const userResult = await this.getUser();
      const tokenResult = await this.getToken();
      
      return {
        success: true,
        isLoggedIn: userResult.success && tokenResult.success && tokenResult.data,
        user: userResult.success ? userResult.data : null,
        token: tokenResult.success ? tokenResult.data : null,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Đăng xuất
  async logout() {
    try {
      await AsyncStorage.multiRemove([USER_STORAGE_KEY, TOKEN_STORAGE_KEY]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Đăng nhập với credentials
  async loginWithCredentials(emailOrPhone, password) {
    try {
      const response = await this.fetchWithTimeout(
        AUTH_ENDPOINTS.LOGIN,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailOrPhone: emailOrPhone,
            password: password,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const userData = data.data;
          
          // Lưu user và token
          await this.saveUser(userData);
          await this.saveToken(userData.token || data.token);
          
          return { success: true, data: userData };
        } else {
          return { success: false, error: data.message || "Login failed" };
        }
      } else {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Đăng ký
  async register(userData) {
    try {
      const response = await this.fetchWithTimeout(
        AUTH_ENDPOINTS.REGISTER,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          return { success: true, data: data.data };
        } else {
          return { success: false, error: data.message || "Registration failed" };
        }
      } else {
        let errorMessage = "Registration failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cập nhật thông tin user
  async updateUser(userId, userData) {
    try {
      const tokenResult = await this.getToken();
      if (!tokenResult.success || !tokenResult.data) {
        return { success: false, error: "No authentication token" };
      }

      const response = await this.fetchWithTimeout(
        AUTH_ENDPOINTS.UPDATE_USER(userId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenResult.data}`,
          },
          body: JSON.stringify(userData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        let errorMessage = "Update failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy thông tin profile user
  async fetchUserProfile(userId) {
    try {
      const tokenResult = await this.getToken();
      if (!tokenResult.success || !tokenResult.data) {
        return { success: false, error: "No authentication token" };
      }

      const response = await this.fetchWithTimeout(
        AUTH_ENDPOINTS.GET_USER_PROFILE(userId),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenResult.data}`,
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

  // Lấy thông tin chi tiết nursing specialist
  async fetchNursingSpecialistDetails(accountID) {
    try {
      const response = await this.fetchWithTimeout(
        `http://localhost:5294/api/nursingspecialists/getall`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const nursingSpecialists = await response.json();
        const specialist = nursingSpecialists.find(
          (ns) => ns.accountID === accountID
        );

        if (specialist) {
          // Lấy thông tin account
          const accountResponse = await this.fetchWithTimeout(
            `http://localhost:5294/api/accounts/get/${accountID}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            
            // Merge data
            const detailedData = {
              ...specialist,
              fullName: accountData.fullName || specialist.fullName,
              email: accountData.email,
              phoneNumber: accountData.phoneNumber,
              accountID: accountData.accountID,
              roleID: accountData.roleID,
              status: accountData.status,
              createAt: accountData.createAt,
            };

            return { success: true, data: detailedData };
          } else {
            return { success: true, data: specialist };
          }
        } else {
          return { success: false, error: "Nursing specialist not found" };
        }
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Kiểm tra kết nối API
  async checkApiConnection() {
    try {
      const response = await this.fetchWithTimeout(
        AUTH_ENDPOINTS.HEALTH_CHECK,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        isConnected: response.ok,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        isConnected: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export default new AuthService();
