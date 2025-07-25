import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C2F5E9" />
      {/* Header */}
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#333333" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={["#F8F9FA", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}>
            {/* Gradient Lullaby Text */}
            <MaskedView
              maskElement={
                <Text
                  style={[
                    styles.mainText,
                    { backgroundColor: "transparent" },
                  ]}>
                  Lullaby
                </Text>
              }>
              <LinearGradient
                colors={["#4FC3F7", "#FF8AB3", "#26C6DA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Text style={[styles.mainText, { opacity: 0 }]}>
                  Lullaby
                </Text>
              </LinearGradient>
            </MaskedView>
          </LinearGradient>
          <Text style={styles.subText}>
            Evokes the image of a lullaby
          </Text>
        </View>
      </LinearGradient>
      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Notification and Application Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đội Ngũ</Text>
          <View style={styles.separator} />
          <View style={styles.cardRow}>
            <LinearGradient
              colors={["#B3E5FC", "#81D4FA", "#4FC3F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}>
              <TouchableOpacity style={styles.cardContent}>
                <Ionicons
                  name="person-circle"
                  size={40}
                  color="#FFFFFF"
                />
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  Tư vấn viên
                </Text>
              </TouchableOpacity>
            </LinearGradient>
            <LinearGradient
              colors={["#FFD9E6", "#FFB3D1", "#FF8AB3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}>
              <TouchableOpacity style={styles.cardContent}>
                <Ionicons
                  name="person-circle"
                  size={40}
                  color="#FFFFFF"
                />
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  Điều dưỡng viên
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gói dịch vụ</Text>
          <View style={styles.separator} />
          <View style={styles.cardRow}>
            <LinearGradient
              colors={["#C2F5E9", "#A8E6CF", "#8ED9C3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}>
              <TouchableOpacity style={styles.cardContent}>
                <Ionicons
                  name="cube-outline"
                  size={40}
                  color="#FFFFFF"
                />
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  Gói dịch vụ chăm sóc
                </Text>
              </TouchableOpacity>
            </LinearGradient>
            <LinearGradient
              colors={["#B3E5FC", "#81D4FA", "#4FC3F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}>
              <TouchableOpacity style={styles.cardContent}>
                <Ionicons
                  name="document-text"
                  size={40}
                  color="#FFFFFF"
                />
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  Dịch vụ cơ bản
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch</Text>
          <View style={styles.separator} />
          <View style={styles.cardRow}>
            <LinearGradient
              colors={["#FFD9E6", "#FFB3D1", "#FF8AB3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, styles.singleCard]}>
              <TouchableOpacity
                style={styles.cardContent}
                onPress={() => router.push("/appointment")}>
                <Ionicons
                  name="calendar-outline"
                  size={40}
                  color="#FFFFFF"
                />
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  Lịch Hẹn
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
      {/* Bottom Navigation */}
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#FFFFFF" />
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: "relative",
  },
  menuButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  logoBox: {
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  mainText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  subText: {
    fontSize: 14,
    color: "#666666",
    marginTop: -5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 10,
  },
  separator: {
    height: 3,
    backgroundColor: "#B3E5FC",
    width: 60,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  card: {
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#333333",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    padding: 20,
    alignItems: "center",
  },
  singleCard: {
    flex: 0.5,
    alignSelf: "center",
  },
  cardText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
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
