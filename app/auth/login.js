import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ApiStatusIndicator from "../../components/ApiStatusIndicator";
import ApiTester from "../../components/ApiTester";
import AuthService from "../../services/authService";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiTester, setShowApiTester] = useState(false);

  // Cấu hình Google OAuth với expo-auth-session
  React.useEffect(() => {
    console.log("🔧 Using expo-auth-session for Google OAuth");
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    // Sử dụng iOS Client ID cho tất cả platforms để đồng nhất
    expoClientId:
      "914225695260-t75aaj3aulcfaa5fgvddflvrr9uk5elk.apps.googleusercontent.com",
    iosClientId:
      "914225695260-t75aaj3aulcfaa5fgvddflvrr9uk5elk.apps.googleusercontent.com",
    androidClientId:
      "914225695260-t75aaj3aulcfaa5fgvddflvrr9uk5elk.apps.googleusercontent.com",
    webClientId:
      "914225695260-t75aaj3aulcfaa5fgvddflvrr9uk5elk.apps.googleusercontent.com",
    scopes: ["openid", "profile", "email"],
    // Sử dụng Expo proxy URI
    redirectUri: AuthSession.makeRedirectUri({
      useProxy: true,
      scheme: "lullabyapp",
    }),
  });

  // Xử lý response từ Google OAuth
  React.useEffect(() => {
    if (response?.type === "success") {
      console.log(
        "✅ Google OAuth success, authentication:",
        response.authentication
      );
      const { authentication } = response;
      fetchUserInfo(authentication.accessToken);
    } else if (response?.type === "error") {
      console.log("❌ Google OAuth error:", response.error);
      Alert.alert(
        "Lỗi đăng nhập Google",
        response.error?.message || "Có lỗi xảy ra"
      );
    } else if (response?.type === "cancel") {
      console.log("🚫 Google OAuth cancelled by user");
    }
  }, [response]);

  const fetchUserInfo = async (accessToken) => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const user = await response.json();
      const fullName = user.name || user.given_name || "Google User";
      const email = user.email;

      if (!email) {
        Alert.alert("Lỗi", "Không lấy được email từ Google");
        return;
      }

      // Đăng nhập với backend
      const result = await AuthService.loginWithGoogle(
        fullName,
        email
      );

      if (result.success) {
        console.log("✅ Backend login success, redirecting to home");
        router.replace("/");
      } else {
        Alert.alert(
          "Đăng nhập thất bại",
          result.error || "Không thể đăng nhập bằng Google"
        );
      }
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lấy thông tin Google user");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log("🚀 Starting Google OAuth...");
      console.log(
        "🔑 Using Client ID:",
        "914225695260-t75aaj3aulcfaa5fgvddflvrr9uk5elk.apps.googleusercontent.com"
      );
      console.log("🌐 Using proxy:", true);

      // Sử dụng Expo proxy để tránh cấu hình redirect URI
      await promptAsync({ useProxy: true });
    } catch (error) {
      console.log("💥 Google OAuth error:", error);
      Alert.alert("Lỗi", "Không thể khởi tạo đăng nhập Google");
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

        {/* API Status Indicator - chỉ hiển thị trong development */}
        {__DEV__ && (
          <>
            <ApiStatusIndicator />

            {/* Toggle API Tester */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowApiTester(!showApiTester)}>
              <Text style={styles.toggleButtonText}>
                {showApiTester
                  ? "Hide API Tester"
                  : "Show API Tester"}
              </Text>
            </TouchableOpacity>

            {/* API Tester */}
            {showApiTester && <ApiTester />}
          </>
        )}

        <View style={styles.loginCard}>
          {/* Google Login */}
          <TouchableOpacity
            style={styles.googleButton}
            disabled={!request || isLoading}
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
  toggleButton: {
    backgroundColor: "#FF9800",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "center",
    marginBottom: 10,
  },
  toggleButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
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
});
