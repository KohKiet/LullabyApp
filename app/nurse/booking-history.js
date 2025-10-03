import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AuthService from "../../services/authService";
import BookingService from "../../services/bookingService";
import CareProfileService from "../../services/careProfileService";
import CustomizeTaskService from "../../services/customizeTaskService";
import MedicalNoteService from "../../services/medicalNoteService";
import NotificationService from "../../services/notificationService";
import NursingSpecialistService from "../../services/nursingSpecialistService";
import ServiceTypeService from "../../services/serviceTypeService";
import { getMajorDisplayText } from "../../utils/majorUtils";

export default function NurseBookingHistoryScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBookings, setExpandedBookings] = useState({});
  const [customizeTasksMap, setCustomizeTasksMap] = useState({});
  const [services, setServices] = useState({});
  const [careProfiles, setCareProfiles] = useState({});
  const [medicalNotesMap, setMedicalNotesMap] = useState({});
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    loadUserData();
    checkUnreadNotifications();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      if (user) {
        setUserData(user);
        await loadNurseBookings(user);
      } else {
        Alert.alert(
          "Thông báo",
          "Không thể tải thông tin người dùng"
        );
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Thông báo", "Không thể tải thông tin người dùng");
      router.replace("/auth/login");
    }
  };

  const loadNurseBookings = async (user) => {
    try {
      setIsLoading(true);

      // Lấy accountID của nurse hiện tại
      const accountID = user.accountID || user.account_id || user.id;

      if (!accountID) {
        console.error("No accountID found in user data");
        Alert.alert(
          "Thông báo",
          "Không tìm thấy thông tin khách hàng id. Vui lòng đăng nhập lại."
        );
        return;
      }

      // Tìm nursingID từ accountID bằng cách gọi API
      const nursingResult =
        await NursingSpecialistService.getAllDetailedNurses();

      if (nursingResult.success) {
        // Tìm nurse có accountID trùng khớp
        const nurse = nursingResult.data.find(
          (n) => n.accountID === accountID
        );

        if (nurse) {
          const nursingID = nurse.nursingID;

          // Tiếp tục load bookings với nursingID này
          await loadBookingsByNursingID(nursingID);
        } else {
          console.error("No nurse found with accountID:", accountID);
          Alert.alert(
            "Lỗi",
            "Không tìm thấy thông tin nurse với account này."
          );
          setBookings([]);
        }
      } else {
        console.error(
          "Failed to load nursing data:",
          nursingResult.error
        );
        Alert.alert("Thông báo", "Không thể tải thông tin nurse");
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading nurse bookings:", error);
      Alert.alert("Thông báo", "Không thể tải lịch sử đặt lịch");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookingsByNursingID = async (nursingID) => {
    try {
      // Load tất cả customize tasks của nurse này
      const customizeTasksResult =
        await CustomizeTaskService.getAllCustomizeTasks();

      if (customizeTasksResult.success) {
        // Lọc ra các tasks của nurse này và đã hoàn thành
        const nurseTasks = customizeTasksResult.data.filter(
          (task) =>
            task.nursingID === nursingID &&
            task.status === "completed"
        );

        // Tạo map để dễ truy cập
        const tasksMap = {};
        nurseTasks.forEach((task) => {
          tasksMap[task.customizeTaskID] = task;
        });
        setCustomizeTasksMap(tasksMap);

        // Lấy danh sách booking IDs từ các tasks
        const bookingIDs = [
          ...new Set(nurseTasks.map((task) => task.bookingID)),
        ];

        // Load thông tin chi tiết của từng booking
        const bookingsData = [];
        for (const bookingID of bookingIDs) {
          const bookingResult = await BookingService.getBookingById(
            bookingID
          );
          if (bookingResult.success) {
            const booking = bookingResult.data;

            // Chỉ hiển thị các booking đã hoàn thành
            if (booking.status === "completed") {
              bookingsData.push(booking);
            }
          }
        }

        // Sắp xếp theo thời gian tạo (mới nhất trước)
        bookingsData.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setBookings(bookingsData);

        // Load thông tin bổ sung
        await loadAdditionalData(bookingsData, nurseTasks);
      } else {
        console.log(
          "Failed to load customize tasks:",
          customizeTasksResult.error
        );
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading bookings by nursingID:", error);
      setBookings([]);
    }
  };

  const loadAdditionalData = async (bookingsData, nurseTasks) => {
    try {
      // Load services
      const servicesResult =
        await ServiceTypeService.getAllServiceTypes();
      if (servicesResult.success) {
        const servicesMap = {};
        // Filter out removed/inactive services
        const filteredServices = servicesResult.data.filter(
          (service) =>
            service.status !== "Remove" &&
            service.status !== "inactive"
        );
        filteredServices.forEach((service) => {
          servicesMap[service.serviceID] = service;
        });
        setServices(servicesMap);
      }

      // Load care profiles
      const careProfileIDs = [
        ...new Set(
          bookingsData.map((booking) => booking.careProfileID)
        ),
      ];
      for (const careProfileID of careProfileIDs) {
        const careProfileResult =
          await CareProfileService.getCareProfileById(careProfileID);
        if (careProfileResult.success) {
          setCareProfiles((prev) => ({
            ...prev,
            [careProfileID]: careProfileResult.data,
          }));
        }
      }

      // Load medical notes cho từng task
      for (const task of nurseTasks) {
        const notesResult =
          await MedicalNoteService.getMedicalNotesByCustomizeTaskId(
            task.customizeTaskID
          );
        if (notesResult.success && notesResult.data.length > 0) {
          setMedicalNotesMap((prev) => ({
            ...prev,
            [task.customizeTaskID]: notesResult.data,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading additional data:", error);
    }
  };

  const toggleBookingExpansion = (bookingID) => {
    setExpandedBookings((prev) => ({
      ...prev,
      [bookingID]: !prev[bookingID],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch (error) {
      return "N/A";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN");
    } catch (error) {
      return "N/A";
    }
  };

  const formatTimeRange = (startString, endString) => {
    if (!startString) return "N/A";

    try {
      const start = new Date(startString);
      if (isNaN(start.getTime())) {
        return startString;
      }

      // Format start time
      const startStr = `${start
        .getHours()
        .toString()
        .padStart(2, "0")}:${start
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      const dateStr = `${start
        .getDate()
        .toString()
        .padStart(2, "0")}/${(start.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${start.getFullYear()}`;

      // Nếu có end time, format thành range
      if (endString) {
        const end = new Date(endString);
        if (!isNaN(end.getTime())) {
          const endStr = `${end
            .getHours()
            .toString()
            .padStart(2, "0")}:${end
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
          return `${startStr} - ${endStr} ${dateStr}`;
        }
      }

      // Chỉ có start time
      return `${startStr} ${dateStr}`;
    } catch (error) {
      return `${startString}${endString ? ` - ${endString}` : ""}`;
    }
  };

  const formatStatus = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      case "in_progress":
        return "Đang thực hiện";
      default:
        return status || "Không xác định";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#4CAF50";
      case "confirmed":
        return "#2196F3";
      case "pending":
        return "#FF9800";
      case "cancelled":
        return "#F44336";
      case "in_progress":
        return "#9C27B0";
      default:
        return "#999";
    }
  };

  const checkUnreadNotifications = async () => {
    try {
      if (userData?.accountID) {
        const result =
          await NotificationService.getNotificationsByAccount(
            userData.accountID
          );
        if (result.success) {
          const unread = result.data.filter((n) => !n.isRead);
          setUnreadNotifications(unread.length);

          // Show notification for the latest unread message
          if (unread.length > 0) {
            const latest = unread[0];
            global.__notify?.({
              title: "Thông báo mới",
              message: latest.message,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Đang tải lịch sử đặt lịch...
          </Text>
        </View>
      </LinearGradient>
    );
  }

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
          <Text style={styles.headerText}>Lịch sử đặt lịch</Text>
        </LinearGradient>
        <TouchableOpacity
          style={styles.refreshBtnOuter}
          onPress={() => userData && loadNurseBookings(userData)}>
          <Ionicons name="refresh" size={28} color="#4FC3F7" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>
          Lịch sử các lịch hẹn đã hoàn thành ({bookings.length})
        </Text>

        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyText}>
              Chưa có lịch hẹn nào hoàn thành
            </Text>
            <Text style={styles.emptySubtext}>
              Các lịch hẹn sẽ xuất hiện ở đây sau khi hoàn thành
            </Text>
          </View>
        ) : (
          bookings.map((booking) => {
            const careProfile = careProfiles[booking.careProfileID];
            const tasks = Object.values(customizeTasksMap).filter(
              (task) => task.bookingID === booking.bookingID
            );

            return (
              <View
                key={booking.bookingID}
                style={styles.bookingCard}>
                <TouchableOpacity
                  style={styles.bookingHeader}
                  onPress={() =>
                    toggleBookingExpansion(booking.bookingID)
                  }>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingId}>
                      Đặt lịch #{booking.bookingID}
                    </Text>
                    <Text style={styles.bookingDate}>
                      {formatDate(booking.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.bookingStatus}>
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
                        {formatStatus(booking.status)}
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
                    />
                  </View>
                </TouchableOpacity>

                {expandedBookings[booking.bookingID] && (
                  <View style={styles.bookingDetails}>
                    {/* Thông tin khách hàng */}
                    {careProfile && (
                      <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>
                          Thông tin khách hàng
                        </Text>
                        <View style={styles.detailCard}>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>
                              Tên:
                            </Text>
                            <Text style={styles.detailValue}>
                              {careProfile.profileName}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>
                              Số điện thoại:
                            </Text>
                            <Text style={styles.detailValue}>
                              {careProfile.phoneNumber}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>
                              Địa chỉ:
                            </Text>
                            <Text style={styles.detailValue}>
                              {careProfile.address}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Danh sách công việc */}
                    {tasks.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>
                          Công việc đã thực hiện ({tasks.length})
                        </Text>
                        {tasks.map((task, index) => {
                          const service = services[task.serviceID];
                          const notes =
                            medicalNotesMap[task.customizeTaskID] ||
                            [];

                          return (
                            <View
                              key={task.customizeTaskID}
                              style={styles.taskCard}>
                              <View style={styles.taskHeader}>
                                <Text style={styles.taskTitle}>
                                  Công việc #{index + 1}
                                </Text>
                                <Text style={styles.taskOrder}>
                                  Thứ tự: {task.taskOrder}
                                </Text>
                              </View>

                              {service && (
                                <View style={styles.serviceInfo}>
                                  <Text style={styles.serviceName}>
                                    {service.serviceName}
                                  </Text>
                                  <Text style={styles.serviceMajor}>
                                    {getMajorDisplayText(
                                      service.major
                                    )}
                                  </Text>
                                </View>
                              )}

                              {/* Medical Notes */}
                              {notes.length > 0 && (
                                <View style={styles.notesSection}>
                                  <Text style={styles.notesTitle}>
                                    Ghi chú y tế ({notes.length})
                                  </Text>
                                  {notes.map((note, noteIndex) => (
                                    <View
                                      key={note.medicalNoteID}
                                      style={styles.noteItem}>
                                      <Text
                                        style={styles.noteContent}>
                                        {note.note}
                                      </Text>
                                      <Text style={styles.noteDate}>
                                        {formatDateTime(
                                          note.createdAt
                                        )}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Thông tin đặt lịch */}
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>
                        Thông tin đặt lịch
                      </Text>
                      <View style={styles.detailCard}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>
                            Ngày tạo:
                          </Text>
                          <Text style={styles.detailValue}>
                            {formatDateTime(booking.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>
                            Thời gian làm việc:
                          </Text>
                          <Text style={styles.detailValue}>
                            {formatTimeRange(
                              booking.workdate,
                              booking.endTime
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 10,
    textAlign: "center",
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
  refreshBtnOuter: {
    marginLeft: 15,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  bookingCard: {
    backgroundColor: "white",
    borderRadius: 15,
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
    padding: 15,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: "#666",
  },
  bookingStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  bookingDetails: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailSection: {
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    width: 100,
    marginRight: 10,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    fontWeight: "600",
  },
  taskCard: {
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e3f2fd",
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  taskOrder: {
    fontSize: 12,
    color: "#666",
  },
  serviceInfo: {
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4FC3F7",
    marginBottom: 2,
  },
  serviceMajor: {
    fontSize: 12,
    color: "#666",
  },
  notesSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  noteItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e8f5e8",
  },
  noteContent: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    fontStyle: "italic",
  },
  noteDate: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
});
