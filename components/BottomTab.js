import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AuthService from "../services/authService";
import NotificationService from "../services/notificationService";

export default function BottomTab() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadUserData();

    // Listen for notification count updates
    const handleNotificationUpdate = () => {
      loadNotificationCount();
    };

    // Add global event listener
    global.notificationUpdate = handleNotificationUpdate;

    return () => {
      global.notificationUpdate = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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

      // Auto-refresh notification count every 30 seconds
      intervalRef.current = setInterval(loadNotificationCount, 30000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      if (user) {
        setUserData(user);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadNotificationCount = async () => {
    try {
      if (userData && (userData.accountID || userData.id)) {
        const accountID = userData.accountID || userData.id;
        const result = await NotificationService.getUnreadCount(
          accountID
        );

        if (result.success) {
          setUnreadCount(result.count);
        } else {
          console.error(
            "Error loading notification count:",
            result.error
          );
          // Don't reset to 0 on API error, keep previous count
        }
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error loading notification count:", error);
      // Don't reset to 0 on network error, keep previous count
    }
  };

  const handleProfilePress = async () => {
    try {
      const user = await AuthService.getUserData();
      if (user) {
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
