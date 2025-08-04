import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_ENDPOINTS } from "./apiConfig";
import RoleService from "./roleService";

// User storage key
const USER_STORAGE_KEY = "user";
const TOKEN_STORAGE_KEY = "auth_token";

// Mock user data for development (fallback only)
const MOCK_USERS = [
  {
    id: 1,
    role_id: 4, // Customer
    full_name: "Nguyễn Văn A",
    phone_number: "0123456789",
    email: "nguyenvana@email.com",
    password: "password123",
    avatar_url: "https://example.com/avatar1.jpg",
    create_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    status: "active",
  },
  {
    id: 2,
    role_id: 2, // NursingSpecialist
    full_name: "Trần Thị B",
    phone_number: "0987654321",
    email: "tranthib@email.com",
    password: "password123",
    avatar_url: "https://example.com/avatar2.jpg",
    create_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    status: "active",
    major: "Tư vấn viên",
    experience: "5 năm kinh nghiệm tư vấn dinh dưỡng",
    slogan: "Tư vấn dinh dưỡng chuyên nghiệp, vì sức khỏe của bạn",
  },
  {
    id: 3,
    role_id: 2, // NursingSpecialist
    full_name: "Lê Văn C",
    phone_number: "0123456788",
    email: "levanc@email.com",
    password: "password123",
    avatar_url: "https://example.com/avatar3.jpg",
    create_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    status: "active",
    major: "Tư vấn viên",
    experience: "8 năm kinh nghiệm tư vấn sức khỏe",
    slogan: "Chăm sóc sức khỏe với tình yêu thương",
  },
];

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
      console.log("🔍 SAVING USER DATA TO ASYNCSTORAGE");
      console.log("🔍 User data to save:", userData);
      console.log("🔍 User data keys:", Object.keys(userData));
      console.log("🔍 User data type:", typeof userData);
      console.log(
        "🔍 Role info - role_id:",
        userData.role_id,
        "roleID:",
        userData.roleID,
        "roleName:",
        userData.roleName
      );
      console.log(
        "🔍 ID info - id:",
        userData.id,
        "accountID:",
        userData.accountID
      );
      console.log(
        "🔍 Name info - fullName:",
        userData.fullName,
        "full_name:",
        userData.full_name
      );

      const jsonString = JSON.stringify(userData);
      console.log("🔍 JSON string to save:", jsonString);
      console.log("🔍 JSON string length:", jsonString.length);

      await AsyncStorage.setItem(USER_STORAGE_KEY, jsonString);
      console.log("🔍 User data saved successfully to AsyncStorage");

      // Verify saved data
      const savedData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      console.log("🔍 Verification - saved data:", savedData);

      return true;
    } catch (error) {
      console.error("🔍 Error saving user data:", error);
      return false;
    }
  }

  // Lưu token
  async saveToken(token) {
    try {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      console.log("Token saved successfully");
      return true;
    } catch (error) {
      console.error("Error saving token:", error);
      return false;
    }
  }

  // Lấy thông tin user
  async getUser() {
    try {
      console.log("🔍 GETTING USER DATA FROM ASYNCSTORAGE");
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      console.log("🔍 Raw user data from AsyncStorage:", userData);

      if (userData) {
        try {
          const user = JSON.parse(userData);
          console.log("🔍 Parsed user data:", user);
          console.log("🔍 User ID:", user.id || user.accountID);

          // Nếu có user ID, thử fetch thông tin mới từ API
          if (user.id || user.accountID) {
            const userId = user.id || user.accountID;
            console.log(
              "🔍 Fetching fresh user data from API for ID:",
              userId
            );

            try {
              const profileResult = await this.fetchUserProfile(
                userId
              );
              if (profileResult.success) {
                console.log(
                  "🔍 Fresh user data fetched from API:",
                  profileResult.user
                );
                return profileResult.user;
              } else {
                console.log("🔍 API fetch failed, using cached data");
                return user;
              }
            } catch (apiError) {
              console.log(
                "🔍 API error, using cached data:",
                apiError
              );
              return user;
            }
          }

          return user;
        } catch (parseError) {
          console.error("🔍 Error parsing user data:", parseError);
          return null;
        }
      }
      console.log("🔍 No user data found in AsyncStorage");
      return null;
    } catch (error) {
      console.error("🔍 Error getting user data:", error);
      return null;
    }
  }

  // Lấy token
  async getToken() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  // Kiểm tra user đã đăng nhập chưa
  async isLoggedIn() {
    try {
      const user = await this.getUser();
      const token = await this.getToken();
      return !!(user && token);
    } catch (error) {
      console.error("Error checking login status:", error);
      return false;
    }
  }

  // Xóa thông tin user và token (đăng xuất)
  async logout() {
    try {
      await AsyncStorage.multiRemove([
        USER_STORAGE_KEY,
        TOKEN_STORAGE_KEY,
      ]);
      console.log("User logged out successfully");
      return true;
    } catch (error) {
      console.error("Error during logout:", error);
      return false;
    }
  }

  // Đăng nhập với email/phone và password
  async loginWithCredentials(emailOrPhone, password) {
    try {
      console.log("Attempting to login with real API...");
      console.log("Login URL:", AUTH_ENDPOINTS.LOGIN);
      console.log("Request body:", { emailOrPhone, password });

      // Gọi API thực tế với timeout
      const response = await this.fetchWithTimeout(
        AUTH_ENDPOINTS.LOGIN,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailOrPhoneNumber: emailOrPhone, // Thay đổi field name theo backend
            password: password,
          }),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log("Login successful with real API");
        console.log("Response data:", data);
        console.log("Response data keys:", Object.keys(data));
        console.log("Response data type:", typeof data);

        if (data.user) {
          console.log("User object keys:", Object.keys(data.user));
          console.log("User role_id:", data.user.role_id);
          console.log("User roleID:", data.user.roleID);
          console.log("User id:", data.user.id);
          console.log("User accountID:", data.user.accountID);
        }
        if (data.account) {
          console.log(
            "Account object keys:",
            Object.keys(data.account)
          );
          console.log("Account role_id:", data.account.role_id);
          console.log("Account roleID:", data.account.roleID);
          console.log("Account accountID:", data.account.accountID);
          console.log("Account fullName:", data.account.fullName);
          console.log("Account email:", data.account.email);
        }
        if (data.token) {
          console.log(
            "Token received:",
            data.token.substring(0, 20) + "..."
          );
        }

        // Kiểm tra format response - có thể khác nhau tùy backend
        if (data.user && data.token) {
          const roleName = RoleService.getRoleName(
            data.user.role_id || data.user.roleID
          );
          console.log(
            `User logged in with role: ${roleName} (ID: ${
              data.user.role_id || data.user.roleID
            })`
          );

          // Map roleID thành role_id nếu cần
          const userData = {
            ...data.user,
            role_id: data.user.role_id || data.user.roleID,
          };

          await this.saveUser(userData);
          await this.saveToken(data.token);
          return { success: true, user: userData };
        } else if (data.account && data.token) {
          // Format mới: {"account": {...}, "token": "..."}
          console.log(
            `Account object keys:`,
            Object.keys(data.account)
          );
          console.log(
            `Account roleID: ${data.account.roleID}, roleName: ${data.account.roleName}`
          );

          // Map account data thành user data format
          const userData = {
            id: data.account.accountID,
            accountID: data.account.accountID,
            role_id: data.account.roleID, // Map roleID thành role_id
            roleID: data.account.roleID, // Giữ nguyên để tương thích
            roleName: data.account.roleName, // Thêm roleName từ backend
            fullName: data.account.fullName,
            full_name: data.account.fullName, // Map cho tương thích
            phoneNumber: data.account.phoneNumber,
            phone_number: data.account.phoneNumber, // Map cho tương thích
            email: data.account.email,
            // Thêm các field mặc định nếu không có
            avatar_url: data.account.avatarUrl || "",
            create_at:
              data.account.createAt || new Date().toISOString(),
            status: data.account.status || "active",
            // Thêm các field cho NursingSpecialist nếu có
            nursingID: data.account.nursingID,
            zoneID: data.account.zoneID,
            gender: data.account.gender,
            dateOfBirth: data.account.dateOfBirth,
            address: data.account.address,
            experience: data.account.experience,
            slogan: data.account.slogan,
            major: data.account.major,
          };

          const roleName = RoleService.getRoleName(userData.role_id);
          console.log(
            `User logged in with role: ${roleName} (ID: ${userData.role_id})`
          );

          await this.saveUser(userData);
          await this.saveToken(data.token);
          return { success: true, user: userData };
        } else if (data.id && data.email) {
          // Nếu response trực tiếp là user object
          const roleName = RoleService.getRoleName(
            data.role_id || data.roleID
          );
          console.log(
            `User logged in with role: ${roleName} (ID: ${
              data.role_id || data.roleID
            })`
          );

          // Map roleID thành role_id nếu cần
          const userData = {
            ...data,
            role_id: data.role_id || data.roleID,
          };

          await this.saveUser(userData);
          await this.saveToken(data.token || "temp_token");
          return { success: true, user: userData };
        } else {
          console.log("Invalid response format:", data);
          return {
            success: false,
            error: "Invalid response format from server",
          };
        }
      } else {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          console.log("Error response data:", errorData);

          // Parse validation errors
          if (errorData.errors) {
            const errorFields = Object.keys(errorData.errors);
            const errorMessages = errorFields.map((field) =>
              errorData.errors[field].join(", ")
            );
            errorMessage = errorMessages.join("; ");
          } else {
            errorMessage =
              errorData.message ||
              errorData.error ||
              `HTTP ${response.status}`;
          }
        } catch (parseError) {
          console.log("Could not parse error response");
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        console.log("Login failed with API:", errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.log(
        "API not available, falling back to mock data for login"
      );
      console.log("Error details:", error.message);

      // Fallback: Sử dụng mock data khi API không khả dụng
      const user = MOCK_USERS.find(
        (u) =>
          u.email === emailOrPhone || u.phone_number === emailOrPhone
      );

      if (user && user.password === password) {
        // Tạo mock token
        const mockToken = `mock_token_${user.id}_${Date.now()}`;
        await this.saveUser(user);
        await this.saveToken(mockToken);
        console.log("Login successful with mock data");
        return { success: true, user: user };
      } else {
        return {
          success: false,
          error: "Email/Số điện thoại hoặc mật khẩu không đúng!",
        };
      }
    }
  }

  // Đăng ký tài khoản mới
  async register(userData) {
    try {
      console.log("Attempting to register with real API...");
      console.log("Register data:", userData);

      // Sử dụng endpoint đăng ký customer
      const endpoint = AUTH_ENDPOINTS.REGISTER_CUSTOMER;
      console.log("Register endpoint:", endpoint);

      const response = await this.fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Registration successful with real API");
        console.log("Response data:", data);

        // Kiểm tra format response - xử lý format mới từ backend
        if (data.account && data.message) {
          // Format: {"account": {...}, "message": "..."}
          const user = {
            id: data.account.accountID,
            full_name: data.account.fullName,
            phone_number: data.account.phoneNumber,
            email: data.account.email,
            avatar_url: data.account.avatarUrl,
            role_id: data.account.roleID,
            create_at: data.account.createAt,
            deleted_at: data.account.deletedAt,
            status: data.account.status,
          };

          // Log role information
          const roleName = RoleService.getRoleName(user.role_id);
          console.log(
            `User registered with role: ${roleName} (ID: ${user.role_id})`
          );

          // Tạo token tạm thời (backend có thể không trả về token)
          const tempToken = `temp_token_${user.id}_${Date.now()}`;
          await this.saveUser(user);
          await this.saveToken(tempToken);
          return { success: true, user: user };
        } else if (data.user && data.token) {
          // Format cũ: {"user": {...}, "token": "..."}
          const roleName = RoleService.getRoleName(data.user.role_id);
          console.log(
            `User logged in with role: ${roleName} (ID: ${data.user.role_id})`
          );

          await this.saveUser(data.user);
          await this.saveToken(data.token);
          return { success: true, user: data.user };
        } else if (data.account && data.token) {
          // Format khác: {"account": {...}, "token": "..."}
          const roleName = RoleService.getRoleName(
            data.account.role_id
          );
          console.log(
            `User logged in with role: ${roleName} (ID: ${data.account.role_id})`
          );

          await this.saveUser(data.account);
          await this.saveToken(data.token);
          return { success: true, user: data.account };
        } else if (data.id && data.email) {
          // Format trực tiếp: user object
          const roleName = RoleService.getRoleName(data.role_id);
          console.log(
            `User logged in with role: ${roleName} (ID: ${data.role_id})`
          );

          await this.saveUser(data);
          await this.saveToken(data.token || "temp_token");
          return { success: true, user: data };
        } else {
          console.log("Invalid response format:", data);
          return {
            success: false,
            error: "Invalid response format from server",
          };
        }
      } else {
        let errorMessage = "Registration failed";
        try {
          const errorData = await response.json();
          console.log("Error response data:", errorData);

          // Parse validation errors
          if (errorData.errors) {
            const errorFields = Object.keys(errorData.errors);
            const errorMessages = errorFields.map((field) =>
              errorData.errors[field].join(", ")
            );
            errorMessage = errorMessages.join("; ");
          } else {
            errorMessage =
              errorData.message ||
              errorData.error ||
              `HTTP ${response.status}`;
          }
        } catch (parseError) {
          console.log("Could not parse error response");
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        console.log("Registration failed with API:", errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.log(
        "API not available, falling back to mock data for registration"
      );
      console.log("Error details:", error.message);

      // Fallback: Tạo mock user khi API không khả dụng
      const newUser = {
        id: Date.now(),
        full_name: userData.fullName,
        phone_number: userData.phoneNumber,
        email: userData.email,
        password: userData.password,
        avatar_url: userData.avatarUrl || "",
        create_at: new Date().toISOString(),
        deleted_at: null,
        status: "active",
        role_id: 1, // Customer
      };

      // Tạo mock token
      const mockToken = `mock_token_${newUser.id}_${Date.now()}`;
      await this.saveUser(newUser);
      await this.saveToken(mockToken);

      console.log("Registration successful with mock data");
      return { success: true, user: newUser };
    }
  }

  // Cập nhật thông tin user
  async updateUser(userId, userData) {
    try {
      console.log("Attempting to update user with real API...");
      console.log("User data to update:", userData);

      const token = await this.getToken();

      // Kiểm tra role để sử dụng endpoint phù hợp
      if (userData.role_id === 2 || userData.roleID === 2) {
        // NursingSpecialist - sử dụng endpoint riêng
        console.log("Updating NursingSpecialist profile...");

        const nursingSpecialistData = {
          zoneID: userData.zoneID || 1,
          gender: userData.gender || "Nam",
          dateOfBirth:
            userData.dateOfBirth || new Date().toISOString(),
          fullName: userData.fullName || userData.full_name || "",
          address: userData.address || "",
          experience: userData.experience || "",
          slogan: userData.slogan || "",
          major: userData.major || "",
        };

        console.log(
          "NursingSpecialist update data:",
          nursingSpecialistData
        );

        const response = await this.fetchWithTimeout(
          AUTH_ENDPOINTS.UPDATE_NURSING_SPECIALIST(
            userData.nursingID || userId
          ),
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json-patch+json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(nursingSpecialistData),
          }
        );

        console.log(
          "NursingSpecialist update response status:",
          response.status
        );

        if (response.ok) {
          const data = await response.json();
          console.log(
            "NursingSpecialist update successful with real API"
          );
          console.log("Response data:", data);

          // Cập nhật user data với response mới
          const updatedUser = {
            ...userData,
            ...data.nursingSpecialist,
            // Map lại các field để phù hợp với app
            fullName: data.nursingSpecialist.fullName,
            full_name: data.nursingSpecialist.fullName,
            nursingID: data.nursingSpecialist.nursingID,
            accountID: data.nursingSpecialist.accountID,
            zoneID: data.nursingSpecialist.zoneID,
            gender: data.nursingSpecialist.gender,
            dateOfBirth: data.nursingSpecialist.dateOfBirth,
            address: data.nursingSpecialist.address,
            experience: data.nursingSpecialist.experience,
            slogan: data.nursingSpecialist.slogan,
            major: data.nursingSpecialist.major,
            status: data.nursingSpecialist.status,
          };

          await this.saveUser(updatedUser);
          return { success: true, user: updatedUser };
        } else {
          let errorMessage = "NursingSpecialist update failed";
          try {
            const errorData = await response.json();
            console.log("Error response data:", errorData);
            errorMessage =
              errorData.message ||
              errorData.error ||
              `HTTP ${response.status}`;
          } catch (parseError) {
            console.log("Could not parse error response");
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }

          console.log(
            "NursingSpecialist update failed with API:",
            errorMessage
          );
          return { success: false, error: errorMessage };
        }
      } else {
        // Customer hoặc role khác - sử dụng endpoint cũ
        console.log("Updating regular user profile...");

        const response = await this.fetchWithTimeout(
          AUTH_ENDPOINTS.UPDATE_ACCOUNT(userId),
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
          }
        );

        if (response.ok) {
          const updatedUser = await response.json();
          console.log("User update successful with real API");
          await this.saveUser(updatedUser);
          return { success: true, user: updatedUser };
        } else {
          const errorData = await response.json();
          console.log(
            "User update failed with API:",
            errorData.message
          );
          return { success: false, error: errorData.message };
        }
      }
    } catch (error) {
      console.log(
        "API not available, falling back to mock data for update"
      );
      console.log("Error details:", error.message);

      // Fallback: Cập nhật user trong mock data
      const currentUser = await this.getUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...userData };
        await this.saveUser(updatedUser);
        console.log("User update successful with mock data");
        return { success: true, user: updatedUser };
      } else {
        return {
          success: false,
          error: "Không thể cập nhật thông tin user",
        };
      }
    }
  }

  // Lấy thông tin user từ server
  async fetchUserProfile(userId) {
    try {
      console.log(
        "Attempting to fetch user profile with real API..."
      );

      const token = await this.getToken();
      const response = await this.fetchWithTimeout(
        AUTH_ENDPOINTS.GET_ACCOUNT_BY_ID(userId),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();
        console.log("User profile fetch successful with real API");
        await this.saveUser(userData);
        return { success: true, user: userData };
      } else {
        console.log("User profile fetch failed with API");
        return {
          success: false,
          error: "Không thể lấy thông tin user",
        };
      }
    } catch (error) {
      console.log(
        "API not available, falling back to mock data for profile"
      );

      // Fallback: Trả về user hiện tại từ storage
      const currentUser = await this.getUser();
      if (currentUser && currentUser.id === userId) {
        console.log("User profile fetch successful with mock data");
        return { success: true, user: currentUser };
      } else {
        return {
          success: false,
          error: "Không thể lấy thông tin user",
        };
      }
    }
  }

  // Lấy thông tin chi tiết của NursingSpecialist
  async fetchNursingSpecialistDetails(accountID) {
    try {
      console.log(
        "🔍 Fetching NursingSpecialist details for accountID:",
        accountID
      );

      // Trước tiên, lấy nursingID từ user data hiện tại
      const currentUser = await this.getUser();
      const nursingID = currentUser?.nursingID;

      if (!nursingID) {
        console.log(
          "🔍 No nursingID found, trying to get from getall endpoint"
        );
        // Fallback: sử dụng getall để tìm nursingID
        const token = await this.getToken();
        const response = await this.fetchWithTimeout(
          "http://localhost:5294/api/nursingspecialists/getall",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(
          "🔍 NursingSpecialist getall response status:",
          response.status
        );

        if (response.ok) {
          const data = await response.json();
          console.log("🔍 All NursingSpecialists:", data);

          // Tìm NursingSpecialist theo accountID
          const nursingSpecialist = data.find(
            (ns) => ns.accountID === accountID
          );

          if (nursingSpecialist) {
            console.log(
              "🔍 Found NursingSpecialist:",
              nursingSpecialist
            );
            return { success: true, data: nursingSpecialist };
          } else {
            console.log(
              "🔍 No NursingSpecialist found for accountID:",
              accountID
            );
            return {
              success: false,
              error: "Nursing specialist not found",
            };
          }
        } else {
          console.log(
            "🔍 NursingSpecialist getall failed:",
            response.status
          );
          return {
            success: false,
            error: "Failed to fetch nursing specialists",
          };
        }
      } else {
        // Có nursingID, lấy thông tin chi tiết
        const token = await this.getToken();
        const response = await this.fetchWithTimeout(
          `http://localhost:5294/api/nursingspecialists/get/${nursingID}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("🔍 NursingSpecialist details:", data);
          return { success: true, data: data };
        } else {
          console.log(
            "🔍 NursingSpecialist details fetch failed:",
            response.status
          );
          return {
            success: false,
            error: "Failed to fetch nursing specialist details",
          };
        }
      }
    } catch (error) {
      console.error(
        "🔍 Error fetching NursingSpecialist details:",
        error
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Enrich user data với thông tin chi tiết của NursingSpecialist
  async enrichNursingSpecialistData(userData) {
    try {
      console.log("🔍 ===== ENRICHING NURSING SPECIALIST DATA =====");
      console.log("🔍 Input userData:", userData);
      console.log("🔍 Input userData keys:", Object.keys(userData));

      // Nếu đã có đầy đủ thông tin thì không cần fetch
      if (userData.nursingID && userData.gender && userData.address) {
        console.log("🔍 NursingSpecialist data already complete");
        console.log(
          "🔍 Existing data - nursingID:",
          userData.nursingID,
          "gender:",
          userData.gender,
          "address:",
          userData.address
        );
        return userData;
      }

      console.log("🔍 Data incomplete, fetching from API...");
      console.log(
        "🔍 Missing fields - nursingID:",
        userData.nursingID,
        "gender:",
        userData.gender,
        "address:",
        userData.address
      );

      // Fetch thông tin chi tiết
      const result = await this.fetchNursingSpecialistDetails(
        userData.accountID
      );
      console.log("🔍 Fetch result:", result);

      if (result.success) {
        const nursingData = result.data;
        console.log("🔍 Nursing data from API:", nursingData);
        console.log(
          "🔍 Nursing data keys:",
          Object.keys(nursingData)
        );

        // Merge thông tin mới vào user data
        const enrichedUserData = {
          ...userData,
          nursingID: nursingData.nursingID,
          zoneID: nursingData.zoneID,
          gender: nursingData.gender,
          dateOfBirth: nursingData.dateOfBirth,
          fullName: userData.fullName || nursingData.fullName, // Ưu tiên fullName từ login
          address: nursingData.address,
          experience: nursingData.experience,
          slogan: nursingData.slogan,
          major: nursingData.major,
          status: nursingData.status,
        };

        console.log("🔍 Enriched user data:", enrichedUserData);
        console.log(
          "🔍 Enriched user data keys:",
          Object.keys(enrichedUserData)
        );

        // Lưu lại user data đã được enrich
        console.log("🔍 Saving enriched data to AsyncStorage...");
        await this.saveUser(enrichedUserData);
        console.log("🔍 Enriched data saved successfully");

        return enrichedUserData;
      } else {
        console.log(
          "🔍 Failed to enrich NursingSpecialist data:",
          result.error
        );
        return userData; // Trả về data cũ nếu không fetch được
      }
    } catch (error) {
      console.error(
        "🔍 Error enriching NursingSpecialist data:",
        error
      );
      return userData; // Trả về data cũ nếu có lỗi
    }
  }

  // Kiểm tra kết nối API
  async checkApiConnection() {
    try {
      console.log("Checking API connection...");
      const response = await this.fetchWithTimeout(
        AUTH_ENDPOINTS.GET_ALL_ACCOUNTS,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
        5000 // 5 second timeout for connection check
      );

      const isConnected = response.ok;
      console.log(
        "API connection status:",
        isConnected ? "Connected" : "Failed"
      );
      return isConnected;
    } catch (error) {
      console.log("API connection failed:", error.message);
      return false;
    }
  }

  // Test API endpoints
  async testApiEndpoints() {
    const endpoints = [
      { name: "Login", url: AUTH_ENDPOINTS.LOGIN, method: "POST" },
      {
        name: "Register Customer",
        url: AUTH_ENDPOINTS.REGISTER_CUSTOMER,
        method: "POST",
      },
      {
        name: "Get All Accounts",
        url: AUTH_ENDPOINTS.GET_ALL_ACCOUNTS,
        method: "GET",
      },
    ];

    console.log("Testing API endpoints...");

    for (const endpoint of endpoints) {
      try {
        const response = await this.fetchWithTimeout(
          endpoint.url,
          {
            method: endpoint.method,
            headers: { "Content-Type": "application/json" },
          },
          3000
        );

        console.log(
          `${endpoint.name}: ${response.status} ${response.statusText}`
        );
      } catch (error) {
        console.log(`${endpoint.name}: Failed - ${error.message}`);
      }
    }
  }
}

// Export singleton instance
export default new AuthService();
