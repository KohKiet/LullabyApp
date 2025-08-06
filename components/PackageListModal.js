import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ServiceTaskService from "../services/serviceTaskService";
import ServiceTypeService from "../services/serviceTypeService";

export default function PackageListModal({
  visible,
  onClose,
  packages,
  title,
  isLoading,
  onBooking,
}) {
  const [expandedPackages, setExpandedPackages] = useState(new Set());
  const [packageTasks, setPackageTasks] = useState({});
  const [selectedPackage, setSelectedPackage] = useState(null);
  // Calendar modal state
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedMinute, setSelectedMinute] = useState(null);

  // Chỉ cho phép chọn giờ từ 6:00 đến 17:00, phút: 00, 10, 20, 30, 40, 50
  const hours = Array.from({ length: 12 }, (_, i) => i + 6);
  const minutes = [0, 10, 20, 30, 40, 50];

  // Mở calendar modal
  const openCalendar = () => {
    setShowCalendar(true);
  };
  const closeCalendar = () => setShowCalendar(false);
  // Khi chọn ngày xong, mở picker giờ
  const handleCalendarConfirm = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
    // Reset giờ phút khi chọn ngày mới
    setSelectedHour(null);
    setSelectedMinute(null);
    // Mở picker giờ ngay lập tức
    setShowTimePicker(true);
  };
  // Khi chọn giờ xong
  const handleTimeConfirm = (hour, minute) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setShowTimePicker(false);
  };
  // Reset khi chọn lại ngày
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedHour(null);
    setSelectedMinute(null);
    setShowTimePicker(true);
  };

  // Kiểm tra hợp lệ: phải sau 3h10p từ hiện tại và trong khoảng 6:00-17:00
  const isValidDateTime = () => {
    if (
      !selectedDate ||
      selectedHour === null ||
      selectedMinute === null
    )
      return false;
    const now = new Date();
    const minTime = new Date(
      now.getTime() + (3 * 60 + 10) * 60 * 1000
    );
    const chosen = new Date(selectedDate);
    chosen.setHours(selectedHour, selectedMinute, 0, 0);
    if (chosen <= minTime) return false;
    if (selectedHour < 6 || selectedHour >= 17) return false;
    return true;
  };

  // Format hiển thị
  const formatDateTime = () => {
    if (
      !selectedDate ||
      selectedHour === null ||
      selectedMinute === null
    )
      return "";
    const d = selectedDate;
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    const hour = selectedHour.toString().padStart(2, "0");
    const minute = selectedMinute.toString().padStart(2, "0");
    return `${hour}:${minute} - ${day}/${month}/${year}`;
  };

  const resetSelection = () => {
    setSelectedPackage(null);
  };

  const togglePackage = async (packageId) => {
    console.log(
      "PackageListModal: togglePackage called for packageId:",
      packageId
    );
    console.log(
      "PackageListModal: Current expandedPackages:",
      Array.from(expandedPackages)
    );

    const newExpanded = new Set(expandedPackages);

    if (newExpanded.has(packageId)) {
      // Collapse
      console.log("PackageListModal: Collapsing package", packageId);
      newExpanded.delete(packageId);
    } else {
      // Expand - load tasks if not already loaded
      console.log("PackageListModal: Expanding package", packageId);
      newExpanded.add(packageId);
      if (!packageTasks[packageId]) {
        console.log(
          "PackageListModal: Loading tasks for package",
          packageId
        );
        await loadPackageTasks(packageId);
      } else {
        console.log(
          "PackageListModal: Tasks already loaded for package",
          packageId
        );
      }
    }

    console.log(
      "PackageListModal: New expandedPackages:",
      Array.from(newExpanded)
    );
    setExpandedPackages(newExpanded);
  };

  const selectPackage = (packageId) => {
    setSelectedPackage(
      selectedPackage === packageId ? null : packageId
    );
  };

  const handleBooking = async () => {
    if (!selectedPackage) {
      Alert.alert("Lỗi", "Vui lòng chọn một gói dịch vụ");
      return;
    }
    if (!isValidDateTime()) {
      Alert.alert("Lỗi", "Vui lòng chọn thời gian đặt lịch hợp lệ");
      return;
    }
    const packageData = packages.find(
      (p) => p.serviceID === selectedPackage
    );
    if (!packageData) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin gói dịch vụ");
      return;
    }
    if (onBooking) {
      // Tạo workdate theo timezone local
      const workdate = new Date(selectedDate);
      workdate.setHours(selectedHour, selectedMinute, 0, 0);

      // Chuyển đổi sang ISO string nhưng giữ nguyên timezone local
      const year = workdate.getFullYear();
      const month = String(workdate.getMonth() + 1).padStart(2, "0");
      const day = String(workdate.getDate()).padStart(2, "0");
      const hours = String(workdate.getHours()).padStart(2, "0");
      const minutes = String(workdate.getMinutes()).padStart(2, "0");
      const seconds = String(workdate.getSeconds()).padStart(2, "0");

      // Tạo ISO string theo timezone local (không có Z ở cuối)
      const localISOString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

      console.log("PackageListModal: Selected date:", selectedDate);
      console.log("PackageListModal: Selected hour:", selectedHour);
      console.log(
        "PackageListModal: Selected minute:",
        selectedMinute
      );
      console.log("PackageListModal: Created workdate:", workdate);
      console.log(
        "PackageListModal: Local ISO string:",
        localISOString
      );

      const result = await onBooking({
        type: "package",
        packageId: selectedPackage,
        packageData: packageData,
        totalAmount: packageData.price,
        workdate: localISOString,
      });
      if (result && result.success) {
        resetSelection();
        setSelectedDate(null);
        setSelectedHour(null);
        setSelectedMinute(null);
      }
    }
  };

  // Thêm UI chọn thời gian đặt lịch
  const renderDateTimeSection = () => (
    <View style={styles.dateTimeSection}>
      <Text style={styles.dateTimeLabel}>
        Chọn thời gian đặt lịch
      </Text>
      <TouchableOpacity
        style={styles.dateTimeButton}
        onPress={openCalendar}>
        <Ionicons name="calendar-outline" size={20} color="#666" />
        <Text style={styles.dateTimeButtonText}>
          {isValidDateTime() ? formatDateTime() : "Chọn ngày và giờ"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>
      {!isValidDateTime() && selectedDate && (
        <Text style={styles.errorText}>
          Thời gian phải sau 3h10p từ hiện tại, từ 6:00 đến 17:00
        </Text>
      )}
    </View>
  );

  const loadPackageTasks = async (packageId) => {
    try {
      console.log(
        "PackageListModal: Loading tasks for package ID:",
        packageId
      );
      const result =
        await ServiceTaskService.getServiceTasksByPackageId(
          packageId
        );
      console.log("PackageListModal: Tasks result:", result);
      console.log("PackageListModal: Tasks data:", result.data);
      console.log("PackageListModal: Tasks success:", result.success);

      if (result.success) {
        console.log(
          "PackageListModal: Setting tasks for package",
          packageId,
          ":",
          result.data
        );
        setPackageTasks((prev) => {
          const newState = {
            ...prev,
            [packageId]: result.data,
          };
          console.log(
            "PackageListModal: New packageTasks state:",
            newState
          );
          return newState;
        });
        console.log(
          "PackageListModal: Tasks loaded for package",
          packageId,
          ":",
          result.data.length,
          "items"
        );
      } else {
        console.log(
          "PackageListModal: Failed to load tasks:",
          result.error
        );
      }
    } catch (error) {
      console.error(
        "PackageListModal: Error loading package tasks:",
        error
      );
    }
  };

  const renderPackageItem = ({ item }) => {
    const isExpanded = expandedPackages.has(item.serviceID);
    const isSelected = selectedPackage === item.serviceID;
    const tasks = packageTasks[item.serviceID] || [];

    console.log(
      "PackageListModal: Rendering package",
      item.serviceID
    );
    console.log("PackageListModal: isExpanded:", isExpanded);
    console.log(
      "PackageListModal: tasks for package",
      item.serviceID,
      ":",
      tasks
    );
    console.log("PackageListModal: tasks.length:", tasks.length);

    return (
      <View
        style={[
          styles.packageItem,
          isSelected && styles.selectedPackageItem,
        ]}>
        {/* Package Header */}
        <TouchableOpacity
          style={styles.packageHeader}
          onPress={() => selectPackage(item.serviceID)}>
          <View style={styles.packageInfo}>
            <Text style={styles.packageName}>{item.serviceName}</Text>
            <View style={styles.packagePriceContainer}>
              <Text style={styles.packagePrice}>
                {ServiceTypeService.formatPrice(item.price)}
              </Text>
            </View>
          </View>
          <View style={styles.packageMeta}>
            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.duration}>
                {ServiceTypeService.formatDuration(item.duration)}
              </Text>
            </View>
            <View
              style={[
                styles.selectionIndicator,
                isSelected && styles.selectedIndicator,
              ]}>
              <Ionicons
                name={
                  isSelected ? "checkmark-circle" : "ellipse-outline"
                }
                size={20}
                color={isSelected ? "#FF6B6B" : "#CCC"}
              />
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.packageDescription}>
          {item.description}
        </Text>

        {/* Expand Tasks Button */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => togglePackage(item.serviceID)}>
          <Text style={styles.expandButtonText}>
            {isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#666"
          />
        </TouchableOpacity>

        {/* Expandable Tasks Section */}
        {isExpanded && (
          <View style={styles.tasksContainer}>
            <Text style={styles.tasksTitle}>
              Các dịch vụ bao gồm:
            </Text>
            {(() => {
              console.log(
                "PackageListModal: Rendering tasks section for package",
                item.serviceID
              );
              console.log(
                "PackageListModal: tasks.length:",
                tasks.length
              );
              console.log("PackageListModal: tasks:", tasks);

              if (tasks.length > 0) {
                console.log(
                  "PackageListModal: Rendering",
                  tasks.length,
                  "tasks"
                );
                return tasks.map((task, index) => {
                  console.log(
                    "PackageListModal: Rendering task",
                    index,
                    ":",
                    task
                  );
                  return (
                    <View
                      key={task.serviceTaskID}
                      style={styles.taskItem}>
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskOrder}>
                          {task.taskOrder}.
                        </Text>
                        <Text style={styles.taskDescription}>
                          {task.description}
                        </Text>
                        <View style={styles.taskPriceContainer}>
                          <Text style={styles.taskPrice}>
                            {ServiceTaskService.formatPrice(
                              task.price
                            )}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.taskFooter}>
                        <View style={styles.quantityContainer}>
                          <Ionicons
                            name="repeat-outline"
                            size={14}
                            color="#666"
                          />
                          <Text style={styles.quantity}>
                            Số lượng: {task.quantity}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                });
              } else {
                console.log(
                  "PackageListModal: No tasks, showing loading message"
                );
                return (
                  <View style={styles.noTasksContainer}>
                    <Text style={styles.noTasksText}>
                      Đang tải dịch vụ...
                    </Text>
                  </View>
                );
              }
            })()}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={48} color="#CCC" />
      <Text style={styles.emptyText}>
        {isLoading ? "Đang tải..." : "Không có gói dịch vụ nào"}
      </Text>
    </View>
  );

  const selectedPackageData = packages.find(
    (p) => p.serviceID === selectedPackage
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={packages}
            renderItem={renderPackageItem}
            keyExtractor={(item) => item.serviceID.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
          />

          {/* Booking Summary */}
          {selectedPackage && selectedPackageData && (
            <View style={styles.bookingSummary}>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryText}>
                  Gói đã chọn: {selectedPackageData.serviceName}
                </Text>
                <Text style={styles.totalAmount}>
                  Tổng tiền:{" "}
                  {ServiceTypeService.formatPrice(
                    selectedPackageData.price
                  )}
                </Text>
              </View>

              {/* Thêm phần chọn thời gian */}
              {renderDateTimeSection()}

              <TouchableOpacity
                style={[
                  styles.bookingButton,
                  !isValidDateTime() && styles.disabledBookingButton,
                ]}
                onPress={handleBooking}
                disabled={!isValidDateTime()}>
                <Text
                  style={[
                    styles.bookingButtonText,
                    !isValidDateTime() &&
                      styles.disabledBookingButtonText,
                  ]}>
                  Tiến hành đặt lịch
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      {/* Modal calendar */}
      <DateTimePickerModal
        isVisible={showCalendar}
        mode="date"
        onConfirm={handleCalendarConfirm}
        onCancel={closeCalendar}
        date={selectedDate || new Date()}
        minimumDate={new Date()}
      />
      {/* Modal chọn giờ */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerTitle}>Chọn giờ</Text>
            <View style={styles.timePickerScrollRow}>
              <ScrollView style={styles.timeScroll}>
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeItem,
                      hour === selectedHour &&
                        styles.selectedTimeItem,
                    ]}
                    onPress={() => setSelectedHour(hour)}>
                    <Text
                      style={[
                        styles.timeText,
                        hour === selectedHour &&
                          styles.selectedTimeText,
                      ]}>
                      {hour.toString().padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.timeSeparator}>:</Text>
              <ScrollView style={styles.timeScroll}>
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeItem,
                      minute === selectedMinute &&
                        styles.selectedTimeItem,
                    ]}
                    onPress={() => setSelectedMinute(minute)}>
                    <Text
                      style={[
                        styles.timeText,
                        minute === selectedMinute &&
                          styles.selectedTimeText,
                      ]}>
                      {minute.toString().padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.timePickerFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTimePicker(false)}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (selectedHour === null ||
                    selectedMinute === null) && {
                    backgroundColor: "#CCC",
                  },
                ]}
                onPress={() => {
                  if (
                    selectedHour !== null &&
                    selectedMinute !== null
                  ) {
                    setShowTimePicker(false);
                  }
                }}
                disabled={
                  selectedHour === null || selectedMinute === null
                }>
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "90%",
    height: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  packageItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  selectedPackageItem: {
    borderLeftColor: "#4CAF50", // Green for selected
    borderLeftWidth: 4,
    backgroundColor: "#E8F5E9", // Light green background for selected
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  packageInfo: {
    flex: 1,
    marginRight: 10,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  packagePriceContainer: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  packagePrice: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  packageMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  duration: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  expandButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    marginTop: 8,
  },
  expandButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  tasksContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
  },
  tasksTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  taskItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#4CAF50",
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  taskOrder: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4CAF50",
    marginRight: 8,
    marginTop: 2,
  },
  taskDescription: {
    fontSize: 13,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  taskPriceContainer: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskPrice: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantity: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  noTasksContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noTasksText: {
    fontSize: 14,
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
  selectionIndicator: {
    marginLeft: 10,
  },
  selectedIndicator: {
    color: "#FF6B6B",
  },
  bookingSummary: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryInfo: {
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  bookingButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bookingButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  dateTimeSection: {
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  dateTimeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
    marginLeft: 10,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    width: "80%",
    height: "70%", // Tăng từ 60% lên 70%
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  timePickerScrollRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    flex: 1, // Thêm flex: 1 để chiếm hết không gian còn lại
  },
  timeScroll: {
    flex: 1,
  },
  timeItem: {
    alignItems: "center",
    paddingVertical: 15, // Tăng padding
  },
  timeText: {
    fontSize: 28, // Tăng từ 20 lên 28
    fontWeight: "bold",
    color: "#333",
  },
  selectedTimeItem: {
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
  },
  selectedTimeText: {
    color: "#FFFFFF",
  },
  timeSeparator: {
    fontSize: 20,
    color: "#333",
    marginHorizontal: 10,
  },
  timePickerFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#FF6B6B",
  },
  confirmButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  disabledBookingButton: {
    backgroundColor: "#CCC",
    opacity: 0.7,
  },
  disabledBookingButtonText: {
    color: "#999",
  },
});
