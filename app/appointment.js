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
import { Calendar } from "react-native-calendars";
import AuthService from "../services/authService";
import BookingService from "../services/bookingService";
import CareProfileService from "../services/careProfileService";
import CustomizePackageService from "../services/customizePackageService";
import CustomizeTaskService from "../services/customizeTaskService";
import NursingSpecialistService from "../services/nursingSpecialistService";
import ServiceTaskService from "../services/serviceTaskService";
import ServiceTypeService from "../services/serviceTypeService";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function AppointmentScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expandedBookings, setExpandedBookings] = useState({});
  const [customizePackagesMap, setCustomizePackagesMap] = useState(
    {}
  );
  const [customizeTasksMap, setCustomizeTasksMap] = useState({});
  const [services, setServices] = useState([]);
  const [serviceTasks, setServiceTasks] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [careProfiles, setCareProfiles] = useState([]);

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
      const user = await AuthService.getUserData();
      if (user) {
        setUserData(user);
        setIsLoggedIn(true);

        // Load cached data from booking history first
        await loadCachedData();

        // Then load fresh data if needed
        await loadBookings(user);
        await loadHolidays();
        await loadServices();
        await loadServiceTasks();
        await loadNurses();
        await loadCareProfiles(user);
      } else {
        setUserData(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserData(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCachedData = async () => {
    try {
      // Load cached data from booking history
      const cachedBookings = await AsyncStorage.getItem(
        "cachedBookings"
      );
      const cachedServices = await AsyncStorage.getItem(
        "cachedServices"
      );
      const cachedNurses = await AsyncStorage.getItem("cachedNurses");
      const cachedCareProfiles = await AsyncStorage.getItem(
        "cachedCareProfiles"
      );

      if (cachedBookings) {
        setBookings(JSON.parse(cachedBookings));
      }
      if (cachedServices) {
        setServices(JSON.parse(cachedServices));
      }
      if (cachedNurses) {
        setNurses(JSON.parse(cachedNurses));
      }
      if (cachedCareProfiles) {
        setCareProfiles(JSON.parse(cachedCareProfiles));
      }

      // Load customize packages và tasks từ cache
      if (cachedBookings) {
        const bookingsData = JSON.parse(cachedBookings);
        for (const booking of bookingsData) {
          const cachedPackages = await AsyncStorage.getItem(
            `cachedCustomizePackages-${booking.bookingID}`
          );
          const cachedTasks = await AsyncStorage.getItem(
            `cachedCustomizeTasks-${booking.bookingID}`
          );

          if (cachedPackages) {
            setCustomizePackagesMap((prev) => ({
              ...prev,
              [booking.bookingID]: JSON.parse(cachedPackages),
            }));
          }
          if (cachedTasks) {
            setCustomizeTasksMap((prev) => ({
              ...prev,
              [booking.bookingID]: JSON.parse(cachedTasks),
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error loading cached data:", error);
    }
  };

  const loadBookings = async (user) => {
    try {
      // Kiểm tra xem đã có dữ liệu từ cache chưa
      if (bookings.length > 0) {
        console.log("Using cached bookings data");
        return;
      }

      const accountID = user.accountID || user.id;

      // Lấy care profiles của account hiện tại
      const careProfilesResult =
        await CareProfileService.getCareProfilesByAccountId(
          accountID
        );

      if (
        !careProfilesResult.success ||
        careProfilesResult.data.length === 0
      ) {
        setBookings([]);
        return;
      }

      const userCareProfileIDs = careProfilesResult.data.map(
        (cp) => cp.careProfileID
      );

      // Lấy bookings của user hiện tại dựa trên careProfileID
      const userBookings = [];
      for (const careProfileID of userCareProfileIDs) {
        try {
          const result =
            await BookingService.getBookingsByCareProfileId(
              careProfileID
            );
          if (result.success && result.data) {
            userBookings.push(...result.data);
          }
        } catch (error) {
          console.error(
            `Error loading bookings for care profile ${careProfileID}:`,
            error
          );
        }
      }

      if (userBookings.length > 0) {
        // Load customize packages và tasks cho tất cả bookings
        for (const booking of userBookings) {
          await loadCustomizePackages(booking.bookingID);
          await loadCustomizeTasks(booking.bookingID);
        }
      }

      setBookings(userBookings);
      await AsyncStorage.setItem(
        "cachedBookings",
        JSON.stringify(userBookings)
      );
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  const loadHolidays = async () => {
    try {
      const response = await fetch(
        "https://cool-dhawan.103-28-36-58.plesk.page/api/Holiday/GetAll",
        {
          method: "GET",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (response.ok) {
        const holidaysData = await response.json();
        setHolidays(holidaysData);
        console.log("Holidays loaded:", holidaysData.length);
      }
    } catch (error) {
      console.error("Error loading holidays:", error);
    }
  };

  const loadCustomizePackages = async (bookingID) => {
    try {
      // Kiểm tra xem đã có dữ liệu từ cache chưa
      if (customizePackagesMap[bookingID]) {
        console.log(
          `Using cached customize packages for booking ${bookingID}`
        );
        return;
      }

      console.log(
        `Loading customize packages for booking ${bookingID}...`
      );
      const result =
        await CustomizePackageService.getCustomizePackagesByBookingId(
          bookingID
        );
      if (result.success) {
        console.log(
          `Customize packages for booking ${bookingID}:`,
          result.data
        );
        setCustomizePackagesMap((prev) => ({
          ...prev,
          [bookingID]: result.data,
        }));
        await AsyncStorage.setItem(
          `cachedCustomizePackages-${bookingID}`,
          JSON.stringify(result.data)
        );
      } else {
        console.log(
          `Failed to load packages for booking ${bookingID}:`,
          result.error
        );
      }
    } catch (error) {
      console.error("Error loading customize packages:", error);
    }
  };

  const loadCustomizeTasks = async (bookingID) => {
    try {
      // Kiểm tra xem đã có dữ liệu từ cache chưa
      if (customizeTasksMap[bookingID]) {
        console.log(
          `Using cached customize tasks for booking ${bookingID}`
        );
        return;
      }

      console.log(
        `Loading customize tasks for booking ${bookingID}...`
      );
      const result =
        await CustomizeTaskService.getCustomizeTasksByBookingId(
          bookingID
        );
      if (result.success) {
        console.log(
          `Customize tasks for booking ${bookingID}:`,
          result.data
        );
        setCustomizeTasksMap((prev) => ({
          ...prev,
          [bookingID]: result.data,
        }));
        await AsyncStorage.setItem(
          `cachedCustomizeTasks-${bookingID}`,
          JSON.stringify(result.data)
        );
      } else {
        console.log(
          `Failed to load tasks for booking ${bookingID}:`,
          result.error
        );
      }
    } catch (error) {
      console.error("Error loading customize tasks:", error);
    }
  };

  const loadServices = async () => {
    try {
      // Kiểm tra xem đã có dữ liệu từ cache chưa
      if (services.length > 0) {
        console.log("Using cached services data");
        return;
      }

      const result = await ServiceTypeService.getAllServiceTypes();
      if (result.success) {
        console.log("Services loaded:", result.data);
        setServices(result.data);
        await AsyncStorage.setItem(
          "cachedServices",
          JSON.stringify(result.data)
        );
      }
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadServiceTasks = async () => {
    try {
      console.log("Loading service tasks...");
      const result = await ServiceTaskService.getAllServiceTasks();
      if (result.success) {
        console.log(
          "Service tasks loaded:",
          result.data.length,
          "items"
        );
        console.log("Sample service task:", result.data[0]);
        setServiceTasks(result.data);
      } else {
        console.log("Failed to load service tasks:", result.error);
      }
    } catch (error) {
      console.error("Error loading service tasks:", error);
    }
  };

  const loadNurses = async () => {
    try {
      // Kiểm tra xem đã có dữ liệu từ cache chưa
      if (nurses.length > 0) {
        console.log("Using cached nurses data");
        return;
      }

      const result =
        await NursingSpecialistService.getAllNursingSpecialists();
      if (result.success) {
        setNurses(result.data);
        await AsyncStorage.setItem(
          "cachedNurses",
          JSON.stringify(result.data)
        );
      }
    } catch (error) {
      console.error("Error loading nurses:", error);
    }
  };

  const loadCareProfiles = async (user) => {
    try {
      // Kiểm tra xem đã có dữ liệu từ cache chưa
      if (careProfiles.length > 0) {
        console.log("Using cached care profiles data");
        return;
      }

      console.log("Loading care profiles...");
      const result =
        await CareProfileService.getCareProfilesByAccountId(
          user.accountID || user.id
        );
      if (result.success) {
        setCareProfiles(result.data);
        await AsyncStorage.setItem(
          "cachedCareProfiles",
          JSON.stringify(result.data)
        );
      } else {
        console.log("Failed to load care profiles:", result.error);
      }
    } catch (error) {
      console.error("Error loading care profiles:", error);
    }
  };

  const toggleExpanded = (bookingID) => {
    setExpandedBookings((prev) => ({
      ...prev,
      [bookingID]: !prev[bookingID],
    }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "cancelled":
        return "#FFD700"; // Vàng
      case "confirmed":
      case "paid":
      case "isscheduled":
        return "#4FC3F7"; // Xanh biển
      case "completed":
        return "#4CAF50"; // Xanh lá
      default:
        return "#FFD700"; // Default vàng
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
      case "paid":
      case "isscheduled":
        return "Đã xác nhận";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Chờ xác nhận";
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeString.substring(0, 5); // Fallback
    }
  };

  // Tạo marked dates cho calendar
  const getMarkedDates = () => {
    const markedDates = {};

    // Thêm bookings
    if (bookings && bookings.length > 0) {
      bookings.forEach((booking) => {
        const dateKey = booking.workdate?.split("T")[0];
        if (dateKey) {
          markedDates[dateKey] = {
            selected: true,
            selectedColor: getStatusColor(booking.status),
            selectedTextColor: "white",
            dots: [
              {
                key: `booking-${booking.bookingID}`,
                color: getStatusColor(booking.status),
                selectedDotColor: "white",
              },
            ],
          };
        }
      });
    }

    // Thêm holidays
    if (holidays && holidays.length > 0) {
      holidays.forEach((holiday) => {
        const startDate = new Date(holiday.startDate);
        const endDate = new Date(holiday.endDate);

        // Tạo range từ startDate đến endDate
        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dateKey = d.toISOString().split("T")[0];
          if (markedDates[dateKey]) {
            // Nếu đã có booking, thêm holiday dot
            if (!markedDates[dateKey].dots) {
              markedDates[dateKey].dots = [];
            }
            markedDates[dateKey].dots.push({
              key: `holiday-${holiday.holidayID}`,
              color: "#FF0000", // Đỏ cho holiday
              selectedDotColor: "white",
            });
          } else {
            // Nếu chưa có gì, tạo mới với holiday
            markedDates[dateKey] = {
              dots: [
                {
                  key: `holiday-${holiday.holidayID}`,
                  color: "#FF0000", // Đỏ cho holiday
                  selectedDotColor: "white",
                },
              ],
            };
          }
        }
      });
    }

    return markedDates;
  };

  // Lấy appointments cho ngày hôm nay
  const getTodayAppointments = () => {
    if (!bookings || bookings.length === 0) return [];

    const today = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter((booking) => {
      const bookingDate = booking.workdate?.split("T")[0];
      return bookingDate === today;
    });

    // Sắp xếp theo thứ tự mới nhất (từ trên xuống)
    return todayBookings.sort((a, b) => {
      // Sắp xếp theo thời gian tạo (createdAt) mới nhất trước
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // Mới nhất trước
    });
  };

  // Lấy appointments cho ngày được chọn và sắp xếp theo thứ tự mới nhất
  const getAppointmentsForDate = (dateString) => {
    if (!bookings || bookings.length === 0) return [];

    const filteredBookings = bookings.filter((booking) => {
      const bookingDate = booking.workdate?.split("T")[0];
      return bookingDate === dateString;
    });

    // Sắp xếp theo thứ tự mới nhất (từ trên xuống)
    return filteredBookings.sort((a, b) => {
      // Sắp xếp theo thời gian tạo (createdAt) mới nhất trước
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // Mới nhất trước
    });
  };

  // Xử lý khi user chọn ngày
  const handleDateSelect = (dateString) => {
    console.log("Date selected:", dateString);
    setSelectedDate(dateString);
  };

  // Nếu chưa đăng nhập, hiển thị màn hình đăng nhập
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

  // Nếu đang loading
  if (isLoading) {
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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
        </View>
      </LinearGradient>
    );
  }

  // Nếu đã đăng nhập, hiển thị lịch hẹn
  const markedDates = getMarkedDates();
  const todayAppointments = getTodayAppointments();

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
          <Calendar
            current={new Date().toISOString().split("T")[0]}
            markedDates={markedDates}
            hideExtraDays={false}
            disableMonthChange={false}
            enableSwipeMonths={true}
            onDayPress={(day) => handleDateSelect(day.dateString)}
            renderDay={(day, item) => {
              const isMarked = markedDates[day.dateString];
              const isToday =
                day.dateString ===
                new Date().toISOString().split("T")[0];
              const isSelected = day.dateString === selectedDate;

              return (
                <View style={styles.dayContainer}>
                  <View
                    style={[
                      styles.dayCircle,
                      isMarked && {
                        backgroundColor: isMarked.selectedColor,
                      },
                      isToday && !isMarked && styles.todayCircle,
                      isSelected && styles.selectedDateCircle,
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        isMarked && styles.selectedDayText,
                        isToday && !isMarked && styles.todayText,
                        isSelected &&
                          !isMarked &&
                          styles.selectedDateText,
                      ]}>
                      {day.day}
                    </Text>
                  </View>
                  {/* Hiển thị dots cho holiday và booking */}
                  {isMarked && isMarked.dots && (
                    <View style={styles.dotsContainer}>
                      {isMarked.dots.map((dot, index) => (
                        <View
                          key={dot.key}
                          style={[
                            styles.dot,
                            { backgroundColor: dot.color },
                            index > 0 && styles.dotMargin,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            }}
            theme={{
              calendarBackground: "#fff",
              textSectionTitleColor: "#333",
              todayTextColor: "#4FC3F7",
              dayTextColor: "#333",
              textDisabledColor: "#d9e1e8",
              arrowColor: "#4FC3F7",
              monthTextColor: "#1976D2",
              indicatorColor: "#4FC3F7",
              textDayFontWeight: "500",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "500",
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
              selectedDayBackgroundColor: "transparent",
              selectedDayTextColor: "white",
              // Làm calendar nhỏ hơn nhưng số vẫn rõ ràng
              "stylesheet.calendar.header": {
                dayHeader: {
                  fontWeight: "500",
                  color: "#333",
                  textAlign: "center",
                  paddingVertical: 4,
                  paddingHorizontal: 2,
                  width: 36,
                },
              },
              "stylesheet.day.basic": {
                base: {
                  width: 36,
                  height: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 3,
                  paddingHorizontal: 3,
                },
                text: {
                  marginTop: 2,
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#333",
                  textAlign: "center",
                },
              },
              "stylesheet.calendar.main": {
                week: {
                  marginTop: 1,
                  marginBottom: 1,
                  flexDirection: "row",
                  justifyContent: "space-around",
                  width: "100%",
                },
                month: {
                  width: "100%",
                },
              },
            }}
            style={styles.calendar}
          />
        </View>

        {/* Status Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Trạng thái lịch hẹn:</Text>
          <View style={styles.legendRow}>
            <View
              style={[
                styles.legendCircle,
                { backgroundColor: "#FFD700" },
              ]}
            />
            <Text style={styles.legendText}>Chờ xác nhận</Text>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[
                styles.legendCircle,
                { backgroundColor: "#4FC3F7" },
              ]}
            />
            <Text style={styles.legendText}>Đã xác nhận</Text>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[
                styles.legendCircle,
                { backgroundColor: "#4CAF50" },
              ]}
            />
            <Text style={styles.legendText}>Đã hoàn thành</Text>
          </View>
          <View style={styles.legendRow}>
            <View
              style={[
                styles.legendCircle,
                { backgroundColor: "#FF0000" },
              ]}
            />
            <Text style={styles.legendText}>Ngày lễ</Text>
          </View>
        </View>
      </View>

      {/* Appointments List */}
      <ScrollView style={styles.appointmentContainer}>
        <Text style={styles.appointmentTitle}>
          Lịch hẹn ngày{" "}
          {new Date(selectedDate).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </Text>

        {getAppointmentsForDate(selectedDate).length === 0 ? (
          <View style={styles.noAppointmentsContainer}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color="#CCC"
            />
            <Text style={styles.noAppointmentsText}>
              Không có lịch hẹn nào trong ngày này
            </Text>
          </View>
        ) : (
          getAppointmentsForDate(selectedDate).map((booking) => (
            <View
              key={booking.bookingID}
              style={styles.appointmentCard}>
              <TouchableOpacity
                style={styles.appointmentHeader}
                onPress={() => toggleExpanded(booking.bookingID)}>
                <View style={styles.timeContainer}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="#4FC3F7"
                  />
                  <Text style={styles.timeText}>
                    {formatTime(booking.workdate)}
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(
                          booking.status
                        ),
                      },
                    ]}>
                    <Text style={styles.statusText}>
                      {getStatusText(booking.status)}
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      expandedBookings[booking.bookingID]
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={20}
                    color="#666"
                    style={styles.expandIcon}
                  />
                </View>
              </TouchableOpacity>

              <Text style={styles.serviceText}>
                {(() => {
                  // Lấy tên service từ customize packages
                  const packages =
                    customizePackagesMap[booking.bookingID] || [];
                  if (packages.length > 0) {
                    const firstPackage = packages[0];
                    const serviceInfo = services.find(
                      (s) => s.serviceID === firstPackage.serviceID
                    );
                    return (
                      serviceInfo?.serviceName ||
                      `Dịch vụ ${firstPackage.serviceID}`
                    );
                  }
                  // Fallback về tên service mặc định nếu không có packages
                  return "Dịch vụ chăm sóc";
                })()}
              </Text>

              <View style={styles.nursingContainer}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color="#666"
                />
                <Text style={styles.nursingText}>
                  {(() => {
                    // Lấy tất cả điều dưỡng đã được gán cho booking này
                    const tasks =
                      customizeTasksMap[booking.bookingID] || [];

                    // Debug: Log tất cả tasks để kiểm tra
                    console.log(
                      `Tasks for booking ${booking.bookingID}:`,
                      tasks
                    );
                    console.log(
                      `Tasks with nursingID:`,
                      tasks.filter((task) => task.nursingID)
                    );

                    const assignedTasks = tasks.filter(
                      (task) => task.nursingID
                    );

                    if (assignedTasks.length > 0) {
                      // Tạo danh sách điều dưỡng với tên dịch vụ
                      const nurseServices = assignedTasks.map(
                        (task) => {
                          const nurse = nurses.find(
                            (n) => n.nursingID === task.nursingID
                          );
                          const serviceInfo = services.find(
                            (s) => s.serviceID === task.serviceID
                          );
                          const serviceName =
                            serviceInfo?.serviceName ||
                            `Dịch vụ ${task.serviceID}`;
                          const nurseName =
                            nurse?.fullName ||
                            "Điều dưỡng đã được gán";
                          return `${serviceName}: ${nurseName}`;
                        }
                      );

                      return nurseServices.join(", ");
                    }
                    return "Chưa có điều dưỡng";
                  })()}
                </Text>
              </View>

              <View style={styles.addressContainer}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#666"
                />
                <Text style={styles.addressText}>
                  {(() => {
                    // Lấy địa chỉ từ care profile của booking này
                    const careProfile = careProfiles.find(
                      (cp) =>
                        cp.careProfileID === booking.careProfileID
                    );
                    if (careProfile && careProfile.address) {
                      return careProfile.address;
                    }
                    // Fallback về địa chỉ từ booking nếu không có care profile
                    return (
                      booking.address || "Địa chỉ sẽ được cập nhật"
                    );
                  })()}
                </Text>
              </View>

              <View style={styles.amountContainer}>
                <Ionicons
                  name="card-outline"
                  size={16}
                  color="#666"
                />
                <Text style={styles.amountText}>
                  {(() => {
                    // Tính tổng tiền từ customize packages, nếu không có thì dùng từ booking
                    const packages =
                      customizePackagesMap[booking.bookingID] || [];
                    if (packages.length > 0) {
                      const totalAmount = packages.reduce(
                        (sum, pkg) => sum + (pkg.total || 0),
                        0
                      );
                      return totalAmount > 0
                        ? totalAmount.toLocaleString() + " VNĐ"
                        : "0 VNĐ";
                    }
                    // Fallback về amount từ booking gốc
                    return (
                      (booking.amount || 0).toLocaleString() + " VNĐ"
                    );
                  })()}
                </Text>
              </View>

              {/* Expanded content - Package và Service details */}
              {expandedBookings[booking.bookingID] && (
                <View style={styles.expandedContent}>
                  <Text style={styles.expandedTitle}>
                    Chi tiết gói dịch vụ:
                  </Text>

                  {customizePackagesMap[booking.bookingID]?.map(
                    (pkg, index) => (
                      <View
                        key={pkg.customizePackageID}
                        style={styles.packageItem}>
                        <Text style={styles.packageName}>
                          {(() => {
                            const serviceInfo = services.find(
                              (s) => s.serviceID === pkg.serviceID
                            );
                            console.log(
                              "Package:",
                              pkg,
                              "Service info:",
                              serviceInfo
                            );
                            return (
                              serviceInfo?.serviceName ||
                              `Dịch vụ ${pkg.serviceID}`
                            );
                          })()}
                        </Text>

                        <View style={styles.packageDetails}>
                          <Text style={styles.packagePrice}>
                            Giá: {pkg.price?.toLocaleString()} VNĐ
                          </Text>
                          <Text style={styles.packageQuantity}>
                            Số lượng: {pkg.quantity}
                          </Text>
                          {pkg.discount && pkg.discount > 0 && (
                            <Text style={styles.packageDiscount}>
                              Giảm giá:{" "}
                              {pkg.discount?.toLocaleString()} VNĐ
                            </Text>
                          )}
                          <Text style={styles.packageTotal}>
                            Tổng: {pkg.total?.toLocaleString()} VNĐ
                          </Text>
                        </View>

                        {/* Service tasks của package này */}
                        {customizeTasksMap[booking.bookingID] && (
                          <View style={styles.serviceTasksSection}>
                            <Text style={styles.serviceTasksTitle}>
                              Các dịch vụ con:
                            </Text>
                            {customizeTasksMap[booking.bookingID]
                              .filter(
                                (task) =>
                                  task.customizePackageID ===
                                  pkg.customizePackageID
                              )
                              .map((task, taskIndex) => {
                                // Lấy tên dịch vụ con từ serviceID
                                // CustomizeTask có serviceID để liên kết với ServiceTypes
                                const serviceInfo = services.find(
                                  (s) =>
                                    s.serviceID === task.serviceID
                                );
                                console.log(
                                  "Task:",
                                  task,
                                  "Service info:",
                                  serviceInfo
                                );
                                const assignedNurse = task.nursingID
                                  ? nurses.find(
                                      (n) =>
                                        n.nursingID === task.nursingID
                                    )
                                  : null;

                                return (
                                  <View
                                    key={task.customizeTaskID}
                                    style={styles.serviceTaskItem}>
                                    <View
                                      style={
                                        styles.serviceTaskHeader
                                      }>
                                      <Text
                                        style={
                                          styles.serviceTaskName
                                        }>
                                        {taskIndex + 1}.{" "}
                                        {serviceInfo?.serviceName ||
                                          `Dịch vụ ${task.serviceID}`}
                                      </Text>
                                      <Text
                                        style={
                                          styles.serviceTaskOrder
                                        }>
                                        Thứ tự: {task.taskOrder}
                                      </Text>
                                    </View>

                                    <Text
                                      style={
                                        styles.serviceTaskStatus
                                      }>
                                      Trạng thái:{" "}
                                      {getStatusText(task.status)}
                                    </Text>

                                    {assignedNurse ? (
                                      <View
                                        style={
                                          styles.assignedNurseInfo
                                        }>
                                        <Text
                                          style={
                                            styles.assignedNurseLabel
                                          }>
                                          Điều dưỡng:{" "}
                                          {assignedNurse.fullName}
                                        </Text>
                                      </View>
                                    ) : (
                                      <Text
                                        style={styles.noNurseText}>
                                        Chưa có điều dưỡng
                                      </Text>
                                    )}
                                  </View>
                                );
                              })}
                          </View>
                        )}
                      </View>
                    )
                  )}
                </View>
              )}
            </View>
          ))
        )}
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
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
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
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  calendarWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: "center",
  },
  calendar: {
    borderRadius: 15,
    width: SCREEN_WIDTH - 60,
  },
  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    minWidth: 36,
    minHeight: 36,
    // Đảm bảo có thể ấn vào được
    position: "relative",
    zIndex: 1,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    // Đảm bảo có thể ấn vào được
    position: "relative",
    zIndex: 2,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: "#4FC3F7",
  },
  dayText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  selectedDayText: {
    color: "white",
    fontWeight: "bold",
  },
  todayText: {
    color: "#4FC3F7",
    fontWeight: "bold",
  },
  selectedDateCircle: {
    borderWidth: 2,
    borderColor: "#4FC3F7",
    backgroundColor: "#E3F2FD",
  },
  selectedDateText: {
    color: "#4FC3F7",
    fontWeight: "bold",
  },
  legendContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
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
  noAppointmentsContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  noAppointmentsText: {
    fontSize: 16,
    color: "#666",
    marginTop: 15,
  },
  appointmentCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandIcon: {
    marginLeft: 10,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4FC3F7",
    marginLeft: 8,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  serviceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  nursingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  nursingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  amountText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    fontWeight: "bold",
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  packageItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  packageName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  packageDetails: {
    marginBottom: 10,
  },
  packagePrice: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  packageQuantity: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  packageDiscount: {
    fontSize: 14,
    color: "#FF6B6B",
    marginBottom: 3,
  },
  packageTotal: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
    marginBottom: 3,
  },
  serviceTasksSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  serviceTasksTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  serviceTaskItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  serviceTaskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  serviceTaskName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  serviceTaskOrder: {
    fontSize: 12,
    color: "#666",
  },
  serviceTaskStatus: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  assignedNurseInfo: {
    marginTop: 5,
  },
  assignedNurseLabel: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  noNurseText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotMargin: {
    marginLeft: 2,
  },
});
