import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AuthService from "../../services/authService";
import NotificationService from "../../services/notificationService";

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check network status
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      if (user) {
        setUserData(user);
        loadNotifications(user.accountID || user.id);
      } else {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
      setIsLoading(false);
    }
  };

  const loadNotifications = async (accountID) => {
    try {
      setIsLoading(true);
      const result =
        await NotificationService.getNotificationsByAccount(
          accountID
        );

      if (result.success) {
        // Sort by createdAt (newest first)
        const sortedNotifications = result.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sortedNotifications);
      } else {
        console.error("Failed to load notifications:", result.error);
        // Show error but don't clear existing notifications
        if (notifications.length === 0) {
          Alert.alert(
            "Lỗi",
            result.error || "Không thể tải thông báo"
          );
        }
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      // Show error but don't clear existing notifications
      if (notifications.length === 0) {
        Alert.alert(
          "Lỗi",
          "Có lỗi xảy ra khi tải thông báo. Vui lòng thử lại."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (userData) {
        await loadNotifications(userData.accountID || userData.id);
      }
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationID) => {
    try {
      // Optimistically update UI first for better UX
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationID === notificationID
            ? { ...notif, isRead: true }
            : notif
        )
      );

      // Trigger global notification update immediately
      if (global.notificationUpdate) {
        global.notificationUpdate();
      }

      // Update on server using real API
      const result = await NotificationService.markAsRead(
        notificationID
      );

      if (!result.success) {
        console.error(
          "Failed to mark notification as read:",
          result.error
        );
        // Revert optimistic update if API fails
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.notificationID === notificationID
              ? { ...notif, isRead: false }
              : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Revert optimistic update if there's an error
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationID === notificationID
            ? { ...notif, isRead: false }
            : notif
        )
      );
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => markAsRead(item.notificationID)}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons
              name="notifications"
              size={24}
              color={item.isRead ? "#FFFFFF" : "#3498DB"}
            />
          </View>
          <View style={styles.notificationInfo}>
            <Text
              style={[
                styles.notificationMessage,
                !item.isRead && styles.unreadMessage,
              ]}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>
              {NotificationService.formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        {!item.isRead && (
          <View style={styles.unreadIndicator}>
            <View style={styles.unreadDot} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        Không có thông báo nào
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Bạn sẽ nhận được thông báo khi có cập nhật mới
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#E8F5E8", "#E3F2FD", "#F3E5F5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Đang tải thông báo...
          </Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Thông Báo</Text>
          {!isOnline && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="wifi-off" size={14} color="#FF6B6B" />
              <Text style={styles.offlineText}>Ngoại tuyến</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.notificationID.toString()}
        contentContainerStyle={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3498DB"]}
            tintColor="#3498DB"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  offlineText: {
    color: "#E74C3C",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  notificationsList: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E8F4FD",
  },
  unreadNotification: {
    borderColor: "#3498DB",
    borderWidth: 2,
    backgroundColor: "#F8FBFF",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 15,
    color: "#2C3E50",
    lineHeight: 20,
    marginBottom: 6,
    fontWeight: "400",
  },
  unreadMessage: {
    fontWeight: "600",
    color: "#1A252F",
  },
  notificationTime: {
    fontSize: 13,
    color: "#7F8C8D",
    fontStyle: "italic",
    fontWeight: "500",
  },
  unreadIndicator: {
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3498DB",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#34495E",
    marginTop: 20,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#95A5A6",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
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
