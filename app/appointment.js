import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarList } from "react-native-calendars";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function AppointmentScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Reload user data khi screen được focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("user");
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
        setIsLoggedIn(true);
      } else {
        setUserData(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserData(null);
      setIsLoggedIn(false);
    }
  };

  // Mock data cho appointments (chỉ hiển thị khi đã đăng nhập)
  const getMarkedDates = () => {
    if (!isLoggedIn) return {};

    return {
      "2025-07-02": {
        selected: true,
        selectedColor: "#4FC3F7",
        selectedTextColor: "white",
      },
      "2025-07-08": {
        selected: true,
        selectedColor: "#FF8AB3",
        selectedTextColor: "white",
      },
      "2025-07-15": {
        selected: true,
        selectedColor: "#4FC3F7",
        selectedTextColor: "white",
      },
      "2025-07-22": {
        selected: true,
        selectedColor: "#26C6DA",
        selectedTextColor: "white",
      },
      "2025-07-28": {
        selected: true,
        selectedColor: "#FF8AB3",
        selectedTextColor: "white",
      },
    };
  };

  // Mock appointments data từ Booking API
  const getAppointments = () => {
    if (!isLoggedIn) return [];

    return [
      {
        bookingId: 1,
        careProfileId: userData?.id || 1,
        workDate: "2025-07-17",
        startTime: "08:00",
        endTime: "10:00",
        status: "Pending",
        amount: 500000,
        service: "Chăm sóc sức khỏe tại nhà",
        nursingName: "Trần Thị B",
        address: "123 Nguyễn Văn A, Quận 1",
      },
      {
        bookingId: 2,
        careProfileId: userData?.id || 1,
        workDate: "2025-07-17",
        startTime: "14:00",
        endTime: "16:00",
        status: "Accepted",
        amount: 300000,
        service: "Tư vấn dinh dưỡng",
        nursingName: "Lê Văn C",
        address: "456 Lê Văn B, Quận 2",
      },
    ];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#FF9800";
      case "Accepted":
        return "#4FC3F7";
      case "Completed":
        return "#4CAF50";
      case "Cancelled":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Pending":
        return "Chờ xác nhận";
      case "Accepted":
        return "Đã xác nhận";
      case "Completed":
        return "Đã hoàn thành";
      case "Cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  // Nếu chưa đăng nhập, không hiển thị gì
  if (!isLoggedIn) {
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
            <Text style={styles.headerText}>Lịch Hẹn</Text>
          </LinearGradient>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={80} color="#CCC" />
          <Text style={styles.emptyText}>
            Bạn cần đăng nhập để xem lịch hẹn
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/auth/login")}>
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Nếu đã đăng nhập, hiển thị lịch hẹn
  const markedDates = getMarkedDates();
  const appointments = getAppointments();

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
          <Text style={styles.headerText}>Lịch Hẹn</Text>
        </LinearGradient>
      </View>

      <View style={styles.calendarWrapper}>
        <View style={styles.calendarContainer}>
          <CalendarList
            current={"2025-07-16"}
            markedDates={markedDates}
            horizontal={true}
            pagingEnabled={true}
            theme={{
              calendarBackground: "#fff",
              textSectionTitleColor: "#333",
              todayTextColor: "#4FC3F7",
              dayTextColor: "#333",
              textDisabledColor: "#d9e1e8",
              arrowColor: "#4FC3F7",
              monthTextColor: "#1976D2",
              indicatorColor: "#4FC3F7",
              textDayFontWeight: "400",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "400",
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 14,
              selectedDayBackgroundColor: "transparent",
              selectedDayTextColor: "white",
            }}
            style={styles.calendarList}
            calendarWidth={SCREEN_WIDTH - 20}
            dayComponent={({ date, state }) => {
              const isMarked = markedDates[date.dateString];
              const isToday = date.dateString === "2025-07-17";

              return (
                <View style={styles.dayContainer}>
                  <View
                    style={[
                      styles.dayCircle,
                      isMarked && {
                        backgroundColor: isMarked.selectedColor,
                      },
                      isToday && !isMarked && styles.todayCircle,
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        isMarked && {
                          color: "white",
                          fontWeight: "bold",
                        },
                        isToday &&
                          !isMarked && {
                            color: "#4FC3F7",
                            fontWeight: "bold",
                          },
                        state === "disabled" && { color: "#d9e1e8" },
                      ]}>
                      {date.day}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Trạng thái lịch hẹn:</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendCircle,
                { backgroundColor: "#FF9800" },
              ]}
            />
            <Text style={styles.legendText}>Chờ xác nhận</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendCircle,
                { backgroundColor: "#4FC3F7" },
              ]}
            />
            <Text style={styles.legendText}>Đã xác nhận</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendCircle,
                { backgroundColor: "#4CAF50" },
              ]}
            />
            <Text style={styles.legendText}>Đã hoàn thành</Text>
          </View>
        </View>
      </View>

      {/* Appointments List */}
      <ScrollView style={styles.appointmentContainer}>
        <Text style={styles.appointmentTitle}>Lịch hẹn hôm nay</Text>

        {appointments.map((appointment) => (
          <View
            key={appointment.bookingId}
            style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <View style={styles.timeContainer}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color="#4FC3F7"
                />
                <Text style={styles.timeText}>
                  {appointment.startTime} - {appointment.endTime}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(
                      appointment.status
                    ),
                  },
                ]}>
                <Text style={styles.statusText}>
                  {getStatusText(appointment.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.serviceText}>
              {appointment.service}
            </Text>

            <View style={styles.nursingContainer}>
              <Ionicons
                name="person-outline"
                size={16}
                color="#666"
              />
              <Text style={styles.nursingText}>
                {appointment.nursingName}
              </Text>
            </View>

            <View style={styles.addressContainer}>
              <Ionicons
                name="location-outline"
                size={16}
                color="#666"
              />
              <Text style={styles.addressText}>
                {appointment.address}
              </Text>
            </View>

            <View style={styles.amountContainer}>
              <Ionicons name="card-outline" size={16} color="#666" />
              <Text style={styles.amountText}>
                {appointment.amount.toLocaleString()} VNĐ
              </Text>
            </View>
          </View>
        ))}
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
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: "#4FC3F7",
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  calendarWrapper: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#333333",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarList: {
    borderRadius: 15,
  },
  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: "#4FC3F7",
  },
  dayText: {
    fontSize: 16,
    color: "#333",
  },
  legendContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  legendCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  appointmentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  appointmentCard: {
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
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
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
  serviceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  nursingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  nursingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
    flex: 1,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
    marginLeft: 5,
  },
});
