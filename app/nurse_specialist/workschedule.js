import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
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

export default function WorkScheduleScreen() {
  const router = useRouter();

  // Mock data cho work schedule - sử dụng cách mark khác
  const markedDates = {
    "2025-07-02": {
      selected: true,
      selectedColor: "#4FC3F7",
      selectedTextColor: "white",
    },
    "2025-07-05": {
      selected: true,
      selectedColor: "#FF8AB3",
      selectedTextColor: "white",
    },
    "2025-07-16": {
      selected: true,
      selectedColor: "#4FC3F7",
      selectedTextColor: "white",
    },
    "2025-07-23": {
      selected: true,
      selectedColor: "#26C6DA",
      selectedTextColor: "white",
    },
    "2025-07-26": {
      selected: true,
      selectedColor: "#FF8AB3",
      selectedTextColor: "white",
    },
    "2025-07-31": {
      selected: true,
      selectedColor: "#26C6DA",
      selectedTextColor: "white",
    },
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
          <Text style={styles.headerText}>Lịch Làm Việc</Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
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
                          state === "disabled" && {
                            color: "#d9e1e8",
                          },
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
          <Text style={styles.legendTitle}>
            Trạng thái công việc:
          </Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendCircle,
                  { backgroundColor: "#4FC3F7" },
                ]}
              />
              <Text style={styles.legendText}>Đã đặt lịch</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendCircle,
                  { backgroundColor: "#FF8AB3" },
                ]}
              />
              <Text style={styles.legendText}>Đã hoàn thành</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendCircle,
                  { backgroundColor: "#26C6DA" },
                ]}
              />
              <Text style={styles.legendText}>Đang thực hiện</Text>
            </View>
          </View>
        </View>

        {/* Work Schedule List */}
        <View style={styles.scheduleListContainer}>
          <Text style={styles.scheduleTitle}>
            Lịch làm việc hôm nay
          </Text>

          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: "#4FC3F7" },
                ]}
              />
              <Text style={styles.scheduleTime}>08:00 - 10:00</Text>
              <Text style={styles.scheduleStatus}>Đã đặt lịch</Text>
            </View>
            <Text style={styles.scheduleService}>
              Chăm sóc sức khỏe tại nhà
            </Text>
            <Text style={styles.scheduleLocation}>
              123 Nguyễn Văn A, Quận 1
            </Text>
          </View>

          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: "#26C6DA" },
                ]}
              />
              <Text style={styles.scheduleTime}>14:00 - 16:00</Text>
              <Text style={styles.scheduleStatus}>
                Đang thực hiện
              </Text>
            </View>
            <Text style={styles.scheduleService}>
              Tư vấn dinh dưỡng
            </Text>
            <Text style={styles.scheduleLocation}>
              456 Lê Văn B, Quận 2
            </Text>
          </View>
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
  // Styles cho custom day component
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
  scheduleListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  scheduleCard: {
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
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  scheduleStatus: {
    fontSize: 12,
    color: "#666",
  },
  scheduleService: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  scheduleLocation: {
    fontSize: 14,
    color: "#666",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Add some padding at the bottom for the last element
  },
});
