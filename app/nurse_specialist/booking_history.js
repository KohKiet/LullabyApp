import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BookingHistoryScreen() {
  const router = useRouter();

  // Mock data cho booking history
  const bookingHistory = [
    {
      id: 1,
      date: "2025-01-10",
      time: "08:00 - 10:00",
      service: "Chăm sóc sức khỏe tại nhà",
      customer: "Nguyễn Văn A",
      address: "123 Nguyễn Văn A, Quận 1",
      status: "completed",
    },
    {
      id: 2,
      date: "2025-01-08",
      time: "14:00 - 16:00",
      service: "Tư vấn dinh dưỡng",
      customer: "Trần Thị B",
      address: "456 Lê Văn B, Quận 2",
      status: "completed",
    },
    {
      id: 3,
      date: "2025-01-05",
      time: "09:00 - 11:00",
      service: "Kiểm tra sức khỏe định kỳ",
      customer: "Lê Văn C",
      address: "789 Trần Văn C, Quận 3",
      status: "completed",
    },
    {
      id: 4,
      date: "2025-01-03",
      time: "16:00 - 18:00",
      service: "Chăm sóc sau sinh",
      customer: "Phạm Thị D",
      address: "321 Phạm Văn D, Quận 4",
      status: "cancelled",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Chưa hoàn thành";
    }
  };

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
          <Text style={styles.headerText}>Lịch Sử Đặt Lịch</Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Tổng số lịch</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#4CAF50" }]}>
              10
            </Text>
            <Text style={styles.statLabel}>Đã hoàn thành</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#F44336" }]}>
              2
            </Text>
            <Text style={styles.statLabel}>Đã hủy</Text>
          </View>
        </View>

        {/* Booking History List */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Lịch sử gần đây</Text>

          {bookingHistory.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.dateContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color="#4FC3F7"
                  />
                  <Text style={styles.dateText}>{booking.date}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(booking.status),
                    },
                  ]}>
                  <Text style={styles.statusText}>
                    {getStatusText(booking.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingContent}>
                <View style={styles.timeContainer}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.timeText}>{booking.time}</Text>
                </View>

                <Text style={styles.serviceText}>
                  {booking.service}
                </Text>

                <View style={styles.customerContainer}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.customerText}>
                    {booking.customer}
                  </Text>
                </View>

                <View style={styles.addressContainer}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.addressText}>
                    {booking.address}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
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
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  bookingCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginLeft: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },
  bookingContent: {
    gap: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  customerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
    flex: 1,
  },
  paymentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
    marginLeft: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Add some padding at the bottom for the last item
  },
});
