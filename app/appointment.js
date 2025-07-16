import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarList, LocaleConfig } from "react-native-calendars";
import BottomTab from "../components/BottomTab";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Cấu hình tiếng Việt cho calendar
LocaleConfig.locales["vi"] = {
  monthNames: [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
  monthNamesShort: [
    "Th1",
    "Th2",
    "Th3",
    "Th4",
    "Th5",
    "Th6",
    "Th7",
    "Th8",
    "Th9",
    "Th10",
    "Th11",
    "Th12",
  ],
  dayNames: [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ],
  dayNamesShort: ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"],
  today: "Hôm nay",
};
LocaleConfig.defaultLocale = "vi";

export default function AppointmentScreen() {
  const router = useRouter();
  // Ví dụ các ngày có chấm màu
  const markedDates = {
    "2025-07-02": {
      dots: [
        { key: "a", color: "red" },
        { key: "b", color: "orange" },
        { key: "c", color: "green" },
      ],
    },
    "2025-07-05": {
      dots: [
        { key: "a", color: "red" },
        { key: "b", color: "orange" },
      ],
    },
    "2025-07-16": {
      dots: [
        { key: "a", color: "red" },
        { key: "b", color: "orange" },
        { key: "c", color: "green" },
      ],
    },
    "2025-07-19": {
      dots: [
        { key: "a", color: "red" },
        { key: "b", color: "orange" },
      ],
    },
    "2025-07-23": { dots: [{ key: "a", color: "red" }] },
    "2025-07-24": { dots: [{ key: "c", color: "green" }] },
    "2025-07-26": {
      dots: [
        { key: "a", color: "red" },
        { key: "b", color: "orange" },
      ],
    },
    "2025-07-31": { dots: [{ key: "c", color: "green" }] },
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
          <Text style={styles.headerText}>Lịch Hẹn</Text>
        </LinearGradient>
      </View>
      <View style={styles.calendarWrapper}>
        <View style={styles.calendarContainer}>
          <CalendarList
            current={"2025-07-16"}
            markingType={"multi-dot"}
            markedDates={markedDates}
            horizontal={true}
            pagingEnabled={true}
            theme={{
              calendarBackground: "#fff",
              textSectionTitleColor: "#333",
              selectedDayBackgroundColor: "#4FC3F7",
              selectedDayTextColor: "#fff",
              todayTextColor: "#4FC3F7",
              dayTextColor: "#333",
              textDisabledColor: "#d9e1e8",
              dotColor: "#4FC3F7",
              selectedDotColor: "#fff",
              arrowColor: "#4FC3F7",
              monthTextColor: "#1976D2",
              indicatorColor: "#4FC3F7",
              textDayFontWeight: "400",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "400",
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendarList}
            // Đảm bảo calendar full width, các cột đều nhau
            calendarWidth={SCREEN_WIDTH - 20}
          />
        </View>
      </View>
      <BottomTab />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  headerWrapper: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 0,
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
  },
  headerBox: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#333333",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 20,
    minWidth: 240,
  },
  backBtnOuter: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: [{ translateY: -18 }],
    zIndex: 2,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  headerText: {
    color: "#1976D2",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "rgba(76, 195, 247, 0.10)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    // flex: 1, // bỏ flex để tránh bị co chữ
  },
  calendarWrapper: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
  },
  calendarContainer: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    width: SCREEN_WIDTH - 20,
  },
  calendarList: {
    borderRadius: 18,
    width: SCREEN_WIDTH - 20,
  },
});
