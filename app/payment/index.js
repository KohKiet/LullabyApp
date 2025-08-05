import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_CONFIG } from "../../services/apiConfig";
import BookingService from "../../services/bookingService";
import CareProfileService from "../../services/careProfileService";
import InvoiceService from "../../services/invoiceService";
import ServiceTaskService from "../../services/serviceTaskService";
import ServiceTypeService from "../../services/serviceTypeService";
import TransactionHistoryService from "../../services/transactionHistoryService";
import WalletService from "../../services/walletService";

export default function PaymentScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();
  const [bookingData, setBookingData] = useState(null);
  const [packageTasks, setPackageTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPackage, setExpandedPackage] = useState(false);
  const [extraData, setExtraData] = useState(null);
  const [careProfileData, setCareProfileData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] =
    useState(false);

  useEffect(() => {
    if (bookingId) {
      loadBookingData();
    }
  }, [bookingId]);

  const loadBookingData = async () => {
    try {
      setIsLoading(true);
      console.log(
        "PaymentScreen: Loading booking data for ID:",
        bookingId
      );

      const result = await BookingService.getBookingById(bookingId);
      console.log("PaymentScreen: Booking data result:", result);

      if (result.success) {
        setBookingData(result.data);

        // Load care profile data
        if (result.data.careProfileID) {
          await loadCareProfileData(result.data.careProfileID);
        }

        // Load invoice data
        await loadInvoiceData(bookingId);

        // Load extra data từ AsyncStorage
        try {
          const storedData = await AsyncStorage.getItem(
            `booking_${bookingId}`
          );
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setExtraData(parsedData);
            console.log(
              "PaymentScreen: Loaded extra data from storage:",
              parsedData
            );

            // Nếu là package, load package tasks
            if (
              parsedData.type === "package" &&
              parsedData.packageId
            ) {
              await loadPackageTasks(parsedData.packageId);
            }
          }
        } catch (error) {
          console.error(
            "Error loading extra data from storage:",
            error
          );
        }
      } else {
        Alert.alert("Lỗi", "Không thể tải thông tin booking");
        router.back();
      }
    } catch (error) {
      console.error("Error loading booking data:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi tải thông tin booking");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadCareProfileData = async (careProfileID) => {
    try {
      console.log(
        "PaymentScreen: Loading care profile data for ID:",
        careProfileID
      );

      const result = await CareProfileService.getCareProfileById(
        careProfileID
      );
      console.log("PaymentScreen: Care profile result:", result);

      if (result.success) {
        setCareProfileData(result.data);
        console.log(
          "PaymentScreen: Care profile loaded:",
          result.data
        );
      } else {
        console.log("PaymentScreen: Care profile not found");
        setCareProfileData(null);
      }
    } catch (error) {
      console.error("Error loading care profile data:", error);
      setCareProfileData(null);
    }
  };

  const loadInvoiceData = async (bookingID) => {
    try {
      console.log(
        "PaymentScreen: Loading invoice data for booking ID:",
        bookingID
      );

      const result = await InvoiceService.getInvoiceByBookingId(
        bookingID
      );
      console.log("PaymentScreen: Invoice data result:", result);

      if (result.success) {
        setInvoiceData(result.data);
        console.log("PaymentScreen: Invoice loaded:", result.data);
        console.log(
          "PaymentScreen: Invoice status:",
          result.data.status
        );
      } else {
        console.log("PaymentScreen: No invoice found for booking");
        setInvoiceData(null);
      }
    } catch (error) {
      console.error("Error loading invoice data:", error);
      setInvoiceData(null);
    }
  };

  const loadPackageTasks = async (packageId) => {
    try {
      console.log(
        "PaymentScreen: Loading package tasks for ID:",
        packageId
      );
      const result =
        await ServiceTaskService.getServiceTasksByPackageId(
          packageId
        );
      console.log("PaymentScreen: Package tasks result:", result);

      if (result.success) {
        setPackageTasks(result.data);
      }
    } catch (error) {
      console.error("Error loading package tasks:", error);
    }
  };

  const testButtonPress = () => {
    console.log("PaymentScreen: Test button pressed!");
    Alert.alert("Test", "Button is working!");
  };

  const testAPICall = async () => {
    try {
      console.log("PaymentScreen: Testing API call...");
      const url = `http://localhost:5294/api/Invoice`;
      console.log("PaymentScreen: Test URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json-patch+json",
        },
        body: JSON.stringify({
          bookingID: parseInt(bookingId),
          content: "Test payment",
        }),
      });

      console.log(
        "PaymentScreen: Test response status:",
        response.status
      );
      const data = await response.json();
      console.log("PaymentScreen: Test response data:", data);

      Alert.alert(
        "API Test",
        `Status: ${response.status}\nData: ${JSON.stringify(data)}`
      );
    } catch (error) {
      console.error("PaymentScreen: Test API error:", error);
      Alert.alert("API Test Error", error.message);
    }
  };

  const handlePayment = async () => {
    console.log("PaymentScreen: handlePayment called");
    console.log("PaymentScreen: bookingData:", bookingData);
    console.log("PaymentScreen: bookingId:", bookingId);

    // 1. Lấy số dư ví - sử dụng careProfileID để lấy accountID
    try {
      setIsProcessingPayment(true);

      // Lấy accountID từ careProfileData
      const accountID = careProfileData?.accountID;
      console.log("PaymentScreen: Account ID for wallet:", accountID);

      if (!accountID) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin tài khoản");
        setIsProcessingPayment(false);
        return;
      }

      const walletResult = await WalletService.getWalletByAccountId(
        accountID
      );
      console.log("PaymentScreen: Wallet result:", walletResult);

      const walletAmount = walletResult.success
        ? walletResult.data.amount
        : 0;
      const totalAmount = bookingData.amount;
      console.log(
        "PaymentScreen: Wallet amount:",
        walletAmount,
        "Total:",
        totalAmount
      );

      // 2. Nếu không đủ tiền, về home
      if (walletAmount < totalAmount) {
        Alert.alert(
          "Ví không đủ tiền",
          "Vui lòng nạp thêm tiền để thanh toán."
        );
        router.replace("/");
        setIsProcessingPayment(false);
        return;
      }

      // 3. Đủ tiền, gọi API thanh toán
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/Invoice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json-patch+json",
          },
          body: JSON.stringify({
            bookingID: parseInt(bookingId),
            content: "Thanh toán booking",
          }),
        }
      );
      const data = await response.json();
      console.log("PaymentScreen: Invoice payment response:", data);

      if (
        response.ok &&
        data.message &&
        data.message.includes("success")
      ) {
        // Reload invoice data để cập nhật trạng thái
        await loadInvoiceData(bookingId);
        Alert.alert("Thành công", "Thanh toán thành công!", [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ]);
      } else {
        Alert.alert("Lỗi", data.message || "Thanh toán thất bại");
      }
    } catch (error) {
      console.error("PaymentScreen: handlePayment error:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi thanh toán");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const processPayment = async () => {
    try {
      console.log("PaymentScreen: processPayment started");
      console.log("PaymentScreen: Booking ID to pay:", bookingId);
      console.log(
        "PaymentScreen: About to call TransactionHistoryService.payInvoice"
      );
      setIsProcessingPayment(true);

      const result = await TransactionHistoryService.payInvoice(
        null,
        bookingId
      );
      console.log("PaymentScreen: Payment API result:", result);

      if (result.success) {
        console.log("PaymentScreen: Payment successful");
        // Reload invoice data để cập nhật status
        loadInvoiceData(bookingId);
      } else {
        console.log("PaymentScreen: Payment failed:", result.error);
        Alert.alert("Lỗi", `Thanh toán thất bại: ${result.error}`);
      }
    } catch (error) {
      console.error("PaymentScreen: Error in processPayment:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi thanh toán");
    } finally {
      console.log(
        "PaymentScreen: Setting isProcessingPayment to false"
      );
      setIsProcessingPayment(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes} - ${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "confirmed":
        return "#4CAF50";
      case "completed":
        return "#2196F3";
      case "cancelled":
        return "#FF6B6B";
      default:
        return "#666";
    }
  };

  const renderPackageDetails = () => {
    if (!extraData || extraData.type !== "package") return null;

    return (
      <View style={styles.packageSection}>
        <View style={styles.packageHeader}>
          <Text style={styles.packageTitle}>Gói dịch vụ đã chọn</Text>
        </View>

        <View style={styles.packageInfo}>
          <Text style={styles.packageName}>
            {extraData.packageData?.serviceName || "Gói dịch vụ"}
          </Text>
          <Text style={styles.packageDescription}>
            {extraData.packageData?.description || ""}
          </Text>
          <View style={styles.packageMeta}>
            <Text style={styles.packagePrice}>
              {ServiceTypeService.formatPrice(
                extraData.packageData?.price || 0
              )}
            </Text>
            <Text style={styles.packageDuration}>
              {ServiceTypeService.formatDuration(
                extraData.packageData?.duration || 0
              )}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpandedPackage(!expandedPackage)}>
          <Text style={styles.expandButtonText}>
            {expandedPackage ? "Ẩn chi tiết" : "Xem chi tiết"}
          </Text>
          <Ionicons
            name={expandedPackage ? "chevron-up" : "chevron-down"}
            size={16}
            color="#666"
          />
        </TouchableOpacity>

        {expandedPackage && (
          <View style={styles.packageTasks}>
            {packageTasks.length > 0 ? (
              packageTasks.map((task, index) => (
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
                  </View>
                  <View style={styles.taskFooter}>
                    <Text style={styles.taskPrice}>
                      {ServiceTaskService.formatPrice(task.price)}
                    </Text>
                    <Text style={styles.taskQuantity}>
                      Số lượng: {task.quantity}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noTasksText}>
                Đang tải chi tiết...
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderServiceDetails = () => {
    if (!extraData || extraData.type !== "service") return null;

    return (
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Dịch vụ đã chọn</Text>
        {extraData.services.map((service, index) => (
          <View key={index} style={styles.serviceItem}>
            <Text style={styles.serviceName}>
              {service.serviceName}
            </Text>
            <View style={styles.serviceDetails}>
              <Text style={styles.servicePrice}>
                {ServiceTypeService.formatPrice(service.price)}
              </Text>
              <Text style={styles.serviceQuantity}>
                Số lượng: {service.quantity}
              </Text>
            </View>
          </View>
        ))}
      </View>
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
            Đang tải thông tin thanh toán...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (!bookingData) {
    return (
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Không tìm thấy thông tin booking
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Booking Info Card */}
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingTitle}>
              Thông tin đặt lịch
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusColor(bookingData.status),
                },
              ]}>
              <Text style={styles.statusText}>
                {formatStatus(bookingData.status)}
              </Text>
            </View>
          </View>

          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mã booking:</Text>
              <Text style={styles.detailValue}>
                #{bookingData.bookingID}
              </Text>
            </View>

            {careProfileData && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Hồ sơ chăm sóc:
                </Text>
                <Text style={styles.detailValue}>
                  {careProfileData.profileName}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Thời gian đặt:</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(bookingData.workdate)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày tạo:</Text>
              <Text style={styles.detailValue}>
                {formatDateOnly(bookingData.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Package/Service Details */}
        {renderPackageDetails()}
        {renderServiceDetails()}

        {/* Payment Summary */}
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Tổng thanh toán</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Tổng tiền:</Text>
            <Text style={styles.amountValue}>
              {ServiceTypeService.formatPrice(bookingData.amount)}
            </Text>
          </View>

          {invoiceData && (
            <View style={styles.invoiceInfo}>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Mã hóa đơn:</Text>
                <Text style={styles.invoiceValue}>
                  #{invoiceData.invoiceID}
                </Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Trạng thái:</Text>
                <Text
                  style={[
                    styles.invoiceValue,
                    {
                      color:
                        invoiceData.status === "paid"
                          ? "#4CAF50"
                          : "#FFA500",
                    },
                  ]}>
                  {InvoiceService.formatStatus(invoiceData.status)}
                </Text>
              </View>
              {invoiceData.paymentDate && (
                <View style={styles.invoiceRow}>
                  <Text style={styles.invoiceLabel}>
                    Ngày thanh toán:
                  </Text>
                  <Text style={styles.invoiceValue}>
                    {InvoiceService.formatDate(
                      invoiceData.paymentDate
                    )}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Payment Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.payButton,
              isProcessingPayment && styles.disabledButton,
            ]}
            onPress={() => {
              console.log("PaymentScreen: Pay button pressed!");
              handlePayment();
            }}
            disabled={isProcessingPayment}>
            <Text style={styles.payButtonText}>
              {isProcessingPayment
                ? "Đang xử lý..."
                : "Thanh toán ngay"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.replace("/")}>
            <Text style={styles.cancelButtonText}>Hủy booking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#4FC3F7",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  bookingCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  bookingDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  packageSection: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  packageInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  packageName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  packageDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  packageMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  packageDuration: {
    fontSize: 14,
    color: "#666",
  },
  expandButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  expandButtonText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  packageTasks: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  taskItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
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
  },
  taskDescription: {
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  taskQuantity: {
    fontSize: 11,
    color: "#666",
  },
  noTasksText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 10,
  },
  servicesSection: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  serviceItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  serviceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  serviceQuantity: {
    fontSize: 11,
    color: "#666",
  },
  paymentCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  invoiceInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  invoiceLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  invoiceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  actionsContainer: {
    marginBottom: 30,
  },
  payButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  payButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
});
