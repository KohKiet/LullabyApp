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
import NotificationService from "../../services/notificationService";
import WalletService from "../../services/walletService";

export default function WalletScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    loadUserData();
    checkUnreadNotifications();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      if (user) {
        setUserData(user);
        loadWalletData(user.accountID || user.id);
      } else {
        Alert.alert(
          "Thông báo",
          "Không tìm thấy thông tin người dùng"
        );
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Thông báo", "Không thể tải thông tin người dùng");
      setIsLoading(false);
    }
  };

  const loadWalletData = async (accountID) => {
    try {
      const result = await WalletService.getWalletByAccount(
        accountID
      );
      if (result.success) {
        setWalletData(result.data);
      } else {
        console.error("Failed to load wallet data:", result.error);
      }
    } catch (error) {
      console.error("Error loading wallet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUnreadNotifications = async () => {
    try {
      if (userData?.accountID) {
        const result =
          await NotificationService.getNotificationsByAccount(
            userData.accountID
          );
        if (result.success) {
          const unread = result.data.filter((n) => !n.isRead);
          setUnreadNotifications(unread.length);

          // Show notification for the latest unread message
          if (unread.length > 0) {
            const latest = unread[0];
            global.__notify?.({
              title: "Thông báo mới",
              message: latest.message,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#E8F5E8", "#E3F2FD", "#F3E5F5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#E8F5E8", "#E3F2FD", "#F3E5F5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ví tiền</Text>
        <TouchableOpacity
          onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text style={styles.balanceAmount}>
            {walletData?.balance?.toLocaleString() || "0"} VNĐ
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/wallet/history")}>
            <Ionicons name="time" size={24} color="#3498DB" />
            <Text style={styles.actionText}>Lịch sử giao dịch</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 16,
    color: "#7F8C8D",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  actionsContainer: {
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 3,
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#2C3E50",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#2C3E50",
    fontWeight: "500",
  },
});
