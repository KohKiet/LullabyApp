import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotificationsScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload data khi screen được focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("user");
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
        loadNotifications(user.id);
      } else {
        // Nếu chưa đăng nhập, chuyển về login
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      router.replace("/auth/login");
    }
  };

  const loadNotifications = async (userId) => {
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

      // Filter notifications cho user hiện tại
      const userNotifications = mockNotifications.filter(
        (notification) => notification.accountId === userId
      );

      // Sắp xếp theo thời gian mới nhất trước
      const sortedNotifications = userNotifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Trong thực tế sẽ gọi API để update trạng thái
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.notificationId === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "Vừa xong";
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadCard,
      ]}
      onPress={() => markAsRead(item.notificationId)}>
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="notifications"
            size={20}
            color={item.isRead ? "#666" : "#4FC3F7"}
          />
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.timeText}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      <Text
        style={[
          styles.messageText,
          !item.isRead && styles.unreadMessage,
        ]}>
        {item.message}
      </Text>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <LinearGradient
      colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}>
      <View style={styles.headerWrapper}>
        <TouchableOpacity
          style={styles.backBtnOuter}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#4FC3F7" />
        </TouchableOpacity>
        <LinearGradient
          colors={["#F8F9FA", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBox}>
          <Text style={styles.headerText}>Thông Báo</Text>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {notifications.length}
            </Text>
            <Text style={styles.statLabel}>Tổng số</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#FF6B6B" }]}>
              {unreadCount}
            </Text>
            <Text style={styles.statLabel}>Chưa đọc</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#4CAF50" }]}>
              {notifications.length - unreadCount}
            </Text>
            <Text style={styles.statLabel}>Đã đọc</Text>
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off"
              size={80}
              color="#CCC"
            />
            <Text style={styles.emptyText}>
              Chưa có thông báo nào
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.notificationId.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtnOuter: {
    marginRight: 15,
  },
  headerBox: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#333333",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
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
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#4FC3F7",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4FC3F7",
    marginLeft: 8,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  unreadMessage: {
    fontWeight: "600",
  },
});
