import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import AuthService from "../../services/authService";
import BookingService from "../../services/bookingService";
import CareProfileService from "../../services/careProfileService";
import CustomizePackageService from "../../services/customizePackageService";
import CustomizeTaskService from "../../services/customizeTaskService";
import InvoiceService from "../../services/invoiceService";
import MedicalNoteService from "../../services/medicalNoteService";
import NursingSpecialistService from "../../services/nursingSpecialistService";
import ServiceTaskService from "../../services/serviceTaskService";
import ServiceTypeService from "../../services/serviceTypeService";
import TransactionHistoryService from "../../services/transactionHistoryService";
import ZoneDetailService from "../../services/zoneDetailService";

export default function BookingHistoryScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBookings, setExpandedBookings] = useState({});
  const [invoiceMap, setInvoiceMap] = useState({});
  const [bookingDetailsMap, setBookingDetailsMap] = useState({});
  const [selectedFilter, setSelectedFilter] = useState("all"); // "all", "paid", "pending"

  // Thêm state cho customize packages và tasks
  const [customizePackagesMap, setCustomizePackagesMap] = useState(
    {}
  );
  const [customizeTasksMap, setCustomizeTasksMap] = useState({});
  const [nurses, setNurses] = useState([]);
  const [zoneDetails, setZoneDetails] = useState([]);
  const [services, setServices] = useState([]); // Cache services
  const [serviceTasks, setServiceTasks] = useState([]); // Cache service tasks

  // State cho medical notes
  const [medicalNotesMap, setMedicalNotesMap] = useState({});

  // State cho modal chọn nurse
  const [showNurseModal, setShowNurseModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [availableNurses, setAvailableNurses] = useState([]);
  const [selectedStaffType, setSelectedStaffType] = useState(""); // "Nurse" hoặc "Specialist"

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      if (user) {
        setUserData(user);
        await loadBookingHistory(user);
        await loadNurses();
        await loadZoneDetails();
        await loadServices();
        await loadServiceTasks();
        // await loadAllFeedbacks(); // ĐÃ XÓA - không còn chức năng feedback
      } else {
        Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
      router.replace("/auth/login");
    }
  };

  const loadBookingHistory = async (user) => {
    try {
      setIsLoading(true);
      const accountID = user.accountID || user.id;
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

      if (userCareProfileIDs.length === 0) {
        console.log("No care profiles found for user");
        setBookings([]);
        setIsLoading(false);
        return;
      }

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

      console.log("User bookings loaded:", userBookings);

      if (userBookings.length > 0) {
        // Lấy invoices cho các booking của user
        const userBookingIDs = userBookings.map((b) => b.bookingID);
        const invoicesResult =
          await InvoiceService.getInvoicesByBookingIds(
            userBookingIDs
          );

        if (invoicesResult.success) {
          const nextInvoiceMap = {};
          invoicesResult.data.forEach((invoice) => {
            // store entire invoice so we have invoiceID and status
            nextInvoiceMap[invoice.bookingID] = invoice;
          });
          setInvoiceMap(nextInvoiceMap);
        }

        // Sắp xếp bookings theo bookingID (mới nhất trước)
        const sortedBookings = [...userBookings].sort((a, b) => {
          return b.bookingID - a.bookingID; // Sắp xếp giảm dần (bookingID lớn nhất trước)
        });

        // Cập nhật state với bookings đã sắp xếp
        setBookings(sortedBookings);

        await loadAllBookingDetails(sortedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading booking history:", error);
      Alert.alert("Lỗi", "Không thể tải lịch sử đặt lịch");
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
        await loadMedicalNotes(booking.bookingID);
      });
    } catch (error) {
      console.error("Error loading booking details:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết lịch hẹn");
    }
  };

  // Load medical notes cho booking
  const loadMedicalNotes = async (bookingID) => {
    try {
      console.log(
        `Loading medical notes for booking ${bookingID}...`
      );
      const result =
        await MedicalNoteService.getMedicalNotesByBookingId(
          bookingID
        );
      if (result.success) {
        console.log(
          `Medical notes for booking ${bookingID}:`,
          result.data
        );
        setMedicalNotesMap((prev) => ({
          ...prev,
          [bookingID]: result.data,
        }));
      } else {
        console.log(
          `No medical notes for booking ${bookingID}:`,
          result.error
        );
        setMedicalNotesMap((prev) => ({
          ...prev,
          [bookingID]: [],
        }));
      }
    } catch (error) {
      console.error("Error loading medical notes:", error);
      setMedicalNotesMap((prev) => ({
        ...prev,
        [bookingID]: [],
      }));
    }
  };

  // Load tất cả feedback - ĐÃ XÓA
  // const loadAllFeedbacks = async () => { ... };

  // Mở modal đánh giá - ĐÃ XÓA
  // const openFeedbackModal = (task) => { ... };

  // Render stars cho đánh giá - ĐÃ XÓA
  // const renderStars = (rate, onSelect) => { ... };

  // Gửi đánh giá - ĐÃ XÓA
  // const submitFeedback = async () => { ... };

  // Hàm dịch message tiếng Anh thành tiếng Việt - ĐÃ XÓA
  // const translateErrorMessage = (message) => { ... };

  const loadNurses = async () => {
    try {
      const result =
        await NursingSpecialistService.getAllNursingSpecialists();
      if (result.success) {
        setNurses(result.data);
      } else {
        setNurses([]);
      }
    } catch (error) {
      console.error("Error loading nurses:", error);
      setNurses([]);
    }
  };

  const loadZoneDetails = async () => {
    try {
      const result = await ZoneDetailService.getAllZoneDetails();
      if (result.success) {
        setZoneDetails(result.data);
      } else {
        setZoneDetails([]);
      }
    } catch (error) {
      console.error("Error loading zone details:", error);
      setZoneDetails([]);
    }
  };

  const loadServices = async () => {
    try {
      console.log("Loading services...");
      const result = await ServiceTypeService.getAllServiceTypes();
      if (result.success) {
        console.log("Services loaded:", result.data.length, "items");
        console.log("Sample service:", result.data[0]);
        setServices(result.data);
      } else {
        console.log("Failed to load services:", result.error);
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
        console.log("Sample task structure:", result.data[0]);
        setCustomizeTasksMap((prev) => ({
          ...prev,
          [bookingID]: result.data,
        }));
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

  const handlePayment = async (bookingID) => {
    try {
      // Kiểm tra tài khoản trước khi thanh toán
      const userResult = await AuthService.getUserData();
      if (!userResult) {
        Alert.alert(
          "Lỗi",
          "Không thể kiểm tra tài khoản. Vui lòng thử lại.",
          [{ text: "OK", style: "default" }]
        );
        return;
      }

      // Lấy số dư tài khoản từ API thực tế
      const accountID = userResult.accountID || userResult.id;
      const walletID = userResult.walletID;

      console.log("User data:", userResult);
      console.log("Account ID to use:", accountID);
      console.log("Wallet ID to use:", walletID);

      if (!accountID && !walletID) {
        Alert.alert(
          "Lỗi",
          "Không tìm thấy ID tài khoản hoặc wallet.",
          [{ text: "OK", style: "default" }]
        );
        return;
      }

      let accountBalance = 0;
      let walletData = null;

      try {
        // Thử gọi API với walletID trước (nếu có)
        let walletUrl = "";
        let success = false;

        if (walletID) {
          walletUrl = `https://phamlequyanh.name.vn/api/Wallet/${walletID}`;
          console.log("Trying Wallet API with walletID:", walletUrl);

          const walletResponse = await fetch(walletUrl);
          console.log(
            "Wallet API response status (walletID):",
            walletResponse.status
          );

          if (walletResponse.ok) {
            walletData = await walletResponse.json();
            accountBalance = walletData.amount || 0;
            success = true;
            console.log(
              "Success with walletID! Wallet data:",
              walletData
            );
          }
        }

        // Nếu walletID thất bại hoặc không có, thử với accountID
        if (!success) {
          walletUrl = `https://phamlequyanh.name.vn/api/Wallet/${accountID}`;
          console.log("Trying Wallet API with accountID:", walletUrl);

          const walletResponse = await fetch(walletUrl);
          console.log(
            "Wallet API response status (accountID):",
            walletResponse.status
          );

          if (walletResponse.ok) {
            walletData = await walletResponse.json();
            accountBalance = walletData.amount || 0;
            success = true;
            console.log(
              "Success with accountID! Wallet data:",
              walletData
            );
          }
        }

        // Nếu cả 2 đều thất bại, thử với một số ID khác có thể
        if (!success) {
          console.log(
            "Both attempts failed. Trying alternative IDs..."
          );

          // Thử với ID từ 1-5 (có thể có wallet nào đó)
          for (let testID = 1; testID <= 5; testID++) {
            if (testID === accountID) continue; // Bỏ qua accountID đã thử

            const testUrl = `https://phamlequyanh.name.vn/api/Wallet/${testID}`;
            console.log(`Trying alternative ID ${testID}:`, testUrl);

            try {
              const testResponse = await fetch(testUrl);
              console.log(
                `Test ID ${testID} response status:`,
                testResponse.status
              );

              if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log(
                  `Test ID ${testID} successful! Data:`,
                  testData
                );

                // Kiểm tra xem có phải wallet của user này không
                if (testData.accountID === accountID) {
                  walletData = testData;
                  accountBalance = testData.amount || 0;
                  success = true;
                  console.log(
                    `Found matching wallet! ID: ${testID}, Data:`,
                    testData
                  );
                  break;
                }
              }
            } catch (testError) {
              console.log(
                `Test ID ${testID} failed:`,
                testError.message
              );
            }
          }
        }

        if (!success) {
          throw new Error(
            `All attempts failed. Last tried: ${walletUrl}`
          );
        }

        console.log("Final wallet data:", walletData);
        console.log("Final account balance:", accountBalance);
      } catch (walletError) {
        console.error("Error fetching wallet:", walletError);

        // Fallback: Sử dụng giá trị mặc định nếu API thất bại
        accountBalance = 100000; // 100,000 VND fallback
        console.log("Using fallback balance:", accountBalance);

        Alert.alert(
          "Cảnh báo",
          "Không thể kiểm tra số dư tài khoản từ server.\n\n" +
            "Sử dụng số dư mặc định để tiếp tục.\n\n" +
            "Vui lòng kiểm tra lại sau.",
          [
            {
              text: "Tiếp tục",
              style: "default",
              onPress: () =>
                console.log("Continuing with fallback balance"),
            },
          ]
        );
      }

      const booking = bookings.find((b) => b.bookingID === bookingID);

      if (!booking) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đặt lịch.", [
          { text: "OK", style: "default" },
        ]);
        return;
      }

      // Tính tổng tiền cần thanh toán
      let totalAmount = booking.amount;
      if (booking.extra && booking.extra > 0) {
        totalAmount =
          booking.amount + (booking.amount * booking.extra) / 100;
      }

      console.log("Booking amount:", booking.amount);
      console.log("Extra fee:", booking.extra);
      console.log("Total amount:", totalAmount);

      // Kiểm tra số dư tài khoản
      if (accountBalance < totalAmount) {
        const shortfall = totalAmount - accountBalance;
        Alert.alert(
          "Số dư không đủ",
          `Số dư hiện tại: ${ServiceTypeService.formatPrice(
            accountBalance
          )}\n\n` +
            `Số tiền cần thanh toán: ${ServiceTypeService.formatPrice(
              totalAmount
            )}\n\n` +
            `Thiếu: ${ServiceTypeService.formatPrice(
              shortfall
            )}\n\n` +
            "Vui lòng nạp thêm tiền vào tài khoản để tiếp tục thanh toán.",
          [
            {
              text: "Hủy",
              style: "cancel",
              onPress: () =>
                console.log(
                  "Payment cancelled due to insufficient balance"
                ),
            },
            {
              text: "Nạp tiền",
              style: "default",
              onPress: () => {
                // TODO: Navigate to top-up screen
                Alert.alert(
                  "Thông báo",
                  "Chức năng nạp tiền sẽ được cập nhật sau.",
                  [{ text: "OK", style: "default" }]
                );
              },
            },
          ]
        );
        return;
      }

      // Hiển thị xác nhận thanh toán
      Alert.alert(
        "Xác nhận thanh toán",
        `Bạn có chắc chắn muốn thanh toán cho lịch hẹn #${bookingID}?\n\n` +
          `Số tiền: ${ServiceTypeService.formatPrice(
            totalAmount
          )}\n` +
          `Số dư hiện tại: ${ServiceTypeService.formatPrice(
            accountBalance
          )}`,
        [
          {
            text: "Hủy",
            style: "cancel",
            onPress: () => console.log("Payment cancelled"),
          },
          {
            text: "Thanh toán",
            style: "default",
            onPress: async () => {
              try {
                // Gọi API thanh toán
                const response = await fetch(
                  "https://phamlequyanh.name.vn/api/Invoice",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json-patch+json",
                    },
                    body: JSON.stringify({
                      bookingID: bookingID,
                      content: `Thanh toán cho lịch hẹn #${bookingID}`,
                    }),
                  }
                );

                if (response.ok) {
                  const result = await response.json();
                  // Thay thế message từ server nếu là "Invoice paid successfully."
                  const displayMessage =
                    result.message === "Invoice paid successfully."
                      ? "Thanh toán hóa đơn thành công"
                      : result.message ||
                        "Thanh toán hóa đơn thành công";

                  Alert.alert("Thành công", displayMessage, [
                    {
                      text: "OK",
                      style: "default",
                      onPress: () => {
                        // Reload booking history để cập nhật status
                        loadUserData();
                      },
                    },
                  ]);
                } else {
                  const errorData = await response.json();
                  Alert.alert(
                    "Lỗi",
                    errorData.message ||
                      "Thanh toán thất bại. Vui lòng thử lại."
                  );
                }
              } catch (error) {
                console.error("Payment error:", error);
                Alert.alert(
                  "Lỗi",
                  "Có lỗi xảy ra khi thanh toán. Vui lòng thử lại."
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Payment preparation error:", error);
      Alert.alert(
        "Lỗi",
        "Không thể chuẩn bị thanh toán. Vui lòng thử lại."
      );
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
            `Không có ${getMajorVietnameseText(
              requiredMajor
            )} nào khả dụng trong khu vực này. Vui lòng đặt lịch cách nhau ít nhất 30 phút.`
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

      // Lọc nurses có cùng zoneID và major phù hợp
      const nursesWithSameZoneAndMajor = nurses.filter(
        (nurse) =>
          nurse.zoneID === zoneDetail.zoneID &&
          compareMajor(nurse.major, requiredMajor)
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
          `Không có ${getMajorVietnameseText(
            requiredMajor
          )} nào khả dụng trong khu vực này. Vui lòng đặt lịch cách nhau ít nhất 30 phút.`
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
      // Sử dụng API mới để cập nhật điều dưỡng
      const response = await fetch(
        `https://phamlequyanh.name.vn/api/CustomizeTask/UpdateNursing/${selectedTask.customizeTaskID}/${nurse.nursingID}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Nurse assignment result:", result);

        Alert.alert(
          "Thành công",
          `Đã chọn điều dưỡng viên: ${nurse.fullName}`
        );

        // Reload customize tasks để cập nhật UI
        await loadCustomizeTasks(selectedTask.bookingID);
        setShowNurseModal(false);
        setSelectedTask(null);
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);

        Alert.alert(
          "Lỗi",
          errorData.message || "Không thể cập nhật điều dưỡng viên"
        );
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
          nurse.major?.toLowerCase() === requiredMajor?.toLowerCase()
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
          `Chỉ có ${getMajorVietnameseText(
            requiredMajor
          )} không hoạt động trong khu vực này. Bạn có muốn tiếp tục?`
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
          `Đã chọn ${getMajorVietnameseText(requiredMajor)}: ${
            selectedNurse.fullName
          } cho lịch hẹn #${bookingID}`
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

  const toggleExpanded = async (bookingID) => {
    setExpandedBookings((prev) => ({
      ...prev,
      [bookingID]: !prev[bookingID],
    }));

    // Nếu đang expand, load package tasks để hiển thị service types
    if (!expandedBookings[bookingID]) {
      try {
        const customizePackages =
          customizePackagesMap[bookingID] || [];
        for (const pkg of customizePackages) {
          if (pkg.serviceID) {
            await loadPackageTasks(pkg.serviceID);
          }
        }
      } catch (error) {
        console.error("Error loading package tasks:", error);
      }
    }
  };

  const loadPackageTasks = async (serviceID) => {
    try {
      const result =
        await ServiceTaskService.getServiceTasksByServiceId(
          serviceID
        );
      if (result.success) {
        // Cập nhật serviceTasks state với tasks mới
        setServiceTasks((prev) => {
          const existing = prev.filter(
            (task) => task.serviceID !== serviceID
          );
          const newTasks = result.data.map((task) => ({
            ...task,
            serviceID,
          }));
          return [...existing, ...newTasks];
        });
      }
    } catch (error) {
      console.error("Error loading package tasks:", error);
    }
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
        return "Đã thanh toán";
      case "completed":
        return "Hoàn thành";
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
      case "isScheduled":
        return "#4CAF50";
      case "cancelled":
        return "#FF6B6B";
      case "completed":
        return "#2196F3";
      default:
        return "#666";
    }
  };

  const getFilteredBookings = () => {
    // Always hide cancelled bookings
    let filteredBookings = bookings.filter(
      (b) => b.status !== "cancelled"
    );

    // Áp dụng filter theo status
    switch (selectedFilter) {
      case "completed":
        filteredBookings = filteredBookings.filter(
          (booking) => booking.status === "completed"
        );
        break;
      case "paid":
        filteredBookings = filteredBookings.filter(
          (booking) => booking.status === "paid"
        );
        break;
      case "pending":
        filteredBookings = filteredBookings.filter(
          (booking) => booking.status === "pending"
        );
        break;
      default:
        // "all" - hiển thị tất cả
        break;
    }

    // Ẩn các booking pending nếu còn < 2 giờ đến thời gian làm việc
    const now = new Date();
    filteredBookings = filteredBookings.filter((booking) => {
      if (booking.status !== "pending") return true;
      const work = new Date(booking.workdate);
      if (isNaN(work.getTime())) return true;
      const diffMs = work.getTime() - now.getTime();
      const twoHoursMs = 2 * 60 * 60 * 1000;
      return diffMs > twoHoursMs;
    });

    // Giữ nguyên thứ tự sắp xếp theo bookingID (đã được sắp xếp trong loadBookingHistory)
    // Không cần sắp xếp lại ở đây

    return filteredBookings;
  };

  const toggleFilter = (filter) => {
    setSelectedFilter(filter);
  };

  const renderBookingCard = (booking, index) => {
    if (!booking || !booking.bookingID) {
      console.error("Invalid booking data:", booking);
      return null;
    }

    const details = bookingDetailsMap[booking.bookingID];
    const bookingStatus = booking.status; // Use booking.status directly

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
          <View style={{ alignItems: "flex-end" }}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(bookingStatus) },
              ]}>
              <Text style={styles.statusText}>
                {formatStatus(bookingStatus)}
              </Text>
            </View>
            {/* Chỉ hiện status "Đã phân công" khi không phải completed */}
            {typeof booking.isSchedule === "boolean" &&
              bookingStatus !== "completed" && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: booking.isSchedule
                        ? "#4CAF50"
                        : "#FFA500",
                      marginTop: 6,
                    },
                  ]}>
                  <Text style={styles.statusText}>
                    {booking.isSchedule
                      ? "Đã phân công"
                      : "Chưa phân công"}
                  </Text>
                </View>
              )}
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

          {/* Cải thiện hiển thị giá */}
          <View style={styles.priceBreakdown}>
            {/* Chỉ hiện "Giá ban đầu" khi có phí phát sinh */}
            {booking.extra &&
              booking.extra > 0 &&
              customizePackagesMap[booking.bookingID] && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Giá ban đầu:</Text>
                  <Text style={styles.originalPrice}>
                    {(() => {
                      const packages =
                        customizePackagesMap[booking.bookingID] || [];
                      const totalOriginalPrice = packages.reduce(
                        (sum, pkg) => sum + (pkg.total || 0),
                        0
                      );
                      return ServiceTypeService.formatPrice(
                        totalOriginalPrice
                      );
                    })()}
                  </Text>
                </View>
              )}

            {/* Phí phát sinh từ booking.extra (phần trăm) */}
            {booking.extra && booking.extra > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Phí phát sinh ({booking.extra}%):
                </Text>
                <Text style={styles.extraFeePrice}>
                  +
                  {ServiceTypeService.formatPrice(
                    (() => {
                      const packages =
                        customizePackagesMap[booking.bookingID] || [];
                      const totalOriginalPrice = packages.reduce(
                        (sum, pkg) => sum + (pkg.total || 0),
                        0
                      );
                      return (
                        (totalOriginalPrice * booking.extra) / 100
                      );
                    })()
                  )}
                </Text>
              </View>
            )}

            {/* Tổng tiền = Giá ban đầu + Phí phát sinh (hoặc chỉ giá ban đầu nếu không có phí) */}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tổng tiền:</Text>
              <Text style={styles.totalPrice}>
                {ServiceTypeService.formatPrice(
                  (() => {
                    const packages =
                      customizePackagesMap[booking.bookingID] || [];
                    const totalOriginalPrice = packages.reduce(
                      (sum, pkg) => sum + (pkg.total || 0),
                      0
                    );
                    const extraFees =
                      booking.extra && booking.extra > 0
                        ? (totalOriginalPrice * booking.extra) / 100
                        : 0;
                    return totalOriginalPrice + extraFees;
                  })()
                )}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày tạo:</Text>
            <Text style={styles.detailValue}>
              {formatDate(booking.createdAt)}
            </Text>
          </View>
        </View>

        {/* Tóm tắt dịch vụ đã hoàn thành - hiển thị ngay cho booking completed */}
        {booking.status === "completed" && (
          <View style={styles.completedServicesSummary}>
            <TouchableOpacity
              style={styles.completedServicesToggle}
              onPress={() => {
                setExpandedBookings((prev) => ({
                  ...prev,
                  [`completed_${booking.bookingID}`]:
                    !prev[`completed_${booking.bookingID}`],
                }));
              }}>
              <Text style={styles.completedServicesToggleText}>
                {expandedBookings[`completed_${booking.bookingID}`]
                  ? "Ẩn dịch vụ đã hoàn thành"
                  : "Xem dịch vụ đã hoàn thành"}
              </Text>
              <Ionicons
                name={
                  expandedBookings[`completed_${booking.bookingID}`]
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={16}
                color="#4CAF50"
              />
            </TouchableOpacity>

            {expandedBookings[`completed_${booking.bookingID}`] && (
              <>
                <Text style={styles.sectionTitle}>
                  Dịch vụ đã hoàn thành:
                </Text>
                {customizeTasksMap[booking.bookingID] &&
                  customizeTasksMap[booking.bookingID].map(
                    (task, taskIndex) => {
                      const serviceInfo = services.find(
                        (s) => s.serviceID === task.serviceID
                      );
                      const assignedNurse = task.nursingID
                        ? nurses.find(
                            (n) => n.nursingID === task.nursingID
                          )
                        : null;

                      return (
                        <View
                          key={task.customizeTaskID}
                          style={styles.completedServiceItem}>
                          <View style={styles.completedServiceHeader}>
                            <Text style={styles.completedServiceName}>
                              {taskIndex + 1}.{" "}
                              {serviceInfo?.serviceName ||
                                `Dịch vụ ${task.serviceID}`}
                            </Text>
                            <Text
                              style={styles.completedServiceStatus}>
                              Hoàn thành
                            </Text>
                          </View>

                          {assignedNurse && (
                            <View
                              style={styles.completedServiceNurse}>
                              <Text
                                style={
                                  styles.completedServiceNurseLabel
                                }>
                                Điều dưỡng thực hiện:
                              </Text>
                              <Text
                                style={
                                  styles.completedServiceNurseName
                                }>
                                {assignedNurse.fullName}
                              </Text>
                            </View>
                          )}

                          <View
                            style={styles.completedServiceDetails}>
                            <Text
                              style={styles.completedServiceOrder}>
                              Thứ tự thực hiện: {task.taskOrder}
                            </Text>
                            {serviceInfo?.description && (
                              <Text
                                style={
                                  styles.completedServiceDescription
                                }>
                                {serviceInfo.description}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    }
                  )}
              </>
            )}
          </View>
        )}

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
                              // Tìm thông tin service từ services cache
                              const serviceInfo = services.find(
                                (s) => s.serviceID === pkg.serviceID
                              );
                              if (serviceInfo) {
                                return serviceInfo.serviceName;
                              }
                              return (
                                pkg.name || `Dịch vụ ${pkg.serviceID}`
                              );
                            })()}
                          </Text>

                          {/* Mô tả dịch vụ nếu có */}
                          {(() => {
                            const serviceInfo = services.find(
                              (s) => s.serviceID === pkg.serviceID
                            );
                            if (
                              serviceInfo &&
                              serviceInfo.description
                            ) {
                              return (
                                <Text
                                  style={styles.packageDescription}>
                                  {serviceInfo.description}
                                </Text>
                              );
                            }
                            return null;
                          })()}

                          <View style={styles.packageDetails}>
                            <Text style={styles.packagePrice}>
                              Giá:{" "}
                              {CustomizePackageService.formatPrice(
                                pkg.price
                              )}
                            </Text>
                            <Text style={styles.packageQuantity}>
                              Số lượng: {pkg.quantity || 1}
                            </Text>
                            {pkg.discount && pkg.discount > 0 && (
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

                          {/* Hiển thị các service con (customize tasks) của package này */}
                          {customizeTasksMap[booking.bookingID] && (
                            <View style={styles.serviceTasksSection}>
                              <Text style={styles.serviceTasksTitle}>
                                Chi tiết
                              </Text>
                              {customizeTasksMap[booking.bookingID]
                                .filter(
                                  (task) =>
                                    task.customizePackageID ===
                                    pkg.customizePackageID
                                )
                                .map((task, taskIndex) => {
                                  // Tìm thông tin service từ serviceID của task
                                  // CustomizeTask có serviceID để liên kết với ServiceTypes
                                  const serviceInfo = services.find(
                                    (s) =>
                                      s.serviceID === task.serviceID
                                  );

                                  // Tìm thông tin điều dưỡng nếu đã được gán
                                  const assignedNurse = task.nursingID
                                    ? nurses.find(
                                        (n) =>
                                          n.nursingID ===
                                          task.nursingID
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

                                      {/* Hiển thị tên điều dưỡng đã được chọn (nếu có) */}
                                      {assignedNurse && (
                                        <View
                                          style={
                                            styles.assignedNurseInfo
                                          }>
                                          <Text
                                            style={
                                              styles.assignedNurseLabel
                                            }>
                                            Điều dưỡng đã chọn:
                                          </Text>
                                          <Text
                                            style={
                                              styles.assignedNurseName
                                            }>
                                            {assignedNurse.fullName}
                                          </Text>
                                        </View>
                                      )}

                                      {/* Hiển thị feedback hoặc nút đánh giá */}
                                      {/* <FeedbackRenderer
                                        task={task}
                                        onOpenModal={
                                          openFeedbackModal
                                        }
                                        feedbackMap={feedbackMap}
                                      /> */}
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

                {/* Medical Notes Section - Ghi chú */}
                {(() => {
                  const medicalNotes =
                    medicalNotesMap[booking.bookingID] || [];
                  if (medicalNotes.length > 0) {
                    return (
                      <View style={styles.medicalNotesSection}>
                        <Text style={styles.sectionTitle}>
                          Ghi chú y tế:
                        </Text>
                        {medicalNotes.map((note, noteIndex) => {
                          // Tìm thông tin điều dưỡng nếu có
                          const nurseInfo = note.nursingID
                            ? nurses.find(
                                (n) => n.nursingID === note.nursingID
                              )
                            : null;

                          return (
                            <View
                              key={note.medicalNoteID}
                              style={styles.medicalNoteItem}>
                              <View style={styles.medicalNoteHeader}>
                                <Text style={styles.medicalNoteTitle}>
                                  Ghi chú #{noteIndex + 1}
                                </Text>
                                <Text style={styles.medicalNoteDate}>
                                  {MedicalNoteService.formatDate(
                                    note.createdAt
                                  )}
                                </Text>
                              </View>

                              {/* Thông tin điều dưỡng */}
                              {nurseInfo && (
                                <View style={styles.nurseInfoNote}>
                                  <Text style={styles.nurseInfoLabel}>
                                    Điều dưỡng viên:
                                  </Text>
                                  <Text style={styles.nurseInfoName}>
                                    {nurseInfo.fullName}
                                  </Text>
                                </View>
                              )}

                              {/* Nội dung ghi chú */}
                              {note.note && (
                                <View style={styles.noteContent}>
                                  <Text style={styles.noteLabel}>
                                    Ghi chú:
                                  </Text>
                                  <Text style={styles.noteText}>
                                    {note.note}
                                  </Text>
                                </View>
                              )}

                              {/* Lời khuyên */}
                              {note.advice && (
                                <View style={styles.adviceContent}>
                                  <Text style={styles.adviceLabel}>
                                    Lời khuyên:
                                  </Text>
                                  <Text style={styles.adviceText}>
                                    {note.advice}
                                  </Text>
                                </View>
                              )}

                              {/* Hình ảnh nếu có */}
                              {note.image &&
                                note.image.trim() !== "" && (
                                  <View style={styles.imageContent}>
                                    <Text style={styles.imageLabel}>
                                      Hình ảnh:
                                    </Text>
                                    <Text style={styles.imageText}>
                                      {note.image}
                                    </Text>
                                  </View>
                                )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  } else if (booking.status === "completed") {
                    // Chỉ hiển thị thông báo khi booking đã hoàn thành
                    return (
                      <View style={styles.medicalNotesSection}>
                        <Text style={styles.sectionTitle}>
                          Ghi chú y tế:
                        </Text>
                        <View style={styles.noMedicalNotesContainer}>
                          <Text style={styles.noMedicalNotesText}>
                            Chưa có ghi chú y tế cho lịch hẹn này
                          </Text>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* Actions: pay and cancel */}
                {(() => {
                  const inv = invoiceMap[booking.bookingID];
                  const invoiceStatus = inv?.status;
                  const canCancelByInvoice =
                    invoiceStatus === "pending" ||
                    invoiceStatus === "paid";
                  const canCancelByBooking =
                    bookingStatus === "pending" ||
                    bookingStatus === "paid";
                  // Không hiển thị actions cho booking đã hoàn thành
                  const showActions =
                    (canCancelByBooking || canCancelByInvoice) &&
                    bookingStatus !== "completed";
                  if (!showActions) return null;
                  return (
                    <View style={styles.paymentSection}>
                      {bookingStatus === "pending" && (
                        <TouchableOpacity
                          style={styles.paymentButton}
                          onPress={() =>
                            handlePayment(booking.bookingID)
                          }>
                          <Ionicons
                            name="card-outline"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.paymentButtonText}>
                            Thanh toán ngay
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking)}>
                        <Ionicons
                          name="close-circle-outline"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.cancelButtonText}>
                          Hủy booking
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const handleCancelBooking = async (booking) => {
    try {
      // Không cho phép hủy booking đã hoàn thành
      if (booking.status === "completed") {
        Alert.alert(
          "Không thể hủy",
          "Lịch hẹn đã hoàn thành không thể hủy."
        );
        return;
      }

      Alert.alert(
        "Xác nhận hủy",
        `Bạn có chắc muốn hủy lịch hẹn #${booking.bookingID}?` +
          (booking.status === "paid"
            ? "\n\nĐơn đã hoàn thành sẽ được hoàn tiền về ví."
            : ""),
        [
          { text: "Không", style: "cancel" },
          {
            text: "Hủy đặt",
            style: "destructive",
            onPress: async () => {
              try {
                // determine invoice for this booking, if any
                const invoice = invoiceMap[booking.bookingID];
                if (booking.status === "paid" && invoice?.invoiceID) {
                  // call refund API
                  const refundResult =
                    await TransactionHistoryService.refundMoneyToWallet(
                      invoice.invoiceID
                    );
                  if (!refundResult.success) {
                    Alert.alert(
                      "Lỗi",
                      refundResult.error || "Hoàn tiền thất bại"
                    );
                    return;
                  }
                }

                // Update local booking status to cancelled and block payment
                setBookings((prev) =>
                  prev.map((b) =>
                    b.bookingID === booking.bookingID
                      ? { ...b, status: "cancelled" }
                      : b
                  )
                );

                // Also reflect invoice status as cancelled if present
                if (invoiceMap[booking.bookingID]) {
                  setInvoiceMap((prev) => ({
                    ...prev,
                    [booking.bookingID]: {
                      ...prev[booking.bookingID],
                      status: "cancelled",
                    },
                  }));
                }

                Alert.alert(
                  "Thành công",
                  `Đã hủy lịch hẹn #${booking.bookingID}`
                );
              } catch (innerError) {
                console.error(
                  "Error cancelling booking (inner):",
                  innerError
                );
                Alert.alert("Lỗi", "Không thể hủy lịch hẹn");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error cancelling booking:", error);
      Alert.alert("Lỗi", "Không thể hủy lịch hẹn");
    }
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
        <Text style={styles.headerTitle}>Lịch sử đặt lịch</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => toggleFilter("all")}>
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === "all" &&
                  styles.filterButtonTextActive,
              ]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "completed" &&
                styles.filterButtonActive,
            ]}
            onPress={() => toggleFilter("completed")}>
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === "completed" &&
                  styles.filterButtonTextActive,
              ]}>
              Hoàn thành
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "paid" && styles.filterButtonActive,
            ]}
            onPress={() => toggleFilter("paid")}>
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === "paid" &&
                  styles.filterButtonTextActive,
              ]}>
              Đã thanh toán
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "pending" &&
                styles.filterButtonActive,
            ]}
            onPress={() => toggleFilter("pending")}>
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === "pending" &&
                  styles.filterButtonTextActive,
              ]}>
              Chờ thanh toán
            </Text>
          </TouchableOpacity>
        </View>
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
              {selectedFilter === "completed"
                ? "Chưa có lịch hẹn hoàn thành"
                : selectedFilter === "paid"
                ? "Chưa có lịch hẹn đã thanh toán"
                : selectedFilter === "pending"
                ? "Chưa có lịch hẹn chờ thanh toán"
                : "Chưa có lịch hẹn nào"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === "completed"
                ? "Các lịch hẹn đã hoàn thành sẽ hiển thị ở đây"
                : selectedFilter === "paid"
                ? "Các lịch hẹn đã thanh toán sẽ hiển thị ở đây"
                : selectedFilter === "pending"
                ? "Các lịch hẹn chờ thanh toán sẽ hiển thị ở đây"
                : "Lịch sử đặt lịch sẽ hiển thị ở đây"}
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

      {/* Modal đánh giá - ĐÃ XÓA */}
      {/* <Modal visible={showFeedbackModal} ... /> */}
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    marginHorizontal: 4,
    alignItems: "center",
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
  packageDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 5,
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
  debugText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 10,
  },
  extraFeeNote: {
    fontSize: 12,
    color: "red",
    fontStyle: "italic",
    marginTop: 5,
  },
  priceBreakdown: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  extraFeePrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  packageSummary: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  priceSummaryCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  priceSummaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  priceSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 3,
  },
  priceSummaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceSummaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  priceSummaryTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    marginTop: 5,
  },
  priceSummaryTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  debugInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  serviceTasksSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  serviceTasksTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  serviceTaskItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  serviceTaskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  serviceTaskName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  serviceTaskOrder: {
    fontSize: 13,
    color: "#666",
  },
  serviceTaskStatus: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  assignedNurseInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  assignedNurseLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  assignedNurseName: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  noNurseAssigned: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  noNurseText: {
    fontSize: 14,
    color: "#666",
  },
  assignNurseButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  assignNurseButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  cancelButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9E9E9E",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#9E9E9E",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  medicalNotesSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  medicalNoteItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  medicalNoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  medicalNoteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  medicalNoteDate: {
    fontSize: 14,
    color: "#666",
  },
  nurseInfoNote: {
    marginBottom: 5,
  },
  nurseInfoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  nurseInfoName: {
    fontSize: 14,
    color: "#666",
  },
  noteContent: {
    marginBottom: 5,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  noteText: {
    fontSize: 14,
    color: "#666",
  },
  adviceContent: {
    marginBottom: 5,
  },
  adviceLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  adviceText: {
    fontSize: 14,
    color: "#666",
  },
  imageContent: {
    marginBottom: 5,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  imageText: {
    fontSize: 14,
    color: "#666",
  },
  noMedicalNotesContainer: {
    padding: 20,
    alignItems: "center",
  },
  noMedicalNotesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  feedbackDisplay: {
    marginBottom: 10,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  feedbackStars: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedbackButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
    marginRight: 10,
  },
  feedbackButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  feedbackButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  feedbackContent: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic",
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  starButton: {
    marginHorizontal: 2,
  },
  feedbackModalContent: {
    padding: 20,
    alignItems: "center",
  },
  feedbackModalSubtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  feedbackInputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 5,
  },
  feedbackInput: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    marginBottom: 10,
  },
  submitFeedbackButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  submitFeedbackButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  completedServicesSummary: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  completedServiceItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  completedServiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  completedServiceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  completedServiceStatus: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  completedServiceNurse: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  completedServiceNurseLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  completedServiceNurseName: {
    fontSize: 14,
    color: "#666",
  },
  completedServiceDetails: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  completedServiceOrder: {
    fontSize: 14,
    color: "#666",
  },
  completedServiceDescription: {
    fontSize: 14,
    color: "#666",
  },
  completedServicesToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  completedServicesToggleText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
});
