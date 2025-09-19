import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SimpleNotification = () => {
  const [notification, setNotification] = useState(null);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // Set up global notification function
    global.__notify = (payload) => {
      try {
        const { title, message, onPress, ...rest } = payload || {};
        showNotification({
          title: title || "Thông báo",
          message: message || "",
          onPress,
          ...rest,
        });
      } catch (e) {
        console.error("Notification error:", e);
      }
    };

    return () => {
      delete global.__notify;
    };
  }, []);

  const showNotification = (data) => {
    setNotification(data);

    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Auto hide after 4 seconds
    setTimeout(() => {
      hideNotification();
    }, 4000);
  };

  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotification(null);
    });
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={24} color="#3498DB" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message}>{notification.message}</Text>
        </View>
        <TouchableOpacity
          onPress={hideNotification}
          style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#7F8C8D" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#3498DB",
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#7F8C8D",
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
});

export default SimpleNotification;
