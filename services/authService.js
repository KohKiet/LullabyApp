import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, AUTH_ENDPOINTS } from "./apiConfig";

// User storage key
const USER_STORAGE_KEY = "user";
const TOKEN_STORAGE_KEY = "auth_token";

// Network timeout (in milliseconds)
// Increased to tolerate slower responses on new server
const NETWORK_TIMEOUT = 20000;

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
      await AsyncStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(userData)
      );
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

  // Lấy thông tin user (trả về trực tiếp cho backward compatibility)
  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        return JSON.parse(userData);
      } else {
        return null;
      }
    } catch (error) {
      return null;
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
        isLoggedIn:
          userResult.success &&
          tokenResult.success &&
          tokenResult.data,
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
      await AsyncStorage.multiRemove([
        USER_STORAGE_KEY,
        TOKEN_STORAGE_KEY,
      ]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Đăng nhập với credentials
  async loginWithCredentials(emailOrPhone, password) {
    try {
      console.log("🔍 Attempting login with:", {
        emailOrPhone,
        password,
      });
      console.log("🔍 Login URL:", AUTH_ENDPOINTS.LOGIN);

      const response = await this.fetchWithTimeout(
        AUTH_ENDPOINTS.LOGIN,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json-patch+json",
            accept: "*/*",
          },
          body: JSON.stringify({
            EmailOrPhoneNumber: emailOrPhone,
            password: password,
          }),
        }
      );

      console.log("🔍 Login response status:", response.status);
      console.log("🔍 Login response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Login response data:", data);

        // API trả về format: { account: {...}, message: "...", token?: "..." }
        // Token có thể nằm ở data.token hoặc lồng trong data.account.token
        const account = data.account || {};
        const token =
          data.token || (account ? account.token : undefined);
        if (account && token) {
          const userData = {
            ...account,
            token: token,
          };
          console.log("🔍 User data from API:", userData);

          // Lưu user và token
          await this.saveUser(userData);
          await this.saveToken(token);

          return { success: true, user: userData };
        } else {
          console.log("🔍 Login failed: Invalid response format");
          return { success: false, error: "Invalid response format" };
        }
      } else {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || errorData.error || errorMessage;
          console.log("🔍 Login error response:", errorData);
        } catch (parseError) {
          console.log("🔍 Could not parse error response");
          // Ignore parse error, use default message
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.log("🔍 Login exception:", error.message);

      // Fallback to mock data for testing when API is not available
      if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        console.log(
          "🔍 API not available, using mock data for testing"
        );

        // Mock data for testing
        const mockUserData = {
          id: 1,
          accountID: 6,
          email: emailOrPhone,
          fullName: "Test User",
          full_name: "Test User",
          phoneNumber: "0123456789",
          phone_number: "0123456789",
          role_id: 2, // NursingSpecialist
          roleID: 2,
          roleName: "NursingSpecialist",
          status: "active",
          token: "mock_token_123",
        };

        // Lưu user và token
        await this.saveUser(mockUserData);
        await this.saveToken(mockUserData.token);

        return { success: true, user: mockUserData };
      }

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
          return {
            success: false,
            error: data.message || "Registration failed",
          };
        }
      } else {
        let errorMessage = "Registration failed";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Đăng nhập bằng Google (fullName, email)
  async loginWithGoogle(fullName, email) {
    try {
      const url = `${API_CONFIG.BASE_URL}/api/accounts/login/google`;
      const response = await this.fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json-patch+json",
          accept: "*/*",
        },
        body: JSON.stringify({ fullName, email }),
      });

      if (response.ok) {
        const data = await response.json();
        // Expecting { message, account: {..., token} }
        const account = data.account || {};
        const token = account.token || data.token;
        if (account && token) {
          const userData = { ...account, token };
          await this.saveUser(userData);
          await this.saveToken(token);
          return { success: true, user: userData };
        }
        return {
          success: false,
          error: "Invalid response from Google login",
        };
      }

      let errorMessage = "Google login failed";
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message || errorData.error || errorMessage;
      } catch (_) {}
      return { success: false, error: errorMessage };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Đăng nhập với Google (sử dụng OAuth code)
  async exchangeGoogleCodeForToken(code) {
    try {
      console.log("🔄 Exchanging Google OAuth code for token...");

      const url = `${AUTH_ENDPOINTS.LOGIN_GOOGLE}`;
      const response = await this.fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json-patch+json",
          },
          body: JSON.stringify({
            code: code,
            redirectUri:
              "https://auth.expo.io/@migitbarbarian/LullabyApp",
          }),
        },
        15000
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "✅ Google OAuth token exchange successful:",
          data
        );

        return {
          success: true,
          user: data.user || data,
          tokens: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            tokenType: data.tokenType || "Bearer",
          },
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "❌ Google OAuth token exchange failed:",
          response.status,
          errorData
        );

        return {
          success: false,
          error:
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error("💥 Google OAuth token exchange error:", error);
      return {
        success: false,
        error: error.message || "Network error during Google OAuth",
      };
    }
  }

  // Lưu auth tokens
  async saveAuthTokens(tokens) {
    try {
      if (tokens.accessToken) {
        await AsyncStorage.setItem(
          TOKEN_STORAGE_KEY,
          tokens.accessToken
        );
      }

      // Có thể lưu thêm refresh token nếu cần
      if (tokens.refreshToken) {
        await AsyncStorage.setItem(
          "refresh_token",
          tokens.refreshToken
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error saving auth tokens:", error);
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
          errorMessage =
            errorData.message || errorData.error || errorMessage;
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
      const nursingResponse = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}/api/nursingspecialists/getall`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (nursingResponse.ok) {
        const nursingSpecialists = await nursingResponse.json();
        const specialist = nursingSpecialists.find(
          (ns) => ns.accountID === accountID
        );

        if (specialist) {
          // Lấy thông tin account
          const accountResponse = await this.fetchWithTimeout(
            `${API_CONFIG.BASE_URL}/api/accounts/get/${accountID}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
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
          return {
            success: false,
            error: "Nursing specialist not found",
          };
        }
      } else {
        return {
          success: false,
          error: `HTTP ${nursingResponse.status}`,
        };
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
