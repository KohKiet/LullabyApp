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
import BookingService from "../../services/bookingService";
import CareProfileService from "../../services/careProfileService";
import InvoiceService from "../../services/invoiceService";
import ServiceTypeService from "../../services/serviceTypeService";

export default function BookingHistoryScreen() {
  const router = useRouter();
  const { accountID } = useLocalSearchParams();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBookings, setExpandedBookings] = useState({});
  const [invoiceMap, setInvoiceMap] = useState({});
  const [bookingDetailsMap, setBookingDetailsMap] = useState({});
  const [showOnlyPaid, setShowOnlyPaid] = useState(false);

  useEffect(() => {
    if (accountID) {
      loadBookingHistory();
    }
  }, [accountID]);

  const loadBookingHistory = async () => {
    try {
      setIsLoading(true);
      console.log("Loading booking history for account:", accountID);

      // Lấy care profiles của account hiện tại
      const careProfilesResult =
        await CareProfileService.getCareProfilesByAccountId(
          accountID
        );
      console.log("Care profiles result:", careProfilesResult);

      let userCareProfileIDs = [];
      if (careProfilesResult.success) {
        userCareProfileIDs = careProfilesResult.data.map(
          (cp) => cp.careProfileID
        );
        console.log("User care profile IDs:", userCareProfileIDs);
      }

      // Lấy tất cả bookings
      const bookingsResult = await BookingService.getAllBookings();
      console.log("All bookings result:", bookingsResult);

      if (bookingsResult.success) {
        // Lấy tất cả invoices để kiểm tra trạng thái thanh toán
        const invoicesResult = await InvoiceService.getAllInvoices();
        console.log("Invoices result:", invoicesResult);

        let allUserBookings = [];

        if (invoicesResult.success) {
          // Tạo map bookingID -> invoice status
          const invoiceMap = {};
          invoicesResult.data.forEach((invoice) => {
            invoiceMap[invoice.bookingID] = invoice.status;
          });
          setInvoiceMap(invoiceMap);

          // Lọc các booking thuộc về user hiện tại
          allUserBookings = bookingsResult.data.filter((booking) => {
            // Nếu user không có care profiles, hiển thị tất cả booking
            if (userCareProfileIDs.length === 0) {
              console.log(
                `User has no care profiles, showing all bookings. Booking ${booking.bookingID}: careProfileID = ${booking.careProfileID}`
              );
              return true;
            }

            const belongsToUser = userCareProfileIDs.includes(
              booking.careProfileID
            );
            console.log(
              `Booking ${booking.bookingID}: careProfileID = ${booking.careProfileID}, belongsToUser = ${belongsToUser}`
            );
            return belongsToUser;
          });
        } else {
          // Nếu không lấy được invoices, lấy tất cả booking
          allUserBookings = bookingsResult.data;
        }

        console.log("All user bookings:", allUserBookings);
        setBookings(allUserBookings);
        await loadAllBookingDetails(allUserBookings);
      } else {
        console.log("No bookings found");
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading booking history:", error);
      Alert.alert("Lỗi", "Không thể tải lịch sử lịch hẹn");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllBookingDetails = async (bookings) => {
    try {
      console.log("Loading all booking details...");
      const detailsMap = {};

      // Load tất cả care profiles một lần
      const careProfileIds = [
        ...new Set(bookings.map((b) => b.careProfileID)),
      ];
      const careProfilePromises = careProfileIds.map((id) =>
        CareProfileService.getCareProfileById(id)
      );
      const careProfileResults = await Promise.all(
        careProfilePromises
      );

      // Tạo map careProfileID -> careProfile
      const careProfileMap = {};
      careProfileResults.forEach((result, index) => {
        if (result.success) {
          careProfileMap[careProfileIds[index]] = result.data;
        }
      });

      // Load tất cả extra data từ AsyncStorage
      const extraDataPromises = bookings.map((booking) =>
        AsyncStorage.getItem(`booking_${booking.bookingID}`)
      );
      const extraDataResults = await Promise.all(extraDataPromises);

      // Tạo details map
      bookings.forEach((booking, index) => {
        let extraData = null;
        try {
          if (extraDataResults[index]) {
            extraData = JSON.parse(extraDataResults[index]);
          }
        } catch (error) {
          console.error(
            "Error parsing extra data for booking",
            booking.bookingID,
            error
          );
          extraData = null;
        }

        detailsMap[booking.bookingID] = {
          careProfile: careProfileMap[booking.careProfileID] || null,
          extraData: extraData,
        };
      });

      console.log(
        "All booking details loaded:",
        Object.keys(detailsMap).length
      );
      setBookingDetailsMap(detailsMap);
    } catch (error) {
      console.error("Error loading booking details:", error);
    }
  };

  const toggleExpanded = (bookingID) => {
    setExpandedBookings((prev) => ({
      ...prev,
      [bookingID]: !prev[bookingID],
    }));
  };

  const formatDate = (dateString) => {
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

  const formatStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ thanh toán";
      case "paid":
        return "Đã thanh toán";
      case "cancelled":
        return "Đã hủy";
      case "unknown":
        return "Không xác định";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "paid":
        return "#4CAF50";
      case "cancelled":
        return "#FF6B6B";
      case "unknown":
        return "#666";
      default:
        return "#666";
    }
  };

  const getFilteredBookings = () => {
    if (!showOnlyPaid) {
      return bookings; // Hiển thị tất cả
    }

    // Chỉ hiển thị booking đã thanh toán
    return bookings.filter((booking) => {
      const invoiceStatus = invoiceMap[booking.bookingID];
      return invoiceStatus === "paid";
    });
  };

  const toggleFilter = () => {
    setShowOnlyPaid(!showOnlyPaid);
  };

  const renderBookingCard = (booking, index) => {
    if (!booking || !booking.bookingID) {
      console.error("Invalid booking data:", booking);
      return null;
    }

    const details = bookingDetailsMap[booking.bookingID];
    const invoiceStatus = invoiceMap[booking.bookingID] || "unknown";

    // Nếu details chưa load xong, hiển thị loading
    if (!details) {
      return (
        <View
          key={booking.bookingID || index}
          style={styles.bookingCard}>
          <View style={styles.loadingDetails}>
            <Text style={styles.loadingText}>
              Đang tải chi tiết...
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        key={booking.bookingID || index}
        style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingTitle}>
              Lịch hẹn #{booking.bookingID}
            </Text>
            <Text style={styles.bookingDate}>
              {formatDate(booking.workdate)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(invoiceStatus) },
            ]}>
            <Text style={styles.statusText}>
              {formatStatus(invoiceStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          {details.careProfile && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hồ sơ chăm sóc:</Text>
              <Text style={styles.detailValue}>
                {details.careProfile.profileName || "Không xác định"}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số tiền:</Text>
            <Text style={styles.amountValue}>
              {ServiceTypeService.formatPrice(booking.amount || 0)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày tạo:</Text>
            <Text style={styles.detailValue}>
              {formatDate(booking.createdAt)}
            </Text>
          </View>
        </View>

        {/* Service/Package Details */}
        {details.extraData && (
          <View style={styles.serviceDetails}>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleExpanded(booking.bookingID)}>
              <Text style={styles.expandButtonText}>
                {expandedBookings[booking.bookingID]
                  ? "Ẩn chi tiết"
                  : "Xem chi tiết"}
              </Text>
              <Ionicons
                name={
                  expandedBookings[booking.bookingID]
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={16}
                color="#666"
              />
            </TouchableOpacity>

            {expandedBookings[booking.bookingID] && (
              <View style={styles.expandedContent}>
                {details.extraData.type === "package" ? (
                  <View style={styles.packageInfo}>
                    <Text style={styles.serviceName}>
                      {details.extraData.packageData?.serviceName ||
                        "Gói dịch vụ"}
                    </Text>
                    <Text style={styles.serviceDescription}>
                      {details.extraData.packageData?.description ||
                        ""}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.servicesList}>
                    <Text style={styles.servicesTitle}>
                      Dịch vụ đã chọn:
                    </Text>
                    {details.extraData.services?.map(
                      (service, serviceIndex) => (
                        <View
                          key={serviceIndex}
                          style={styles.serviceItem}>
                          <Text style={styles.serviceName}>
                            {service?.serviceName ||
                              "Dịch vụ không xác định"}
                          </Text>
                          <Text style={styles.serviceQuantity}>
                            Số lượng: {service?.quantity || 0}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
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
            Đang tải lịch sử lịch hẹn...
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
        <Text style={styles.headerTitle}>Lịch sử lịch hẹn</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            !showOnlyPaid && styles.filterButtonActive,
          ]}
          onPress={() => setShowOnlyPaid(false)}>
          <Text
            style={[
              styles.filterButtonText,
              !showOnlyPaid && styles.filterButtonTextActive,
            ]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showOnlyPaid && styles.filterButtonActive,
          ]}
          onPress={() => setShowOnlyPaid(true)}>
          <Text
            style={[
              styles.filterButtonText,
              showOnlyPaid && styles.filterButtonTextActive,
            ]}>
            Đã thanh toán
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {getFilteredBookings().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color="#999"
            />
            <Text style={styles.emptyTitle}>
              {showOnlyPaid
                ? "Chưa có lịch hẹn đã thanh toán"
                : "Chưa có lịch hẹn nào"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {showOnlyPaid
                ? "Các lịch hẹn đã thanh toán sẽ hiển thị ở đây"
                : "Lịch sử lịch hẹn sẽ hiển thị ở đây"}
            </Text>
          </View>
        ) : (
          <View style={styles.bookingsContainer}>
            {getFilteredBookings().map((booking, index) => {
              try {
                return renderBookingCard(booking, index);
              } catch (error) {
                console.error("Error rendering booking card:", error);
                return (
                  <View
                    key={booking.bookingID || index}
                    style={styles.bookingCard}>
                    <Text style={styles.errorText}>
                      Lỗi hiển thị lịch hẹn #{booking.bookingID}
                    </Text>
                  </View>
                );
              }
            })}
          </View>
        )}
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  bookingsContainer: {
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  bookingInfo: {
    flex: 1,
    marginRight: 10,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  bookingDate: {
    fontSize: 14,
    color: "#666",
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
    marginBottom: 15,
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
    fontWeight: "bold",
    color: "#333",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  serviceDetails: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 15,
  },
  expandButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expandButtonText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  packageInfo: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: "#666",
  },
  servicesList: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  serviceQuantity: {
    fontSize: 14,
    color: "#666",
  },
  loadingDetails: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    padding: 10,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  filterButtonTextActive: {
    color: "white",
  },
});
