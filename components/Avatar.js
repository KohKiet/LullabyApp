import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function Avatar({
  source,
  size = 60,
  name = "",
  style,
  fallbackType = "initials", // "initials" or "icon"
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getInitials = (fullName) => {
    if (!fullName) return "?";
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (name) => {
    const colors = [
      ["#4FC3F7", "#26C6DA"],
      ["#FF8AB3", "#FF6B9D"],
      ["#A8E6CF", "#8ED9C3"],
      ["#FFD93D", "#FFC107"],
      ["#FF9A9E", "#FECFEF"],
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const avatarStyle = [
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2 },
    style,
  ];

  // Nếu có source và chưa có lỗi, hiển thị hình ảnh
  if (source && !imageError) {
    return (
      <View style={avatarStyle}>
        <Image
          source={source}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        {imageLoading && (
          <View
            style={[
              styles.loadingOverlay,
              { width: size, height: size, borderRadius: size / 2 },
            ]}>
            <Ionicons name="refresh" size={size * 0.3} color="#666" />
          </View>
        )}
      </View>
    );
  }

  // Fallback: hiển thị initials hoặc icon
  if (fallbackType === "initials" && name) {
    const colors = getRandomColor(name);
    return (
      <LinearGradient
        colors={colors}
        style={avatarStyle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {getInitials(name)}
        </Text>
      </LinearGradient>
    );
  }

  // Fallback: hiển thị icon
  return (
    <View style={[avatarStyle, styles.iconContainer]}>
      <Ionicons
        name="person-circle"
        size={size * 0.8}
        color="#4FC3F7"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  image: {
    resizeMode: "cover",
  },
  loadingOverlay: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  iconContainer: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
});
