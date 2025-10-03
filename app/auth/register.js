import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import AuthService from "../../services/authService";

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const getPasswordIssues = (value) => {
    const issues = [];
    if (!value || value.length < 8) {
      issues.push("ít nhất 8 ký tự");
    }
    if (!/[A-Z]/.test(value)) {
      issues.push("ít nhất 1 chữ cái in hoa");
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~]/.test(value)) {
      issues.push("ít nhất 1 ký tự đặc biệt (!@#$%^&*...)");
    }
    return issues;
  };

  const validateForm = () => {
    const newErrors = {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    };

    // Full name
    if (!fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
    }

    // Email
    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = "Email không hợp lệ";
      }
    }

    // Phone number (basic check: digits, 9-11 length)
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Vui lòng nhập số điện thoại";
    } else {
      const phoneDigits = phoneNumber.replace(/\D/g, "");
      if (phoneDigits.length < 9 || phoneDigits.length > 11) {
        newErrors.phoneNumber = "Số điện thoại không hợp lệ";
      }
    }

    // Password strength
    const pwIssues = getPasswordIssues(password);
    if (pwIssues.length > 0) {
      newErrors.password = `Mật khẩu cần: ${pwIssues.join(", ")}`;
    }

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng nhập xác nhận mật khẩu";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((msg) => msg);
  };

  const handleEmailRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const userData = {
        fullName: fullName,
        phoneNumber: phoneNumber,
        email: email,
        password: password,
        avatarUrl: "", // Có thể để trống hoặc thêm chức năng upload avatar sau
      };

      // Sử dụng AuthService để đăng ký
      const result = await AuthService.register(userData);

      if (result.success) {
        // Thông báo thành công và tự động đăng nhập
        Alert.alert("Thông báo", "Tạo tài khoản thành công", [
          {
            text: "OK",
            onPress: async () => {
              const login = await AuthService.loginWithCredentials(
                email,
                password
              );
              if (login.success) {
                router.replace("/");
              } else {
                Alert.alert(
                  "Thông báo",
                  login.error ||
                    "Đăng nhập tự động thất bại. Vui lòng đăng nhập lại."
                );
                router.replace("/auth/login");
              }
            },
          },
        ]);
      } else {
        Alert.alert(
          "Thông báo",
          result.error || "Không thể đăng ký!"
        );
      }
    } catch (error) {
      Alert.alert("Thông báo", "Có lỗi xảy ra khi đăng ký!");
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
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>
            Tạo tài khoản mới để bắt đầu
          </Text>
        </View>

        <View style={styles.registerCard}>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="person"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput]}
              placeholder="Họ và tên"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (errors.fullName) {
                  setErrors((e) => ({ ...e, fullName: "" }));
                }
              }}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>
          {errors.fullName ? (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput]}
              placeholder="Email"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) {
                  setErrors((e) => ({ ...e, email: "" }));
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="call"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput]}
              placeholder="Số điện thoại"
              value={phoneNumber}
              onChangeText={(t) => {
                setPhoneNumber(t);
                if (errors.phoneNumber) {
                  setErrors((e) => ({ ...e, phoneNumber: "" }));
                }
              }}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>
          {errors.phoneNumber ? (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          ) : null}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput]}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                const pwIssues = getPasswordIssues(t);
                setErrors((e) => ({
                  ...e,
                  password:
                    pwIssues.length > 0
                      ? `Mật khẩu cần: ${pwIssues.join(", ")}`
                      : "",
                  // Live update confirm error when user changes password
                  confirmPassword:
                    confirmPassword && t !== confirmPassword
                      ? "Mật khẩu xác nhận không khớp"
                      : "",
                }));
              }}
              secureTextEntry={!showPassword}
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

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput]}
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setErrors((e) => ({
                  ...e,
                  confirmPassword:
                    t && t !== password
                      ? "Mật khẩu xác nhận không khớp"
                      : "",
                }));
              }}
              secureTextEntry={!showConfirmPassword}
              editable={!isLoading}
            />
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>
                {errors.confirmPassword}
              </Text>
            ) : null}
            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              style={styles.eyeIcon}
              disabled={isLoading}>
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              (isLoading ||
                getPasswordIssues(password).length > 0 ||
                !confirmPassword ||
                confirmPassword !== password) &&
                styles.registerButtonDisabled,
            ]}
            onPress={handleEmailRegister}
            disabled={
              isLoading ||
              getPasswordIssues(password).length > 0 ||
              !confirmPassword ||
              confirmPassword !== password
            }>
            <Text style={styles.registerButtonText}>
              {isLoading ? "Đang đăng ký..." : "Đăng ký"}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              disabled={isLoading}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
  registerCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
  registerButton: {
    backgroundColor: "#4FC3F7",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: "#ccc",
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#4FC3F7",
    fontSize: 14,
    fontWeight: "bold",
  },
  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 6,
  },
});
