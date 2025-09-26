import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import RelativeService from "../services/relativeService";
import ServiceTypeService from "../services/serviceTypeService";

export default function ServiceListModal({
  visible,
  onClose,
  services,
  title,
  isLoading,
  onBooking,
  selectedCareProfile,
}) {
  const [selectedServices, setSelectedServices] = useState({});
  const [relativeCount, setRelativeCount] = useState(0);
  // Thêm state cho chọn ngày/giờ
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedMinute, setSelectedMinute] = useState(null);
  // Chỉ cho phép chọn giờ từ 8:00 đến 19:50, phút: 00, 10, 20, 30, 40, 50
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  const minutes = [0, 10, 20, 30, 40, 50];

  // Refs for scroll navigation
  const scrollViewRef = useRef(null);
  const momSectionRef = useRef(null);
  const babySectionRef = useRef(null);

  // Navigation functions
  const scrollToMomSection = () => {
    momSectionRef.current?.measureLayout(
      scrollViewRef.current,
      (x, y) => {
        scrollViewRef.current?.scrollTo({
          y: y - 20,
          animated: true,
        });
      },
      () => {}
    );
  };

  const scrollToBabySection = () => {
    babySectionRef.current?.measureLayout(
      scrollViewRef.current,
      (x, y) => {
        scrollViewRef.current?.scrollTo({
          y: y - 20,
          animated: true,
        });
      },
      () => {}
    );
  };

  // Load relative count when modal opens
  useEffect(() => {
    if (visible && selectedCareProfile?.careProfileID) {
      loadRelativeCount();
    }
  }, [visible, selectedCareProfile]);

  // Reset modal states when modal closes
  useEffect(() => {
    if (!visible) {
      setShowCalendar(false);
      setShowTimePicker(false);
    }
  }, [visible]);

  const loadRelativeCount = async () => {
    try {
      const result =
        await RelativeService.getRelativeCountByCareProfile(
          selectedCareProfile.careProfileID
        );
      if (result.success) {
        setRelativeCount(result.relativeCount);
      }
    } catch (error) {
      console.error("Error loading relative count:", error);
      setRelativeCount(0);
    }
  };

  const resetSelection = () => {
    setSelectedServices({});
    setSelectedDate(null);
    setSelectedHour(null);
    setSelectedMinute(null);
    setShowCalendar(false);
    setShowTimePicker(false);
  };

  const toggleServiceSelection = (serviceId) => {
    setSelectedServices((prev) => {
      const newSelected = { ...prev };
      if (newSelected[serviceId]) {
        delete newSelected[serviceId];
      } else {
        newSelected[serviceId] = { quantity: 1 };
      }
      return newSelected;
    });
  };

  const updateQuantity = (serviceId, delta) => {
    setSelectedServices((prev) => {
      const newSelected = { ...prev };
      if (newSelected[serviceId]) {
        const service = services.find(
          (s) => s.serviceID === serviceId
        );
        const currentQuantity = newSelected[serviceId].quantity || 1;

        // Xác định số suất tối đa
        let maxQuantity = 1;
        if (service && !service.forMom) {
          // Nếu forMom = false, cho phép chọn tối đa bằng số relative
          maxQuantity = Math.max(1, relativeCount);
        }
        // Nếu forMom = true, chỉ cho phép chọn 1 suất

        const newQuantity = Math.max(
          1,
          Math.min(maxQuantity, currentQuantity + delta)
        );

        newSelected[serviceId] = {
          ...newSelected[serviceId],
          quantity: newQuantity,
        };
      }
      return newSelected;
    });
  };

  const calculateTotalAmount = () => {
    return Object.entries(selectedServices).reduce(
      (total, [serviceId, data]) => {
        const service = services.find(
          (s) => s.serviceID === parseInt(serviceId)
        );
        return total + (service ? service.price * data.quantity : 0);
      },
      0
    );
  };

  // Kiểm tra hợp lệ: phải sau 2 giờ từ hiện tại và trong khoảng 8:00-19:50
  const isValidDateTime = () => {
    if (
      !selectedDate ||
      selectedHour === null ||
      selectedMinute === null
    )
      return false;
    const now = new Date();
    const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const chosen = new Date(selectedDate);
    chosen.setHours(selectedHour, selectedMinute, 0, 0);
    if (chosen <= minTime) return false;
    // Validate within 08:00 to 19:50
    if (selectedHour < 8) return false;
    if (selectedHour > 19) return false;
    if (selectedHour === 19 && selectedMinute > 50) return false;
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
  // Mở calendar modal
  const openCalendar = () => {
    console.log("Opening calendar");
    setShowCalendar(true);
  };
  const closeCalendar = () => setShowCalendar(false);
  // Khi chọn ngày xong, không tự động mở picker giờ
  const handleCalendarConfirm = (date) => {
    console.log("Date selected:", date);
    setSelectedDate(date);
    setShowCalendar(false);
    // Không reset giờ khi chọn ngày mới, để người dùng có thể giữ nguyên giờ
    // setSelectedHour(null);
    // setSelectedMinute(null);
  };

  const handleBooking = async () => {
    if (Object.keys(selectedServices).length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một dịch vụ");
      return;
    }
    if (!isValidDateTime()) {
      Alert.alert(
        "Thông báo",
        "Vui lòng chọn thời gian đặt lịch hợp lệ"
      );
      return;
    }
    const selectedServicesList = Object.entries(selectedServices).map(
      ([serviceId, data]) => ({
        serviceID: parseInt(serviceId),
        quantity: data.quantity,
      })
    );
    const totalAmount = calculateTotalAmount();
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

      console.log("ServiceListModal: Selected date:", selectedDate);
      console.log("ServiceListModal: Selected hour:", selectedHour);
      console.log(
        "ServiceListModal: Selected minute:",
        selectedMinute
      );
      console.log("ServiceListModal: Created workdate:", workdate);
      console.log(
        "ServiceListModal: Local ISO string:",
        localISOString
      );

      const result = await onBooking({
        type: "service",
        services: selectedServicesList,
        totalAmount: totalAmount,
        workdate: localISOString,
        careProfileID: selectedCareProfile?.careProfileID,
      });
      if (result && result.success) {
        resetSelection();
      }
    }
  };

  const renderServiceItem = ({ item, isMomService }) => {
    const isSelected = selectedServices[item.serviceID];
    const quantity = isSelected ? isSelected.quantity : 0;

    return (
      <View
        style={[
          styles.serviceItem,
          isMomService
            ? styles.momServiceItem
            : styles.babyServiceItem,
          isSelected &&
            (isMomService
              ? styles.selectedMomServiceItem
              : styles.selectedBabyServiceItem),
        ]}>
        <TouchableOpacity
          style={styles.serviceHeader}
          onPress={() => toggleServiceSelection(item.serviceID)}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <View
              style={[
                styles.servicePriceContainer,
                isMomService
                  ? styles.momPriceContainer
                  : styles.babyPriceContainer,
              ]}>
              <Text style={styles.servicePrice}>
                {ServiceTypeService.formatPrice(item.price)}
              </Text>
            </View>
          </View>
          <View style={styles.serviceMeta}>
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
                color={isSelected ? "#4CAF50" : "#CCC"}
              />
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.description}>{item.description}</Text>

        {/* Quantity Controls - Only show if selected */}
        {isSelected && (
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Suất:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.serviceID, -1)}>
                <Ionicons name="remove" size={16} color="#FF6B6B" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  (() => {
                    const service = services.find(
                      (s) => s.serviceID === item.serviceID
                    );
                    const maxQuantity =
                      service && !service.forMom
                        ? Math.max(1, relativeCount)
                        : 1;
                    return quantity >= maxQuantity
                      ? styles.disabledQuantityButton
                      : null;
                  })(),
                ]}
                onPress={() => updateQuantity(item.serviceID, 1)}
                disabled={(() => {
                  const service = services.find(
                    (s) => s.serviceID === item.serviceID
                  );
                  const maxQuantity =
                    service && !service.forMom
                      ? Math.max(1, relativeCount)
                      : 1;
                  return quantity >= maxQuantity;
                })()}>
                <Ionicons
                  name="add"
                  size={16}
                  color={(() => {
                    const service = services.find(
                      (s) => s.serviceID === item.serviceID
                    );
                    const maxQuantity =
                      service && !service.forMom
                        ? Math.max(1, relativeCount)
                        : 1;
                    return quantity >= maxQuantity
                      ? "#CCC"
                      : "#4CAF50";
                  })()}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtotalText}>
              Tổng:{" "}
              {ServiceTypeService.formatPrice(item.price * quantity)}
            </Text>
            {/* Hiển thị thông tin giới hạn */}
            <Text style={styles.quantityLimitText}>
              {(() => {
                const service = services.find(
                  (s) => s.serviceID === item.serviceID
                );
                if (service && service.forMom) {
                  return "Chỉ được chọn 1 suất (dịch vụ cho mẹ)";
                } else {
                  return `Tối đa ${relativeCount} suất (theo số người trong hồ sơ)`;
                }
              })()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={48} color="#CCC" />
      <Text style={styles.emptyText}>
        {isLoading ? "Đang tải..." : "Không có dịch vụ nào"}
      </Text>
    </View>
  );

  // Thêm UI chọn thời gian đặt lịch
  const renderDateTimeSection = () => (
    <View style={styles.dateTimeSection}>
      <Text style={styles.dateTimeLabel}>
        Chọn thời gian đặt lịch
      </Text>

      {/* Nút chọn ngày */}
      <TouchableOpacity
        style={styles.dateTimeButton}
        onPress={() => {
          console.log("Date button pressed");
          openCalendar();
        }}>
        <Ionicons name="calendar-outline" size={20} color="#666" />
        <Text style={styles.dateTimeButtonText}>
          {selectedDate
            ? `${selectedDate
                .getDate()
                .toString()
                .padStart(2, "0")}/${(selectedDate.getMonth() + 1)
                .toString()
                .padStart(2, "0")}/${selectedDate.getFullYear()}`
            : "Chọn ngày"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>

      {/* Nút chọn giờ */}
      <TouchableOpacity
        style={[styles.dateTimeButton, { marginTop: 10 }]}
        onPress={() => {
          console.log("Time button pressed");
          setShowTimePicker(true);
        }}>
        <Ionicons name="time-outline" size={20} color="#666" />
        <Text style={styles.dateTimeButtonText}>
          {selectedHour !== null && selectedMinute !== null
            ? `${selectedHour
                .toString()
                .padStart(2, "0")}:${selectedMinute
                .toString()
                .padStart(2, "0")}`
            : "Chọn giờ"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>

      {!isValidDateTime() && selectedDate && (
        <Text style={styles.errorText}>
          Thời gian phải sau 2 giờ từ hiện tại, từ 8:00 đến 19:50
        </Text>
      )}
    </View>
  );

  const selectedCount = Object.keys(selectedServices).length;
  const totalSuats = Object.values(selectedServices).reduce(
    (total, service) => total + (service.quantity || 1),
    0
  );
  const totalAmount = calculateTotalAmount();

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
            <View style={styles.headerButtons}>
              {/* Navigation buttons */}
              <View style={styles.navigationButtons}>
                {services.filter((service) => service.forMom === true)
                  .length > 0 && (
                  <TouchableOpacity
                    onPress={scrollToMomSection}
                    style={styles.navButton}>
                    <Ionicons
                      name="woman"
                      size={16}
                      color="#E91E63"
                    />
                    <Text style={styles.navButtonText}>Mẹ</Text>
                  </TouchableOpacity>
                )}
                {services.filter(
                  (service) => service.forMom === false
                ).length > 0 && (
                  <TouchableOpacity
                    onPress={scrollToBabySection}
                    style={styles.navButton}>
                    <Ionicons
                      name="people"
                      size={16}
                      color="#2196F3"
                    />
                    <Text style={styles.navButtonText}>Con</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}>
            {/* Dịch vụ mẹ */}
            {services.filter((service) => service.forMom === true)
              .length > 0 && (
              <>
                <Text
                  ref={momSectionRef}
                  style={styles.sectionTitleMom}>
                  Dịch vụ mẹ
                </Text>
                {services
                  .filter((service) => service.forMom === true)
                  .map((service) => (
                    <View key={service.serviceID}>
                      {renderServiceItem({
                        item: service,
                        isMomService: true,
                      })}
                    </View>
                  ))}
              </>
            )}

            {/* Dịch vụ con */}
            {services.filter((service) => service.forMom === false)
              .length > 0 && (
              <>
                <Text
                  ref={babySectionRef}
                  style={styles.sectionTitleBaby}>
                  Dịch vụ con
                </Text>
                {services
                  .filter((service) => service.forMom === false)
                  .map((service) => (
                    <View key={service.serviceID}>
                      {renderServiceItem({
                        item: service,
                        isMomService: false,
                      })}
                    </View>
                  ))}
              </>
            )}

            {/* Show empty state if no services */}
            {services.length === 0 && renderEmptyState()}
          </ScrollView>

          {/* Booking Summary */}
          {selectedCount > 0 && (
            <View style={styles.bookingSummary}>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryText}>
                  Đã chọn: {selectedCount} dịch vụ ({totalSuats} suất)
                </Text>
                <Text style={styles.totalAmount}>
                  Tổng tiền:{" "}
                  {ServiceTypeService.formatPrice(totalAmount)}
                </Text>
                <Text style={styles.extraFeeNote}>
                  Chưa bao gồm phí phát sinh (nếu có)
                </Text>
              </View>
            </View>
          )}

          {/* Phần chọn thời gian - tách riêng */}
          {selectedCount > 0 && (
            <View style={styles.dateTimeContainer}>
              {renderDateTimeSection()}
            </View>
          )}

          {/* Phần nút đặt lịch - tách riêng */}
          {selectedCount > 0 && (
            <View style={styles.bookingContainer}>
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
        animationType="slide"
        onRequestClose={() => {
          console.log("Time picker modal closed");
          setShowTimePicker(false);
        }}
        onShow={() => {
          console.log("Time picker modal opened");
        }}
        presentationStyle="overFullScreen">
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
                    onPress={() => {
                      console.log("Hour selected:", hour);
                      setSelectedHour(hour);
                    }}>
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
                    onPress={() => {
                      console.log("Minute selected:", minute);
                      setSelectedMinute(minute);
                    }}>
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
                onPress={() => {
                  console.log("Time picker cancelled");
                  setShowTimePicker(false);
                }}>
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
                  console.log(
                    "Time confirm pressed, hour:",
                    selectedHour,
                    "minute:",
                    selectedMinute
                  );
                  if (
                    selectedHour !== null &&
                    selectedMinute !== null
                  ) {
                    console.log("Closing time picker");
                    setShowTimePicker(false);
                    // Time is already set in state, no need to do anything else
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  navigationButtons: {
    flexDirection: "row",
    marginRight: 15,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
    color: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitleMom: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E91E63",
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitleBaby: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  closeButton: {
    padding: 5,
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  serviceItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  momServiceItem: {
    backgroundColor: "#FDF2F8",
    borderLeftColor: "#E91E63",
  },
  babyServiceItem: {
    backgroundColor: "#F0F8FF",
    borderLeftColor: "#2196F3",
  },
  selectedServiceItem: {
    borderLeftColor: "#4CAF50",
    borderLeftWidth: 4,
    backgroundColor: "#E8F5E9", // Lighter green background for selected items
  },
  selectedMomServiceItem: {
    backgroundColor: "#FCE4EC", // Light pink background for selected mom services
    borderLeftColor: "#E91E63",
  },
  selectedBabyServiceItem: {
    backgroundColor: "#E3F2FD", // Light blue background for selected baby services
    borderLeftColor: "#2196F3",
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  servicePriceContainer: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  momPriceContainer: {
    backgroundColor: "#E91E63",
  },
  babyPriceContainer: {
    backgroundColor: "#2196F3",
  },
  servicePrice: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  serviceMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  duration: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  selectionIndicator: {
    padding: 5,
  },
  selectedIndicator: {
    color: "#4CAF50",
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  quantityContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 5,
  },
  quantityButton: {
    padding: 5,
  },
  disabledQuantityButton: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  subtotalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    textAlign: "right",
  },
  quantityLimitText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic",
    textAlign: "center",
  },
  bookingSummary: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  dateTimeContainer: {
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  bookingContainer: {
    padding: 5,
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
  },
  summaryInfo: {
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 1,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  extraFeeNote: {
    fontSize: 10,
    color: "#999",
    marginTop: 5,
    fontStyle: "italic",
  },
  bookingButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bookingButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledBookingButton: {
    backgroundColor: "#CCC",
    opacity: 0.7,
  },
  disabledBookingButtonText: {
    color: "#888",
  },
  dateTimeSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E0E0E0",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CCC",
  },
  dateTimeButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
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
    borderRadius: 20,
    width: "80%",
    height: "70%", // Tăng từ 60% lên 70%
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
    padding: 20,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  timePickerScrollRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    flex: 1, // Thêm flex: 1 để chiếm hết không gian còn lại
  },
  timeScroll: {
    width: "30%",
    flex: 1, // Thêm flex: 1 để scroll area lớn hơn
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
    backgroundColor: "#4CAF50",
    borderRadius: 10,
  },
  selectedTimeText: {
    color: "#FFFFFF",
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 10,
  },
  timePickerFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  cancelButtonText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
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
});
