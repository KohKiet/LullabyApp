import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import AuthService from "../../services/authService";

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleLoginModal, setShowGoogleLoginModal] =
    useState(false);
  const [googleLoginUrl, setGoogleLoginUrl] = useState("");

  // Cấu hình Google OAuth với WebView
  React.useEffect(() => {
    console.log("🔧 Using WebView for Google OAuth");
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);

      // Tạo Google OAuth URL
      const clientId =
        "914225695260-t75aaj3aulcfaa5fgvddflvrr9uk5elk.apps.googleusercontent.com";
      const redirectUri = encodeURIComponent(
        "https://auth.expo.io/@migitbarbarian/LullabyApp"
      );
      const scope = encodeURIComponent("openid profile email");

      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=code&` +
        `scope=${scope}&` +
        `access_type=offline&` +
        `prompt=consent`;

      console.log("🔗 Google OAuth URL:", googleAuthUrl);

      // Mở WebView với Google login
      setGoogleLoginUrl(googleAuthUrl);
      setShowGoogleLoginModal(true);
    } catch (error) {
      console.error("❌ Google login error:", error);
      Alert.alert("Lỗi", "Không thể mở Google đăng nhập");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPhoneLogin = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setIsLoading(true);

    try {
      // Sử dụng AuthService để đăng nhập
      const result = await AuthService.loginWithCredentials(
        emailOrPhone,
        password
      );

      if (result.success) {
        const user = result.user;
        console.log(
          "Login successful, user role:",
          user.role_id || user.roleID
        );

        // Chuyển hướng dựa trên role
        let targetRoute = "/";

        if (user.role_id === 2 || user.roleID === 2) {
          // NursingSpecialist - chuyển đến trang chủ
          targetRoute = "/";
        } else if (user.role_id === 1 || user.roleID === 1) {
          // Admin - chuyển đến trang admin
          targetRoute = "/admin";
        } else if (user.role_id === 3 || user.roleID === 3) {
          // Manager - chuyển đến trang manager
          targetRoute = "/manager";
        } else {
          // Customer - chuyển đến trang chủ
          targetRoute = "/";
        }

        console.log(`Redirecting to: ${targetRoute}`);

        // Chuyển thẳng đến trang đích, không hiển thị alert
        router.replace(targetRoute);
      } else {
        Alert.alert(
          "Lỗi",
          result.error ||
            "Email/Số điện thoại hoặc mật khẩu không đúng!"
        );
      }
    } catch (error) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi đăng nhập!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuthSuccess = async (url) => {
    try {
      const code = url.match(/code=([^&]*)/)[1];
      const tokenResponse =
        await AuthService.exchangeGoogleCodeForToken(code);

      if (tokenResponse.success) {
        const user = tokenResponse.user;
        console.log("Google OAuth successful, user:", user);

        // Lưu thông tin đăng nhập vào AsyncStorage
        await AuthService.saveAuthTokens(tokenResponse.tokens);

        // Chuyển hướng dựa trên role
        let targetRoute = "/";
        if (user.role_id === 2 || user.roleID === 2) {
          targetRoute = "/";
        } else if (user.role_id === 1 || user.roleID === 1) {
          targetRoute = "/admin";
        } else if (user.role_id === 3 || user.roleID === 3) {
          targetRoute = "/manager";
        } else {
          targetRoute = "/";
        }
        console.log(`Redirecting to: ${targetRoute}`);
        router.replace(targetRoute);
      } else {
        Alert.alert(
          "Lỗi",
          "Đăng nhập Google thất bại: " + tokenResponse.error
        );
      }
    } catch (error) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi xử lý đăng nhập Google!");
    }
  };

  return (
    <LinearGradient
      colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>
            Chào mừng bạn quay trở lại!
          </Text>
        </View>

        <View style={styles.loginCard}>
          {/* Google Login */}
          <TouchableOpacity
            style={styles.googleButton}
            disabled={isLoading}
            onPress={handleGoogleLogin}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.googleButtonText}>
              Đăng nhập với Google
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email/Phone Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="person"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Email/Số điện thoại"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              contextMenuHidden={false}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              contextMenuHidden={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              disabled={isLoading}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleEmailPhoneLogin}
            disabled={isLoading}>
            <Text style={styles.loginButtonText}>
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Chưa có tài khoản?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/register")}
              disabled={isLoading}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Google Login WebView Modal */}
      <Modal
        visible={showGoogleLoginModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              style={styles.webViewBackButton}
              onPress={() => setShowGoogleLoginModal(false)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Đăng nhập Google</Text>
            <TouchableOpacity
              style={styles.webViewCloseButton}
              onPress={() => setShowGoogleLoginModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <WebView
            source={{ uri: googleLoginUrl }}
            style={styles.webView}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <Text style={styles.webViewLoadingText}>
                  Đang tải Google đăng nhập...
                </Text>
              </View>
            )}
            onNavigationStateChange={(navState) => {
              console.log("Google login navigation:", navState.url);

              // Kiểm tra nếu user đã đăng nhập thành công và được redirect
              if (
                navState.url.includes("auth.expo.io") &&
                navState.url.includes("code=")
              ) {
                console.log("✅ Google OAuth success, code received");

                // Đóng WebView
                setShowGoogleLoginModal(false);

                // Xử lý OAuth code
                handleGoogleOAuthSuccess(navState.url);
              }
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView error:", nativeEvent);
              Alert.alert(
                "Lỗi tải Google đăng nhập",
                "Không thể tải trang đăng nhập. Vui lòng thử lại.",
                [
                  {
                    text: "Thử lại",
                    onPress: () => {
                      // Reload WebView
                      setGoogleLoginUrl(googleLoginUrl);
                    },
                  },
                  {
                    text: "Đóng",
                    style: "cancel",
                    onPress: () => setShowGoogleLoginModal(false),
                  },
                ]
              );
            }}
          />
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  loginCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 10,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#666",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: "#4FC3F7",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: "#ccc",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "#4FC3F7",
    fontSize: 14,
    fontWeight: "bold",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  webViewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  webViewBackButton: {
    padding: 5,
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  webViewCloseButton: {
    padding: 5,
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  webViewLoadingText: {
    fontSize: 16,
    color: "#666",
  },
});
