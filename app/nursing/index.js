import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AuthService from "../../services/authService";
import RoleService from "../../services/roleService";

export default function NursingScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      console.log("Loading nursing specialist data...");

      const user = await AuthService.getUser();
      console.log("Nursing specialist data loaded:", user);

      if (user) {
        // Kiểm tra xem user có phải là NursingSpecialist không
        const isNursingSpecialist =
          user.role_id === 2 || user.roleID === 2;
        if (!isNursingSpecialist) {
          Alert.alert("Lỗi", "Bạn không có quyền truy cập trang này");
          router.replace("/");
          return;
        }

        // Enrich data với thông tin chi tiết
        console.log(
          "🔍 Enriching NursingSpecialist data for nursing screen..."
        );
        const enrichedUser =
          await AuthService.enrichNursingSpecialistData(user);
        console.log(
          "🔍 Enriched user data for nursing screen:",
          enrichedUser
        );

        setUserData(enrichedUser);

        // Log role information
        const roleName =
          enrichedUser.roleName ||
          RoleService.getRoleName(
            enrichedUser.role_id || enrichedUser.roleID
          );
        const displayName = RoleService.getDisplayName(roleName);
        console.log(
          `Nursing Specialist: ${roleName} (${displayName}) - ID: ${
            enrichedUser.role_id || enrichedUser.roleID
          }`
        );
      } else {
        console.log("No user data found");
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error("Error loading nursing specialist data:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Nursing specialist logging out...");
      await AuthService.logout();
      router.replace("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Lỗi", "Không thể đăng xuất");
    }
  };

  const navigateToProfile = () => {
    router.push("/profile");
  };

  const navigateToServices = () => {
    // TODO: Navigate to services management
    Alert.alert(
      "Thông báo",
      "Chức năng quản lý dịch vụ sẽ được phát triển sau"
    );
  };

  const navigateToSchedule = () => {
    // TODO: Navigate to work schedule
    Alert.alert(
      "Thông báo",
      "Chức năng lịch làm việc sẽ được phát triển sau"
    );
  };

  const navigateToPatients = () => {
    // TODO: Navigate to patient management
    Alert.alert(
      "Thông báo",
      "Chức năng quản lý bệnh nhân sẽ được phát triển sau"
    );
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!userData) {
    return (
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Không tìm thấy thông tin người dùng
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Điều dưỡng viên</Text>
          <Text style={styles.headerSubtitle}>
            Chào mừng, {userData.fullName || userData.full_name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={navigateToProfile}
          style={styles.profileButton}>
          <Ionicons name="person-circle" size={40} color="#4FC3F7" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <Ionicons name="person" size={24} color="#4FC3F7" />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {userData.fullName || userData.full_name}
              </Text>
              <Text style={styles.userRole}>
                {RoleService.getDisplayName(
                  userData.roleName ||
                    RoleService.getRoleName(
                      userData.role_id || userData.roleID
                    )
                )}
              </Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Lịch hẹn hôm nay</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#FF9800" />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>
              Bệnh nhân đang chăm sóc
            </Text>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Quản lý</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={navigateToServices}>
            <Ionicons name="medical" size={24} color="#4FC3F7" />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>
                Dịch vụ của tôi
              </Text>
              <Text style={styles.menuItemSubtitle}>
                Quản lý các dịch vụ điều dưỡng
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={navigateToSchedule}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#4CAF50"
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Lịch làm việc</Text>
              <Text style={styles.menuItemSubtitle}>
                Xem và quản lý lịch trình
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={navigateToPatients}>
            <Ionicons
              name="people-outline"
              size={24}
              color="#FF9800"
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Bệnh nhân</Text>
              <Text style={styles.menuItemSubtitle}>
                Quản lý danh sách bệnh nhân
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={navigateToProfile}>
            <Ionicons
              name="settings-outline"
              size={24}
              color="#9C27B0"
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Hồ sơ cá nhân</Text>
              <Text style={styles.menuItemSubtitle}>
                Cập nhật thông tin cá nhân
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  profileButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  userRole: {
    fontSize: 14,
    color: "#4FC3F7",
    fontWeight: "500",
    marginTop: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  menuContainer: {
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 15,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
