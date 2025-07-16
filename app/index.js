import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
            <Text style={styles.mainText}>Lullaby</Text>
            <Text style={styles.subText}>
              Evokes the image of a lullaby
            </Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Notification and Application Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Notification and Application status
          </Text>
          <View style={styles.separator} />

          <View style={styles.cardRow}>
            <LinearGradient
              colors={["#B3E5FC", "#81D4FA", "#4FC3F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}>
              <TouchableOpacity style={styles.cardContent}>
                <Ionicons
                  name="notifications"
                  size={40}
                  color="#FFFFFF"
                />
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  Notification
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
                  Application status
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Information Access Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information Access</Text>
          <View style={styles.separator} />

          <View style={styles.cardRow}>
            <LinearGradient
              colors={["#C2F5E9", "#A8E6CF", "#8ED9C3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}>
              <TouchableOpacity style={styles.cardContent}>
                <Ionicons name="calendar" size={40} color="#FFFFFF" />
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  Weekly timetable
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
                  Exam schedule
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={styles.cardRow}>
            <LinearGradient
              colors={["#FFD9E6", "#FFB3D1", "#FF8AB3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, styles.singleCard]}>
              <TouchableOpacity style={styles.cardContent}>
                <Ionicons
                  name="calendar-outline"
                  size={40}
                  color="#FFFFFF"
                />
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  Semester Schedule
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Reports Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports</Text>
          <View style={styles.separator} />

          <View style={styles.cardRow}>
            <LinearGradient
              colors={["#C2F5E9", "#A8E6CF", "#8ED9C3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}>
              <TouchableOpacity style={styles.cardContent}>
                <Ionicons
                  name="bar-chart"
                  size={40}
                  color="#FFFFFF"
                />
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  Academic Report
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
                  name="trending-up"
                  size={40}
                  color="#FFFFFF"
                />
                <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                  Progress Report
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
          <Ionicons name="home" size={24} color="#333333" />
          <View style={styles.activeIndicator} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubble" size={24} color="#333333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color="#333333" />
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
    justifyContent: "space-between",
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
    backgroundColor: "#333333",
    borderRadius: 2,
    marginTop: 5,
  },
});
