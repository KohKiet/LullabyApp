import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BottomTab() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload user data và notification count khi screen được focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      loadNotificationCount();
    }, [])
  );

  // Thêm useEffect để load notification count khi userData thay đổi
  useEffect(() => {
    if (userData) {
      loadNotificationCount();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("user");
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadNotificationCount = async () => {
    try {
      // Mock data - trong thực tế sẽ gọi API
      const mockNotifications = [
        {
          notificationId: 1,
          accountId: 1,
          message: "Bạn có lịch hẹn mới vào ngày mai",
          createdAt: "2024-01-01T00:00:00Z",
          isRead: false,
        },
        {
          notificationId: 2,
          accountId: 1,
          message: "Lịch hẹn của bạn đã được xác nhận",
          createdAt: "2024-01-02T10:30:00Z",
          isRead: false,
        },
        {
          notificationId: 3,
          accountId: 1,
          message: "Cập nhật thông tin profile của bạn",
          createdAt: "2024-01-04T14:20:00Z",
          isRead: false,
        },
        {
          notificationId: 4,
          accountId: 2,
          message: "Bạn có lịch làm việc mới được giao",
          createdAt: "2024-01-03T08:15:00Z",
          isRead: true,
        },
        {
          notificationId: 5,
          accountId: 2,
          message: "Lịch hẹn với khách hàng đã hoàn thành",
          createdAt: "2024-01-05T16:45:00Z",
          isRead: false,
        },
        {
          notificationId: 6,
          accountId: 3,
          message: "Bạn có tin nhắn mới từ khách hàng",
          createdAt: "2024-01-06T09:30:00Z",
          isRead: false,
        },
        {
          notificationId: 7,
          accountId: 4,
          message: "Lịch hẹn mới được đặt cho bạn",
          createdAt: "2024-01-07T11:15:00Z",
          isRead: false,
        },
        {
          notificationId: 8,
          accountId: 4,
          message: "Cập nhật lịch làm việc tuần tới",
          createdAt: "2024-01-08T16:45:00Z",
          isRead: false,
        },
      ];

      if (userData && userData.id) {
        // Đếm số notification chưa đọc cho user hiện tại
        const userNotifications = mockNotifications.filter(
          (notification) =>
            notification.accountId === userData.id &&
            !notification.isRead
        );
        setUnreadCount(userNotifications.length);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      setUnreadCount(0);
    }
  };

  const handleProfilePress = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("user");
      if (userDataString) {
        router.push("/profile");
      } else {
        router.push("/auth/login");
      }
    } catch (error) {
      router.push("/auth/login");
    }
  };

  const handleNotificationPress = () => {
    // Chuyển đến trang notification
    router.push("/notifications");
  };

  return (
    <LinearGradient
      colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="home" size={24} color="#FFFFFF" />
        <View style={styles.activeIndicator} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={handleNotificationPress}>
        <View style={styles.notificationContainer}>
          <Ionicons name="notifications" size={24} color="#FFFFFF" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={handleProfilePress}>
        <Ionicons name="person" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 15,
    paddingBottom: 25,
  },
  navItem: {
    alignItems: "center",
    position: "relative",
  },
  activeIndicator: {
    width: 20,
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
    marginTop: 5,
  },
  notificationContainer: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -8,
    right: -10,
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  notificationCount: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
});
