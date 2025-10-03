import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
  const [shownNotifications, setShownNotifications] = useState(
    new Set()
  );
  const [realtimeNotification, setRealtimeNotification] =
    useState(null);

  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const pollingIntervalRef = useRef(null);
  const lastNotificationCountRef = useRef(0);

  useEffect(() => {
    // Check network status
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadUserData();
    loadShownNotifications();

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Start real-time polling when user data is loaded
  useEffect(() => {
    if (userData && isOnline) {
      startRealtimePolling();
    } else {
      stopRealtimePolling();
    }

    return () => stopRealtimePolling();
  }, [userData, isOnline]);

  const loadShownNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem("shownNotifications");
      if (stored) {
        setShownNotifications(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.log("Error loading shown notifications:", error);
    }
  };

  const saveShownNotifications = async (notificationIds) => {
    try {
      await AsyncStorage.setItem(
        "shownNotifications",
        JSON.stringify(Array.from(notificationIds))
      );
    } catch (error) {
      console.log("Error saving shown notifications:", error);
    }
  };

  const startRealtimePolling = () => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 10 seconds for new notifications
    pollingIntervalRef.current = setInterval(async () => {
      if (userData && isOnline) {
        await checkForNewNotifications();
      }
    }, 10000);
  };

  const stopRealtimePolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const checkForNewNotifications = async () => {
    try {
      const result =
        await NotificationService.getNotificationsByAccount(
          userData.accountID || userData.id
        );

      if (result.success) {
        const newNotifications = result.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Check if there are new notifications
        if (
          newNotifications.length > lastNotificationCountRef.current
        ) {
          const latestNotifications = newNotifications.slice(
            0,
            newNotifications.length - lastNotificationCountRef.current
          );

          // Show real-time notification for new unread notifications
          for (const notification of latestNotifications) {
            if (
              !notification.isRead &&
              !shownNotifications.has(notification.notificationID)
            ) {
              showRealtimeNotification(notification);
              break; // Only show one at a time
            }
          }
        }

        // Update the notifications list
        setNotifications(newNotifications);
        lastNotificationCountRef.current = newNotifications.length;
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const showRealtimeNotification = (notification) => {
    // Mark this notification as shown
    const newShownNotifications = new Set(shownNotifications);
    newShownNotifications.add(notification.notificationID);
    setShownNotifications(newShownNotifications);
    saveShownNotifications(newShownNotifications);

    // Set the notification to display
    setRealtimeNotification(notification);

    // Animate in
    Animated.sequence([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(4000), // Show for 4 seconds
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRealtimeNotification(null);
    });
  };

  const dismissRealtimeNotification = () => {
    Animated.timing(notificationOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setRealtimeNotification(null);
    });
  };

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      if (user) {
        setUserData(user);
        loadNotifications(user.accountID || user.id);
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

  const loadNotifications = async (accountID) => {
    try {
      setIsLoading(true);
      const result =
        await NotificationService.getNotificationsByAccount(
          accountID
        );

      if (result.success) {
        const sortedNotifications = result.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sortedNotifications);
        lastNotificationCountRef.current = sortedNotifications.length;
      }
    } catch (error) {
      // Silent catch
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
      // Silent
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

  const markAllAsRead = async () => {
    try {
      // Check if there are any unread notifications
      const unreadNotifications = notifications.filter(
        (n) => !n.isRead
      );
      if (unreadNotifications.length === 0) {
        Alert.alert("Thông báo", "Tất cả thông báo đã được đọc rồi!");
        return;
      }

      // Optimistically update UI first
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );

      // Trigger global notification update immediately
      if (global.notificationUpdate) {
        global.notificationUpdate();
      }

      // Update all notifications as read on server
      const unreadIds = unreadNotifications.map(
        (n) => n.notificationID
      );
      const results = await Promise.all(
        unreadIds.map((id) => NotificationService.markAsRead(id))
      );

      // Check if all updates were successful
      const failedUpdates = results.filter(
        (result) => !result.success
      );
      if (failedUpdates.length > 0) {
        Alert.alert(
          "Cảnh báo",
          "Một số thông báo không thể đánh dấu đã đọc. Vui lòng thử lại."
        );

        // Reload notifications to get accurate state
        if (userData) {
          await loadNotifications(userData.accountID || userData.id);
        }
      } else {
        Alert.alert(
          "Thành công",
          "Đã đánh dấu tất cả thông báo là đã đọc!"
        );
      }
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể đánh dấu tất cả thông báo. Vui lòng thử lại."
      );

      // Reload notifications to get accurate state
      if (userData) {
        await loadNotifications(userData.accountID || userData.id);
      }
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
              color={item.isRead ? "#95A5A6" : "#3498DB"}
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

  const renderRealtimeNotification = () => {
    if (!realtimeNotification) return null;

    return (
      <Animated.View
        style={[
          styles.realtimeNotification,
          {
            opacity: notificationOpacity,
            transform: [
              {
                translateY: notificationOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              },
            ],
          },
        ]}>
        <TouchableOpacity
          style={styles.realtimeNotificationContent}
          onPress={dismissRealtimeNotification}
          activeOpacity={0.9}>
          <View style={styles.realtimeNotificationHeader}>
            <Ionicons
              name="notifications"
              size={20}
              color="#3498DB"
            />
            <Text style={styles.realtimeNotificationTitle}>
              Thông báo mới
            </Text>
            <TouchableOpacity onPress={dismissRealtimeNotification}>
              <Ionicons name="close" size={20} color="#7F8C8D" />
            </TouchableOpacity>
          </View>
          <Text
            style={styles.realtimeNotificationMessage}
            numberOfLines={2}>
            {realtimeNotification.message}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
      {/* Real-time Notification Overlay */}
      {renderRealtimeNotification()}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}>
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

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllButton}>
            <Ionicons
              name="checkmark-done"
              size={24}
              color="#4CAF50"
            />
            <Text style={styles.markAllText}>Đã đọc</Text>
          </TouchableOpacity>
        </View>
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
  headerButton: {
    padding: 4,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  markAllButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  offlineText: {
    color: "#E74C3C",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  markAllText: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  realtimeNotification: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 10,
  },
  realtimeNotificationContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3498DB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  realtimeNotificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  realtimeNotificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 8,
  },
  realtimeNotificationMessage: {
    fontSize: 14,
    color: "#34495E",
    lineHeight: 20,
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
