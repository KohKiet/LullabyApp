import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function BottomTab() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <LinearGradient
      colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (pathname !== "/") router.replace("/");
        }}>
        <Ionicons name="home" size={24} color="#FFFFFF" />
        {pathname === "/" && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/chat")}>
        <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
        {pathname === "/chat" && (
          <View style={styles.activeIndicator} />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/profile")}>
        <Ionicons name="person" size={24} color="#FFFFFF" />
        {pathname === "/profile" && (
          <View style={styles.activeIndicator} />
        )}
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
  },
  activeIndicator: {
    width: 20,
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
    marginTop: 5,
  },
});
