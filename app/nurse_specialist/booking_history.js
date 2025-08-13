import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
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
import RelativeService from "../../services/relativeService";
import ServiceTypeService from "../../services/serviceTypeService";
import WorkScheduleService from "../../services/workScheduleService";
import { getMajorDisplayText } from "../../utils/majorUtils";

export default function BookingHistoryScreen() {
  const router = useRouter();
  const [workSchedules, setWorkSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all"); // all, completed, waiting, cancelled
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleDetails, setScheduleDetails] = useState({
    booking: null,
    careProfile: null,
    service: null,
    customizeTask: null,
    relatives: [],
  });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    waiting: 0,
    cancelled: 0,
  });

  useCallback(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      console.log("BookingHistoryScreen: User data loaded:", user);

      if (user) {
        setUserData(user);
        const nursingID =
          user.nursingID || user.nursing_id || user.id;
        console.log(
          "BookingHistoryScreen: Extracted nursingID:",
          nursingID
        );

        if (nursingID) {
          loadWorkSchedules(nursingID);
        } else {
          console.log(
            "BookingHistoryScreen: No nursingID found in user data"
          );
          loadWorkSchedules(1); // Try with ID 1 for testing
        }
      } else {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error(
        "BookingHistoryScreen: Error loading user data:",
        error
      );
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
      setIsLoading(false);
    }
  };

  const loadWorkSchedules = async (nursingID) => {
    try {
      setIsLoading(true);
      console.log(
        "BookingHistoryScreen: Loading work schedules for nursingID:",
        nursingID
      );

      const result =
        await WorkScheduleService.getWorkSchedulesByNursingId(
          nursingID
        );

      if (result.success) {
        console.log(
          "BookingHistoryScreen: Raw filtered schedules:",
          result.data
        );
        setWorkSchedules(result.data);
        calculateStats(result.data);
        applyFilter("all", result.data);
        console.log(
          "BookingHistoryScreen: Loaded",
          result.data.length,
          "work schedules"
        );
      } else {
        console.log(
          "BookingHistoryScreen: Failed to load work schedules:",
          result.error
        );
        Alert.alert("Lỗi", "Không thể tải lịch sử đặt lịch");
        setWorkSchedules([]);
      }
    } catch (error) {
      console.error(
        "BookingHistoryScreen: Error loading work schedules:",
        error
      );
      Alert.alert("Lỗi", "Có lỗi xảy ra khi tải lịch sử đặt lịch");
      setWorkSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (schedules) => {
    const stats = {
      total: schedules.length,
      completed: schedules.filter((s) => s.status === "completed")
        .length,
      waiting: schedules.filter((s) => s.status === "waiting").length,
      cancelled: schedules.filter((s) => s.status === "cancelled")
        .length,
    };
    setStats(stats);
  };

  const applyFilter = (filter, schedules = workSchedules) => {
    setSelectedFilter(filter);
    let filtered = [...schedules];

    switch (filter) {
      case "completed":
        filtered = schedules.filter((s) => s.status === "completed");
        break;
      case "waiting":
        filtered = schedules.filter((s) => s.status === "waiting");
        break;
      case "cancelled":
        filtered = schedules.filter((s) => s.status === "cancelled");
        break;
      default:
        // "all" - no filtering
        break;
    }

    // Sort logic based on filter type
    if (filter === "all") {
      // For "Tổng số lịch": Sort by status priority (waiting first), then by date (closest first)
      filtered.sort((a, b) => {
        // Priority order: waiting > cancelled > completed
        const statusPriority = {
          waiting: 3,
          cancelled: 2,
          completed: 1,
        };

        const aPriority = statusPriority[a.status] || 0;
        const bPriority = statusPriority[b.status] || 0;

        // If same status priority, sort by date (closest first - gần nhất tới xa nhất)
        if (aPriority === bPriority) {
          return new Date(a.workDate) - new Date(b.workDate);
        }

        // Otherwise sort by status priority
        return bPriority - aPriority;
      });
    } else {
      // For specific filters: Sort by date (closest first - gần nhất tới xa nhất)
      filtered.sort(
        (a, b) => new Date(a.workDate) - new Date(b.workDate)
      );
    }

    setFilteredSchedules(filtered);
  };

  // Format date to Vietnamese format (DD/MM/YYYY)
  const formatVietnameseDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format major/specialty for display
  const formatMajor = (major) => {
    return getMajorDisplayText(major);
  };

  const openScheduleDetail = async (schedule) => {
    try {
      setSelectedSchedule(schedule);
      setIsLoadingDetails(true);
      setShowDetailModal(true);

      console.log(
        "BookingHistoryScreen: Loading details for schedule:",
        schedule
      );

      // Load booking details
      const bookingResult = await BookingService.getBookingById(
        schedule.bookingID
      );
      let booking = null;
      let careProfile = null;
      let relatives = [];

      if (bookingResult.success) {
        booking = bookingResult.data;
        console.log("BookingHistoryScreen: Booking loaded:", booking);

        // Load care profile details
        if (booking.careProfileID) {
          const careProfileResult =
            await CareProfileService.getCareProfileById(
              booking.careProfileID
            );
          if (careProfileResult.success) {
            careProfile = careProfileResult.data;
            console.log(
              "BookingHistoryScreen: Care profile loaded:",
              careProfile
            );

            // Load relatives associated with this care profile
            const relativesResult =
              await RelativeService.getRelativesByCareProfileId(
                booking.careProfileID
              );
            if (relativesResult.success) {
              relatives = relativesResult.data;
              console.log(
                "BookingHistoryScreen: Relatives loaded:",
                relatives
              );
            }
          }
        }
      }

      // Load service details
      const serviceResult =
        await ServiceTypeService.getServiceTypeById(
          schedule.serviceID
        );
      let service = null;
      if (serviceResult.success) {
        service = serviceResult.data;
        console.log("BookingHistoryScreen: Service loaded:", service);
      }

      // Load customize task details to get more information
      const customizeTasksResult =
        await CustomizeTaskService.getAllCustomizeTasks();
      let customizeTask = null;
      if (customizeTasksResult.success) {
        // Find customize task that matches this schedule
        customizeTask = customizeTasksResult.data.find(
          (task) =>
            task.bookingID === schedule.bookingID &&
            task.serviceID === schedule.serviceID &&
            task.nursingID === schedule.nursingID
        );
        console.log(
          "BookingHistoryScreen: CustomizeTask loaded:",
          customizeTask
        );
      }

      setScheduleDetails({
        booking,
        careProfile,
        service,
        customizeTask,
        relatives,
      });
    } catch (error) {
      console.error(
        "BookingHistoryScreen: Error loading schedule details:",
        error
      );
      Alert.alert("Lỗi", "Không thể tải chi tiết lịch sử đặt lịch");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSchedule(null);
    setScheduleDetails({
      booking: null,
      careProfile: null,
      service: null,
      customizeTask: null,
      relatives: [],
    });
  };

  const renderFilterButton = (filter, label, count) => {
    const isSelected = selectedFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterButton,
          isSelected && styles.selectedFilterButton,
        ]}
        onPress={() => applyFilter(filter)}>
        <Text style={styles.filterCount}>{count}</Text>
        <Text
          style={[
            styles.filterLabel,
            isSelected && styles.selectedFilterLabel,
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderScheduleItem = (schedule) => {
    return (
      <TouchableOpacity
        key={schedule.workScheduleID}
        style={styles.scheduleItem}
        onPress={() => openScheduleDetail(schedule)}>
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.95)",
            "rgba(255, 255, 255, 0.85)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleDate}>
                {formatVietnameseDate(schedule.workDate)}
              </Text>
              <Text style={styles.scheduleTime}>
                {WorkScheduleService.formatTime(schedule.workDate)} -{" "}
                {WorkScheduleService.formatTime(schedule.endTime)}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: WorkScheduleService.getStatusColor(
                    schedule.status
                  ),
                },
              ]}>
              <Text style={styles.statusText}>
                {WorkScheduleService.formatStatus(schedule.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.serviceTitle}>
            Dịch vụ ID: {schedule.serviceID}
          </Text>

          <View style={styles.scheduleFooter}>
            <View style={styles.bookingInfo}>
              <Ionicons
                name="clipboard-outline"
                size={16}
                color="#666"
              />
              <Text style={styles.bookingId}>
                Đặt lịch #{schedule.bookingID}
              </Text>
            </View>
            <Text style={styles.attendanceStatus}>
              {schedule.isAttended ? "Đã tham gia" : "Chưa tham gia"}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!showDetailModal || !selectedSchedule) return null;

    return (
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDetailModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Chi tiết lịch sử đặt lịch
              </Text>
              <TouchableOpacity onPress={closeDetailModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {isLoadingDetails ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  Đang tải thông tin...
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.modalBody}>
                {/* Care Profile Info - Show first and prominently */}
                {scheduleDetails.careProfile && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>
                      Thông tin khách hàng
                    </Text>
                    <View
                      style={[
                        styles.detailCard,
                        styles.highlightedCard,
                      ]}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Tên:</Text>
                        <Text
                          style={[
                            styles.detailValue,
                            styles.patientName,
                          ]}>
                          {scheduleDetails.careProfile.profileName}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          Ngày sinh:
                        </Text>
                        <Text style={styles.detailValue}>
                          {CareProfileService.formatDate(
                            scheduleDetails.careProfile.dateOfBirth
                          )}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          Số điện thoại:
                        </Text>
                        <Text
                          style={[
                            styles.detailValue,
                            styles.phoneNumber,
                          ]}>
                          {scheduleDetails.careProfile.phoneNumber}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          Địa chỉ:
                        </Text>
                        <Text style={styles.detailValue}>
                          {scheduleDetails.careProfile.address}
                        </Text>
                      </View>
                      {scheduleDetails.careProfile.note && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>
                            Ghi chú:
                          </Text>
                          <Text style={styles.detailValue}>
                            {scheduleDetails.careProfile.note}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Work Schedule Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>
                    Thông tin lịch làm việc
                  </Text>
                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Mã lịch:</Text>
                      <Text style={styles.detailValue}>
                        #{selectedSchedule.workScheduleID}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        Ngày làm việc:
                      </Text>
                      <Text style={styles.detailValue}>
                        {WorkScheduleService.formatDate(
                          selectedSchedule.workDate
                        )}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        Thời gian:
                      </Text>
                      <Text style={styles.detailValue}>
                        {WorkScheduleService.formatTime(
                          selectedSchedule.workDate
                        )}{" "}
                        -{" "}
                        {WorkScheduleService.formatTime(
                          selectedSchedule.endTime
                        )}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        Trạng thái:
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              WorkScheduleService.getStatusColor(
                                selectedSchedule.status
                              ),
                          },
                        ]}>
                        <Text style={styles.statusText}>
                          {WorkScheduleService.formatStatus(
                            selectedSchedule.status
                          )}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        Tham gia:
                      </Text>
                      <Text style={styles.detailValue}>
                        {selectedSchedule.isAttended
                          ? "Đã tham gia"
                          : "Chưa tham gia"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Service Info */}
                {scheduleDetails.service && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>
                      Thông tin dịch vụ
                    </Text>
                    <View style={styles.detailCard}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          Tên dịch vụ:
                        </Text>
                        <Text style={styles.detailValue}>
                          {scheduleDetails.service.serviceName}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Mô tả:</Text>
                        <Text style={styles.detailValue}>
                          {scheduleDetails.service.description}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          Thời gian dự kiến:
                        </Text>
                        <Text style={styles.detailValue}>
                          {ServiceTypeService.formatDuration(
                            scheduleDetails.service.duration
                          )}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          Chuyên môn:
                        </Text>
                        <Text style={styles.detailValue}>
                          {formatMajor(scheduleDetails.service.major)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Booking Info */}
                {scheduleDetails.booking && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>
                      Thông tin đặt lịch
                    </Text>
                    <View style={styles.detailCard}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          Mã đặt lịch:
                        </Text>
                        <Text style={styles.detailValue}>
                          #{scheduleDetails.booking.bookingID}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          Ngày tạo:
                        </Text>
                        <Text style={styles.detailValue}>
                          {WorkScheduleService.formatDate(
                            scheduleDetails.booking.createdAt
                          )}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          Thời gian đặt:
                        </Text>
                        <Text style={styles.detailValue}>
                          {WorkScheduleService.formatDateTime(
                            scheduleDetails.booking.workdate
                          )}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          Trạng thái đặt lịch:
                        </Text>
                        <Text style={styles.detailValue}>
                          {scheduleDetails.booking.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Relatives Info */}
                {scheduleDetails.relatives &&
                  scheduleDetails.relatives.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>
                        Thông tin người thân (
                        {scheduleDetails.relatives.length})
                      </Text>
                      {scheduleDetails.relatives.map(
                        (relative, index) => (
                          <View
                            key={index}
                            style={[
                              styles.detailCard,
                              { marginBottom: 10 },
                            ]}>
                            <Text
                              style={[
                                styles.sectionTitle,
                                { fontSize: 14, marginBottom: 8 },
                              ]}>
                              Người thân #{index + 1}
                            </Text>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>
                                Tên:
                              </Text>
                              <Text
                                style={[
                                  styles.detailValue,
                                  styles.patientName,
                                ]}>
                                {relative.relativeName ||
                                  relative.profileName ||
                                  relative.fullName ||
                                  relative.name ||
                                  "Chưa cập nhật"}
                              </Text>
                            </View>
                            {(relative.dateOfBirth ||
                              relative.birthDate) && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                  Ngày sinh:
                                </Text>
                                <Text style={styles.detailValue}>
                                  {RelativeService.formatDate(
                                    relative.dateOfBirth ||
                                      relative.birthDate
                                  )}
                                </Text>
                              </View>
                            )}
                            {(relative.phoneNumber ||
                              relative.phone) && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                  Số điện thoại:
                                </Text>
                                <Text
                                  style={[
                                    styles.detailValue,
                                    styles.phoneNumber,
                                  ]}>
                                  {relative.phoneNumber ||
                                    relative.phone}
                                </Text>
                              </View>
                            )}
                            {relative.address && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                  Địa chỉ:
                                </Text>
                                <Text style={styles.detailValue}>
                                  {relative.address}
                                </Text>
                              </View>
                            )}
                            {relative.gender && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                  Giới tính:
                                </Text>
                                <Text style={styles.detailValue}>
                                  {RelativeService.formatGenderDisplay(
                                    relative.gender
                                  )}
                                </Text>
                              </View>
                            )}
                            {relative.relationship && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                  Mối quan hệ:
                                </Text>
                                <Text style={styles.detailValue}>
                                  {relative.relationship}
                                </Text>
                              </View>
                            )}
                            {relative.note && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                  Ghi chú:
                                </Text>
                                <Text style={styles.detailValue}>
                                  {relative.note}
                                </Text>
                              </View>
                            )}
                          </View>
                        )
                      )}
                    </View>
                  )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeDetailModal}>
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}>
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
      style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch Sử Đặt Lịch</Text>
        <TouchableOpacity
          onPress={() => {
            const nursingID =
              userData?.nursingID ||
              userData?.nursing_id ||
              userData?.id ||
              1;
            loadWorkSchedules(nursingID);
          }}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton("all", "Tổng số lịch", stats.total)}
        {renderFilterButton(
          "completed",
          "Đã hoàn thành",
          stats.completed
        )}
        {renderFilterButton("waiting", "Chờ xác nhận", stats.waiting)}
        {renderFilterButton("cancelled", "Đã hủy", stats.cancelled)}
      </View>

      {/* Schedule List */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Lịch sử gần đây</Text>
        {filteredSchedules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Không có lịch sử đặt lịch nào
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.schedulesList}
            showsVerticalScrollIndicator={false}>
            {filteredSchedules.map((schedule) =>
              renderScheduleItem(schedule)
            )}
          </ScrollView>
        )}
      </View>

      {/* Detail Modal */}
      {renderDetailModal()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedFilterButton: {
    borderColor: "#4FC3F7",
    backgroundColor: "rgba(79, 195, 247, 0.1)",
  },
  filterCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  filterLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  selectedFilterLabel: {
    color: "#4FC3F7",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  schedulesList: {
    flex: 1,
  },
  scheduleItem: {
    marginBottom: 15,
  },
  scheduleCard: {
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  scheduleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookingId: {
    fontSize: 13,
    color: "#666",
    marginLeft: 5,
  },
  attendanceStatus: {
    fontSize: 13,
    color: "#4FC3F7",
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
  },
  highlightedCard: {
    backgroundColor: "#e3f2fd",
    borderWidth: 2,
    borderColor: "#4FC3F7",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  patientName: {
    fontSize: 16,
    color: "#4FC3F7",
    fontWeight: "bold",
  },
  phoneNumber: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  closeButton: {
    backgroundColor: "#4FC3F7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
