import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BookingService from "../../services/bookingService";
import CareProfileService from "../../services/careProfileService";
import CustomizePackageService from "../../services/customizePackageService";
import CustomizeTaskService from "../../services/customizeTaskService";
import InvoiceService from "../../services/invoiceService";
import NursingSpecialistService from "../../services/nursingSpecialistService";
import ServiceTypeService from "../../services/serviceTypeService";
import ZoneDetailService from "../../services/zoneDetailService";

export default function BookingHistoryScreen() {
  const router = useRouter();
  const { accountID } = useLocalSearchParams();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBookings, setExpandedBookings] = useState({});
  const [invoiceMap, setInvoiceMap] = useState({});
  const [bookingDetailsMap, setBookingDetailsMap] = useState({});
  const [showOnlyPaid, setShowOnlyPaid] = useState(false);

  // Thêm state cho customize packages và tasks
  const [customizePackagesMap, setCustomizePackagesMap] = useState(
    {}
  );
  const [customizeTasksMap, setCustomizeTasksMap] = useState({});
  const [nurses, setNurses] = useState([]);
  const [zoneDetails, setZoneDetails] = useState([]);
  const [services, setServices] = useState([]); // Cache services

  // State cho modal chọn nurse
  const [showNurseModal, setShowNurseModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [availableNurses, setAvailableNurses] = useState([]);
  const [selectedStaffType, setSelectedStaffType] = useState(""); // "Nurse" hoặc "Specialist"

  useEffect(() => {
    if (accountID) {
      loadBookingHistory();
      loadNurses();
      loadZoneDetails();
      loadServices();
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

      // Load customize packages và tasks cho tất cả bookings
      bookings.forEach(async (booking) => {
        await loadCustomizePackages(booking.bookingID);
        await loadCustomizeTasks(booking.bookingID);
      });
    } catch (error) {
      console.error("Error loading booking details:", error);
    }
  };

  const loadZoneDetails = async () => {
    try {
      console.log("Loading zone details...");
      const result = await ZoneDetailService.getAllZoneDetails();
      console.log("Zone details result:", result);
      if (result.success) {
        console.log(
          "Zone details loaded successfully:",
          result.data.length,
          "zones"
        );
        setZoneDetails(result.data);
      } else {
        console.log("Failed to load zone details:", result.error);
      }
    } catch (error) {
      console.error("Error loading zone details:", error);
    }
  };

  const loadNurses = async () => {
    try {
      console.log("Loading nurses...");
      const result =
        await NursingSpecialistService.getAllNursingSpecialists();
      console.log("Nurses result:", result);
      if (result.success) {
        console.log(
          "Nurses loaded successfully:",
          result.data.length,
          "nurses"
        );
        setNurses(result.data);
      } else {
        console.log("Failed to load nurses:", result.error);
      }
    } catch (error) {
      console.error("Error loading nurses:", error);
    }
  };

  const loadServices = async () => {
    try {
      console.log("Loading services...");
      const result = await ServiceTypeService.getServices();
      console.log("Services result:", result);
      if (result.success) {
        console.log(
          "Services loaded successfully:",
          result.data.length,
          "services"
        );
        setServices(result.data);
      } else {
        console.log("Failed to load services:", result.error);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  // Hàm lọc nurse khả dụng dựa trên lịch trình
  const filterAvailableNurses = async (
    nurses,
    currentBookingID,
    currentWorkdate
  ) => {
    try {
      // Lấy tất cả customize tasks để kiểm tra lịch trình
      const allCustomizeTasks = [];

      // Lấy tất cả bookings để kiểm tra workdate
      const allBookings = await BookingService.getAllBookings();
      if (allBookings.success) {
        // Lấy tất cả customize tasks cho tất cả bookings
        for (const booking of allBookings.data) {
          const tasksResult =
            await CustomizeTaskService.getCustomizeTasksByBookingId(
              booking.bookingID
            );
          if (tasksResult.success) {
            allCustomizeTasks.push(...tasksResult.data);
          }
        }
      }

      // Lọc nurse không bị conflict và chưa được chọn trong booking hiện tại
      const availableNurses = nurses.filter((nurse) => {
        // 1. Kiểm tra xem nurse đã được chọn trong booking hiện tại chưa
        const alreadySelectedInCurrentBooking =
          allCustomizeTasks.find(
            (task) =>
              task.bookingID === currentBookingID &&
              task.nursingID === nurse.nursingID
          );

        if (alreadySelectedInCurrentBooking) {
          return false; // Nurse đã được chọn trong booking hiện tại
        }

        // 2. Kiểm tra xem nurse có bị conflict với booking khác không
        const conflictingTask = allCustomizeTasks.find((task) => {
          if (
            task.bookingID !== currentBookingID &&
            task.nursingID === nurse.nursingID
          ) {
            // Tìm booking tương ứng
            const booking = allBookings.data.find(
              (b) => b.bookingID === task.bookingID
            );
            if (booking && booking.workdate && currentWorkdate) {
              // Kiểm tra xem có conflict thời gian không (cách nhau ít nhất 30 phút)
              const currentTime = new Date(currentWorkdate);
              const bookingTime = new Date(booking.workdate);
              const timeDiff =
                Math.abs(currentTime - bookingTime) / (1000 * 60); // Chuyển về phút

              return timeDiff < 30; // Conflict nếu cách nhau ít hơn 30 phút
            }
          }
          return false;
        });

        if (conflictingTask) {
          return false; // Nurse bị conflict
        }

        return true; // Nurse khả dụng
      });

      return availableNurses;
    } catch (error) {
      console.error("Error filtering available nurses:", error);
      return nurses; // Trả về tất cả nurses nếu có lỗi
    }
  };

  const loadCustomizePackages = async (bookingID) => {
    try {
      const result =
        await CustomizePackageService.getCustomizePackagesByBookingId(
          bookingID
        );
      if (result.success) {
        setCustomizePackagesMap((prev) => ({
          ...prev,
          [bookingID]: result.data,
        }));
      }
    } catch (error) {
      console.error("Error loading customize packages:", error);
    }
  };

  const loadCustomizeTasks = async (bookingID) => {
    try {
      const result =
        await CustomizeTaskService.getCustomizeTasksByBookingId(
          bookingID
        );
      if (result.success) {
        setCustomizeTasksMap((prev) => ({
          ...prev,
          [bookingID]: result.data,
        }));
      }
    } catch (error) {
      console.error("Error loading customize tasks:", error);
    }
  };

  const handlePayment = async (bookingID) => {
    try {
      // Chuyển đến trang thanh toán
      router.push(`/payment?bookingId=${bookingID}`);
    } catch (error) {
      console.error("Error navigating to payment:", error);
      Alert.alert("Lỗi", "Không thể chuyển đến trang thanh toán");
    }
  };

  const handleSelectNurse = async (task) => {
    try {
      // Lấy care profile để biết zoneDetailID
      const careProfile =
        bookingDetailsMap[task.bookingID]?.careProfile;
      if (!careProfile) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin hồ sơ chăm sóc");
        return;
      }

      // Tìm zoneID từ zoneDetailID của care profile
      const zoneDetail = zoneDetails.find(
        (zd) => zd.zoneDetailID === careProfile.zoneDetailID
      );
      if (!zoneDetail) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin khu vực");
        return;
      }

      // Lấy thông tin service để biết major
      const customizePackages =
        customizePackagesMap[task.bookingID] || [];
      const packageForTask = customizePackages.find(
        (pkg) => pkg.customizePackageID === task.customizePackageID
      );

      if (!packageForTask) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin gói dịch vụ");
        return;
      }

      // Lấy thông tin service từ serviceID
      const serviceInfo = services.find(
        (s) => s.serviceID === packageForTask.serviceID
      );

      // Nếu không tìm thấy service, sử dụng fallback
      if (!serviceInfo) {
        const requiredMajor = "Nurse"; // Default fallback

        // Lấy workdate từ booking
        const currentBooking = bookings.find(
          (b) => b.bookingID === task.bookingID
        );
        const currentWorkdate = currentBooking?.workdate;

        // Lọc nurses có cùng zoneID và không bị conflict
        const availableNursesList = await filterAvailableNurses(
          nurses.filter(
            (nurse) => nurse.zoneID === zoneDetail.zoneID
          ),
          task.bookingID,
          currentWorkdate
        );

        if (availableNursesList.length === 0) {
          Alert.alert(
            "Thông báo",
            "Không có điều dưỡng viên nào khả dụng trong khu vực này. Vui lòng đặt lịch cách nhau ít nhất 30 phút."
          );
          return;
        }

        setSelectedTask(task);
        setSelectedStaffType(requiredMajor);
        setAvailableNurses(availableNursesList);
        setShowNurseModal(true);
        return;
      }

      // Xác định major cần thiết
      const requiredMajor = serviceInfo.major || "Nurse"; // Default là Nurse nếu không có

      // Lọc nurses có cùng zoneID, major phù hợp và không bị conflict
      const nursesWithSameZoneAndMajor = nurses.filter(
        (nurse) =>
          nurse.zoneID === zoneDetail.zoneID &&
          nurse.major?.toLowerCase() === requiredMajor?.toLowerCase()
      );

      // Lấy workdate từ booking
      const currentBooking = bookings.find(
        (b) => b.bookingID === task.bookingID
      );
      const currentWorkdate = currentBooking?.workdate;

      const availableNursesList = await filterAvailableNurses(
        nursesWithSameZoneAndMajor,
        task.bookingID,
        currentWorkdate
      );

      if (availableNursesList.length === 0) {
        Alert.alert(
          "Thông báo",
          `Không có ${
            requiredMajor === "Nurse"
              ? "điều dưỡng viên"
              : "tư vấn viên"
          } nào khả dụng trong khu vực này. Vui lòng đặt lịch cách nhau ít nhất 30 phút.`
        );
        return;
      }

      setSelectedTask(task);
      setSelectedStaffType(requiredMajor);
      setAvailableNurses(availableNursesList);
      setShowNurseModal(true);
    } catch (error) {
      console.error("Error selecting nurse:", error);
      Alert.alert("Lỗi", "Không thể chọn điều dưỡng viên");
    }
  };

  const handleNurseSelect = async (nurse) => {
    try {
      const result = await CustomizeTaskService.updateNursing(
        selectedTask.customizeTaskID,
        nurse.nursingID
      );

      if (result.success) {
        Alert.alert(
          "Thành công",
          `Đã chọn điều dưỡng viên: ${nurse.fullName}`
        );
        // Reload customize tasks
        await loadCustomizeTasks(selectedTask.bookingID);
        setShowNurseModal(false);
        setSelectedTask(null);
      } else {
        // Xử lý lỗi conflict schedule
        if (
          result.error &&
          result.error.includes("conflict schedule")
        ) {
          Alert.alert(
            "Lỗi lịch trình",
            "Điều dưỡng viên này đã được gán cho lịch hẹn khác trong cùng thời gian. Vui lòng chọn điều dưỡng viên khác hoặc đặt lịch cách nhau ít nhất 30 phút."
          );
        } else {
          Alert.alert(
            "Lỗi",
            result.error || "Không thể cập nhật điều dưỡng viên"
          );
        }
      }
    } catch (error) {
      console.error("Error updating nurse:", error);
      Alert.alert("Lỗi", "Không thể cập nhật điều dưỡng viên");
    }
  };

  const handleSelectNurseForBooking = async (bookingID) => {
    try {
      // Lấy care profile để biết zoneDetailID
      const careProfile = bookingDetailsMap[bookingID]?.careProfile;
      if (!careProfile) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin hồ sơ chăm sóc");
        return;
      }

      // Tìm zoneID từ zoneDetailID của care profile
      const zoneDetail = zoneDetails.find(
        (zd) => zd.zoneDetailID === careProfile.zoneDetailID
      );
      if (!zoneDetail) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin khu vực");
        return;
      }

      // Lấy thông tin service từ customize packages
      const customizePackages = customizePackagesMap[bookingID] || [];
      if (customizePackages.length === 0) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin gói dịch vụ");
        return;
      }

      // Lấy package đầu tiên để xác định service
      const packageForTask = customizePackages[0];

      // Lấy thông tin service từ serviceID
      const serviceInfo = services.find(
        (s) => s.serviceID === packageForTask.serviceID
      );

      // Nếu không tìm thấy service, sử dụng fallback
      if (!serviceInfo) {
        console.log(
          "Service not found in handleSelectNurseForBooking, using fallback"
        );
        const requiredMajor = "Nurse"; // Default fallback

        // Lọc nurses có cùng zoneID
        const availableNursesList = nurses.filter(
          (nurse) => nurse.zoneID === zoneDetail.zoneID
        );

        if (availableNursesList.length === 0) {
          Alert.alert(
            "Thông báo",
            "Không có điều dưỡng viên nào trong khu vực này"
          );
          return;
        }

        // Chọn ngẫu nhiên một nurse từ danh sách có thể chọn
        const selectedNurse =
          availableNursesList[
            Math.floor(Math.random() * availableNursesList.length)
          ];

        // Cập nhật tất cả các task trong booking với ID của nurse đã chọn
        const tasksToUpdate = customizeTasksMap[bookingID] || [];

        // Gọi API để cập nhật từng task
        const updatePromises = tasksToUpdate.map((task) =>
          CustomizeTaskService.updateNursing(
            task.customizeTaskID,
            selectedNurse.nursingID
          )
        );

        const updateResults = await Promise.all(updatePromises);
        const allSuccessful = updateResults.every(
          (result) => result.success
        );

        if (allSuccessful) {
          // Cập nhật state local
          const updatedTasks = tasksToUpdate.map((task) => ({
            ...task,
            nursingID: selectedNurse.nursingID,
          }));
          setCustomizeTasksMap((prev) => ({
            ...prev,
            [bookingID]: updatedTasks,
          }));

          Alert.alert(
            "Thành công",
            `Đã chọn điều dưỡng viên: ${selectedNurse.fullName} cho lịch hẹn #${bookingID}`
          );
        } else {
          Alert.alert("Lỗi", "Không thể cập nhật tất cả task");
        }
        return;
      }

      // Xác định major cần thiết
      const requiredMajor = serviceInfo.major || "Nurse"; // Default là Nurse nếu không có

      // Lọc nurses có cùng zoneID và major phù hợp
      const availableNursesList = nurses.filter(
        (nurse) =>
          nurse.zoneID === zoneDetail.zoneID &&
          nurse.major === requiredMajor
      );

      if (availableNursesList.length === 0) {
        Alert.alert(
          "Thông báo",
          `Các ${
            requiredMajor === "Nurse"
              ? "điều dưỡng viên"
              : "tư vấn viên"
          } đã được chọn trong khu vực này`
        );
        return;
      }

      // Lọc nurse active để ưu tiên
      const activeNurses = availableNursesList.filter(
        (nurse) => nurse.status === "active"
      );

      if (activeNurses.length === 0) {
        Alert.alert(
          "Thông báo",
          `Chỉ có ${
            requiredMajor === "Nurse"
              ? "điều dưỡng viên"
              : "tư vấn viên"
          } không hoạt động trong khu vực này. Bạn có muốn tiếp tục?`
        );
      }

      // Chọn ngẫu nhiên một nurse từ danh sách có thể chọn
      const selectedNurse =
        activeNurses.length > 0
          ? activeNurses[
              Math.floor(Math.random() * activeNurses.length)
            ]
          : availableNursesList[
              Math.floor(Math.random() * availableNursesList.length)
            ];

      // Cập nhật tất cả các task trong booking với ID của nurse đã chọn
      const tasksToUpdate = customizeTasksMap[bookingID] || [];

      // Gọi API để cập nhật từng task
      const updatePromises = tasksToUpdate.map((task) =>
        CustomizeTaskService.updateNursing(
          task.customizeTaskID,
          selectedNurse.nursingID
        )
      );

      const updateResults = await Promise.all(updatePromises);
      const allSuccessful = updateResults.every(
        (result) => result.success
      );

      if (allSuccessful) {
        // Cập nhật state local
        const updatedTasks = tasksToUpdate.map((task) => ({
          ...task,
          nursingID: selectedNurse.nursingID,
        }));
        setCustomizeTasksMap((prev) => ({
          ...prev,
          [bookingID]: updatedTasks,
        }));

        Alert.alert(
          "Thành công",
          `Đã chọn ${
            requiredMajor === "Nurse"
              ? "điều dưỡng viên"
              : "tư vấn viên"
          }: ${selectedNurse.fullName} cho lịch hẹn #${bookingID}`
        );
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật tất cả task");
      }
    } catch (error) {
      console.error("Error selecting nurse for booking:", error);
      Alert.alert(
        "Lỗi",
        "Không thể chọn điều dưỡng viên cho lịch hẹn"
      );
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
      case "isScheduled":
        return "Đã phân công";
      case "unknown":
        return "Quá hạn";
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
      case "isScheduled":
        return "#4CAF50";
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
                {/* Chỉ hiển thị "Dịch vụ đã chọn" khi là package (isPackage = true) */}
                {details.extraData.type === "package" && (
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
                )}

                {/* Customize Packages - luôn hiển thị */}
                {customizePackagesMap[booking.bookingID] && (
                  <View style={styles.customizePackagesSection}>
                    <Text style={styles.sectionTitle}>
                      Chi tiết gói dịch vụ:
                    </Text>
                    {customizePackagesMap[booking.bookingID].map(
                      (pkg, index) => (
                        <View
                          key={pkg.customizePackageID}
                          style={styles.packageDetail}>
                          <Text style={styles.packageName}>
                            {(() => {
                              // Sử dụng dữ liệu từ API thay vì tìm kiếm trong services
                              // Nếu có name từ API thì dùng, không thì dùng serviceID
                              return (
                                pkg.name || `Dịch vụ ${pkg.serviceID}`
                              );
                            })()}
                          </Text>
                          <View style={styles.packageDetails}>
                            <Text style={styles.packagePrice}>
                              Giá:{" "}
                              {CustomizePackageService.formatPrice(
                                pkg.price
                              )}
                            </Text>
                            <Text style={styles.packageQuantity}>
                              Số lượng: {pkg.quantity}
                            </Text>
                            {pkg.discount && (
                              <Text style={styles.packageDiscount}>
                                Giảm giá:{" "}
                                {CustomizePackageService.formatPrice(
                                  pkg.discount
                                )}
                              </Text>
                            )}
                            <Text style={styles.packageTotal}>
                              Tổng:{" "}
                              {CustomizePackageService.formatPrice(
                                pkg.total
                              )}
                            </Text>
                          </View>
                        </View>
                      )
                    )}
                  </View>
                )}

                {/* Customize Tasks - chỉ hiển thị cho booking đã thanh toán */}
                {invoiceStatus === "paid" &&
                  customizeTasksMap[booking.bookingID] && (
                    <View style={styles.customizeTasksSection}>
                      <Text style={styles.sectionTitle}>
                        Chọn nhân viên:
                      </Text>

                      {/* Debug info */}
                      {__DEV__ && (
                        <Text style={styles.debugText}>
                          Debug: Services count: {services.length},
                          Customize packages:{" "}
                          {customizePackagesMap[booking.bookingID]
                            ?.length || 0}
                        </Text>
                      )}

                      {/* Nhóm tasks theo customizePackageID */}
                      {(() => {
                        const tasks =
                          customizeTasksMap[booking.bookingID] || [];
                        const packages =
                          customizePackagesMap[booking.bookingID] ||
                          [];

                        console.log(
                          "Tasks for booking",
                          booking.bookingID,
                          ":",
                          tasks
                        );
                        console.log(
                          "Packages for booking",
                          booking.bookingID,
                          ":",
                          packages
                        );

                        // Nhóm tasks theo customizePackageID
                        const tasksByPackage = {};
                        tasks.forEach((task) => {
                          if (
                            !tasksByPackage[task.customizePackageID]
                          ) {
                            tasksByPackage[task.customizePackageID] =
                              [];
                          }
                          tasksByPackage[
                            task.customizePackageID
                          ].push(task);
                        });

                        return Object.keys(tasksByPackage).map(
                          (packageId) => {
                            const packageTasks =
                              tasksByPackage[packageId];
                            const packageInfo = packages.find(
                              (pkg) =>
                                pkg.customizePackageID ===
                                parseInt(packageId)
                            );

                            if (!packageInfo) {
                              console.log(
                                "Package info not found for ID:",
                                packageId
                              );
                              return null;
                            }

                            // Lấy thông tin service từ package
                            const serviceInfo = services.find(
                              (s) =>
                                s.serviceID === packageInfo.serviceID
                            );
                            const serviceName =
                              serviceInfo?.serviceName ||
                              `Dịch vụ ${packageInfo.serviceID}`;
                            const major =
                              serviceInfo?.major || "Nurse"; // Fallback về Nurse nếu không tìm thấy
                            const quantity =
                              packageInfo.quantity || 1;

                            console.log(
                              "Package",
                              packageId,
                              "serviceInfo:",
                              serviceInfo,
                              "major:",
                              major
                            );

                            // Kiểm tra xem có task nào đã được gán nurse chưa
                            const assignedTasks = packageTasks.filter(
                              (task) => task.nursingID
                            );
                            const unassignedTasks =
                              packageTasks.filter(
                                (task) => !task.nursingID
                              );

                            return (
                              <View
                                key={packageId}
                                style={styles.packageTasksContainer}>
                                <Text
                                  style={styles.packageServiceName}>
                                  {serviceName} (Số lượng: {quantity})
                                </Text>

                                {/* Hiển thị các task đã được gán */}
                                {assignedTasks.map((task, index) => {
                                  const nurse = nurses.find(
                                    (n) =>
                                      n.nursingID === task.nursingID
                                  );
                                  return (
                                    <View
                                      key={task.customizeTaskID}
                                      style={styles.assignedTaskItem}>
                                      <Text
                                        style={
                                          styles.assignedTaskText
                                        }>
                                        {major === "Nurse"
                                          ? "Điều dưỡng"
                                          : "Tư vấn viên"}{" "}
                                        {index + 1}:{" "}
                                        {nurse?.fullName ||
                                          "Không xác định"}
                                      </Text>
                                    </View>
                                  );
                                })}

                                {/* Hiển thị các nút để thêm nurse cho các task chưa được gán */}
                                {unassignedTasks.map(
                                  (task, index) => (
                                    <TouchableOpacity
                                      key={task.customizeTaskID}
                                      style={styles.addNurseButton}
                                      onPress={() =>
                                        handleSelectNurse(task)
                                      }>
                                      <Text
                                        style={
                                          styles.addNurseButtonText
                                        }>
                                        Thêm{" "}
                                        {major === "Nurse"
                                          ? "Điều dưỡng"
                                          : "Chuyên gia tư vấn"}{" "}
                                        {assignedTasks.length +
                                          index +
                                          1}
                                      </Text>
                                    </TouchableOpacity>
                                  )
                                )}

                                {/* Nếu tất cả task đã được gán, hiển thị thông báo */}
                                {unassignedTasks.length === 0 &&
                                  assignedTasks.length > 0 && (
                                    <Text
                                      style={styles.allAssignedText}>
                                      Đã chọn đủ{" "}
                                      {major === "Nurse"
                                        ? "điều dưỡng viên"
                                        : "tư vấn viên"}{" "}
                                      cho dịch vụ này
                                    </Text>
                                  )}
                              </View>
                            );
                          }
                        );
                      })()}
                    </View>
                  )}
              </View>
            )}
          </View>
        )}

        {/* Payment Button - chỉ hiển thị cho booking pending */}
        {invoiceStatus === "pending" && (
          <View style={styles.paymentSection}>
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => handlePayment(booking.bookingID)}>
              <Ionicons
                name="card-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.paymentButtonText}>
                Thanh toán ngay
              </Text>
            </TouchableOpacity>
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

      {/* Modal chọn nurse */}
      <Modal
        visible={showNurseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNurseModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Chọn{" "}
                {selectedStaffType === "Nurse"
                  ? "điều dưỡng viên"
                  : "tư vấn viên"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowNurseModal(false)}
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {availableNurses.length === 0 ? (
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>
                  Không có{" "}
                  {selectedStaffType === "Nurse"
                    ? "điều dưỡng viên"
                    : "tư vấn viên"}{" "}
                  nào khả dụng
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scrollViewContent}>
                {availableNurses.map((item, index) => (
                  <TouchableOpacity
                    key={
                      item.nursingID?.toString() || index.toString()
                    }
                    style={styles.nurseItem}
                    onPress={() => handleNurseSelect(item)}>
                    <View style={styles.nurseInfo}>
                      <Text style={styles.nurseName}>
                        {item.fullName || `Nurse ${index + 1}`}
                      </Text>
                      <Text style={styles.nurseDetails}>
                        {item.major || "Không xác định"}
                      </Text>
                      <Text style={styles.nurseDetails}>
                        Kinh nghiệm:{" "}
                        {item.experience || "Không xác định"}
                      </Text>
                      <Text style={styles.nurseDetails}>
                        Giới tính: {item.gender || "Không xác định"}
                      </Text>
                      <Text
                        style={[
                          styles.nurseDetails,
                          {
                            color:
                              item.status === "active"
                                ? "#4CAF50"
                                : "#FF6B6B",
                          },
                        ]}>
                        Trạng thái:{" "}
                        {item.status === "active"
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  customizePackagesSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  packageDetail: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  packageName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  packageDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packagePrice: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  packageQuantity: {
    fontSize: 14,
    color: "#666",
  },
  packageDiscount: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  packageTotal: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  customizeTasksSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  taskDetail: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  taskOrder: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  taskStatus: {
    fontSize: 14,
    color: "#666",
  },
  taskActions: {
    marginTop: 5,
  },
  selectNurseButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  selectNurseButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  nurseAssigned: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  paymentSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  paymentButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  paymentButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
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
    width: "100%",
    paddingVertical: 10,
  },
  nurseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F8F9FA",
    marginBottom: 5,
    borderRadius: 8,
    width: "100%",
  },
  nurseInfo: {
    flex: 1,
    marginRight: 10,
  },
  nurseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  nurseDetails: {
    fontSize: 13,
    color: "#666",
  },
  packageTasksContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  packageServiceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  assignedTaskItem: {
    backgroundColor: "#E0F2F7",
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  assignedTaskText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  addNurseButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 5,
  },
  addNurseButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  allAssignedText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  emptyListContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyListText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  scrollView: {
    width: "100%",
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
});
