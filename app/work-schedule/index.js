import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import AuthService from "../../services/authService";
import BookingService from "../../services/bookingService";
import CareProfileService from "../../services/careProfileService";
import CustomizeTaskService from "../../services/customizeTaskService";
import MedicalNoteService from "../../services/medicalNoteService";
import NursingSpecialistService from "../../services/nursingSpecialistService";
import RelativeService from "../../services/relativeService";
import ServiceTypeService from "../../services/serviceTypeService";
import WorkScheduleService from "../../services/workScheduleService";
import { getMajorDisplayText } from "../../utils/majorUtils";

// Configure Vietnamese locale for calendar
LocaleConfig.locales["vi"] = {
  monthNames: [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
  monthNamesShort: [
    "T1",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "T8",
    "T9",
    "T10",
    "T11",
    "T12",
  ],
  dayNames: [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ],
  dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  today: "Hôm nay",
};
LocaleConfig.defaultLocale = "vi";

export default function WorkScheduleScreen() {
  const router = useRouter();
  const [workSchedules, setWorkSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
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
  const [markedDates, setMarkedDates] = useState({});

  // Medical notes states
  const [medicalNotes, setMedicalNotes] = useState([]);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({
    note: "",
  });

  // View medical notes states
  const [showMedicalNotesModal, setShowMedicalNotesModal] =
    useState(false);
  const [isLoadingMedicalNotes, setIsLoadingMedicalNotes] =
    useState(false);

  // Kiểm tra xem có thể điểm danh "đã đến" hay không
  const canMarkArrived = (schedule) => {
    if (!schedule || !schedule.workDate) return false;

    const now = new Date();
    const workDate = new Date(schedule.workDate);
    const endTime = new Date(schedule.endTime);
    const fifteenMinutesBefore = new Date(
      workDate.getTime() - 15 * 60 * 1000
    );

    // Chỉ cho phép trước 15 phút đến hết giờ làm
    return now >= fifteenMinutesBefore && now <= endTime;
  };

  // Kiểm tra xem có thể điểm danh hay không
  const canMarkAttendance = (schedule) => {
    if (!schedule || !schedule.workDate) return false;

    // Chỉ cho phép điểm danh sau khi đã điểm danh "đã đến"
    return schedule.status === "arrived";
  };

  // Xử lý điểm danh "đã đến"
  const handleMarkArrived = async (schedule) => {
    if (!canMarkArrived(schedule)) {
      Alert.alert(
        "Không thể điểm danh",
        "Chỉ có thể điểm danh 'đã đến' trước giờ làm 30 phút hoặc trong giờ làm."
      );
      return;
    }

    try {
      const result = await WorkScheduleService.updateStatus(
        schedule.workScheduleID,
        "arrived"
      );

      if (result.success) {
        Alert.alert(
          "Thành công",
          "Đã điểm danh 'đã đến' thành công!"
        );

        // Cập nhật local state
        setWorkSchedules((prevSchedules) =>
          prevSchedules.map((s) =>
            s.workScheduleID === schedule.workScheduleID
              ? { ...s, status: "arrived" }
              : s
          )
        );

        // Cập nhật today schedules nếu cần
        setTodaySchedules((prevTodaySchedules) =>
          prevTodaySchedules.map((s) =>
            s.workScheduleID === schedule.workScheduleID
              ? { ...s, status: "arrived" }
              : s
          )
        );

        // Cập nhật selectedSchedule trong modal nếu đang mở
        setSelectedSchedule((prev) =>
          prev && prev.workScheduleID === schedule.workScheduleID
            ? { ...prev, status: "arrived" }
            : prev
        );
      } else {
        Alert.alert(
          "Lỗi",
          result.error || "Không thể điểm danh 'đã đến'"
        );
      }
    } catch (error) {
      console.error("Error marking arrived:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi điểm danh 'đã đến'");
    }
  };

  // Xử lý điểm danh (hoàn thành)
  const handleMarkAttendance = async (schedule) => {
    if (!canMarkAttendance(schedule)) {
      Alert.alert(
        "Không thể điểm danh",
        "Chỉ có thể điểm danh sau khi đã điểm danh 'đã đến'."
      );
      return;
    }

    try {
      const result = await WorkScheduleService.updateStatus(
        schedule.workScheduleID,
        "completed"
      );

      if (result.success) {
        Alert.alert("Thành công", "Đã điểm danh thành công!");

        // Cập nhật local state
        setWorkSchedules((prevSchedules) =>
          prevSchedules.map((s) =>
            s.workScheduleID === schedule.workScheduleID
              ? { ...s, isAttended: true, status: "completed" }
              : s
          )
        );

        // Cập nhật today schedules nếu cần
        setTodaySchedules((prevTodaySchedules) =>
          prevTodaySchedules.map((s) =>
            s.workScheduleID === schedule.workScheduleID
              ? { ...s, isAttended: true, status: "completed" }
              : s
          )
        );

        // Cập nhật selectedSchedule trong modal nếu đang mở
        setSelectedSchedule((prev) =>
          prev && prev.workScheduleID === schedule.workScheduleID
            ? { ...prev, isAttended: true, status: "completed" }
            : prev
        );
      } else {
        Alert.alert("Lỗi", result.error || "Không thể điểm danh");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi điểm danh");
    }
  };

  // Load medical notes cho schedule
  const loadMedicalNotes = async (schedule, customizeTask) => {
    try {
      // Sử dụng customizeTaskID từ schedule parameter trước, nếu không có thì dùng từ scheduleDetails
      let customizeTaskID = schedule?.customizeTaskID;

      if (!customizeTaskID && customizeTask) {
        customizeTaskID = customizeTask.customizeTaskID;
      }

      if (!customizeTaskID) {
        setMedicalNotes([]);
        return;
      }

      // Thử dùng endpoint riêng trước
      let result =
        await MedicalNoteService.getMedicalNotesByCustomizeTaskId(
          customizeTaskID
        );

      // Nếu endpoint riêng không hoạt động, thử dùng getAll và filter
      if (!result.success || !result.data) {
        const allNotesResult =
          await MedicalNoteService.getAllMedicalNotes();

        if (allNotesResult.success && allNotesResult.data) {
          // Filter theo customizeTaskID
          const filteredNotes = allNotesResult.data.filter(
            (note) => note.customizeTaskID === customizeTaskID
          );
          result = { success: true, data: filteredNotes };
        }
      }

      if (result.success) {
        setMedicalNotes(result.data);
      } else {
        setMedicalNotes([]);
      }
    } catch (error) {
      console.error("Error loading medical notes:", error);
      setMedicalNotes([]);
    }
  };

  // Reload medical notes
  const reloadMedicalNotes = async () => {
    if (scheduleDetails.customizeTask) {
      await loadMedicalNotes(
        selectedSchedule,
        scheduleDetails.customizeTask
      );
    }
  };

  // Thêm medical note mới
  const handleAddMedicalNote = async () => {
    if (!selectedSchedule) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin lịch làm việc");
      return;
    }

    if (!newNote.note.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung ghi chú");
      return;
    }

    // Lấy customizeTaskID từ scheduleDetails.customizeTask
    const customizeTaskID =
      scheduleDetails.customizeTask?.customizeTaskID;

    if (!customizeTaskID) {
      Alert.alert(
        "Lỗi",
        "Không tìm thấy thông tin công việc để thêm ghi chú"
      );
      return;
    }

    try {
      const noteData = {
        customizeTaskID: customizeTaskID,
        note: newNote.note.trim(),
        advice: newNote.advice?.trim?.() || "",
        image: "",
      };

      const result = await MedicalNoteService.createMedicalNote(
        noteData
      );

      if (result.success) {
        Alert.alert("Thành công", "Đã thêm ghi chú thành công!");

        // Reset form
        resetMedicalNoteForm();

        // Reload medical notes
        await reloadMedicalNotes();
      } else {
        Alert.alert("Lỗi", result.error || "Không thể thêm ghi chú");
      }
    } catch (error) {
      console.error("Error adding medical note:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi thêm ghi chú");
    }
  };

  useEffect(() => {
    loadUserData();
    checkUnreadNotifications();
  }, []);

  const checkUnreadNotifications = async () => {
    try {
      // For now, we'll skip notification checking in this screen to avoid the useInsertionEffect error
      // This can be re-enabled later when the React 19 compatibility issue is resolved
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      console.log("WorkScheduleScreen: User data loaded:", user);

      if (user) {
        setUserData(user);
        // Get nursingID - try different property names
        const nursingID =
          user.nursingID || user.nursing_id || user.id;
        console.log(
          "WorkScheduleScreen: Extracted nursingID:",
          nursingID
        );

        if (nursingID) {
          loadWorkSchedules(nursingID);
        } else {
          console.log(
            "WorkScheduleScreen: No nursingID in user; resolving by accountID..."
          );
          try {
            const allNursesResult =
              await NursingSpecialistService.getAllDetailedNurses();
            if (allNursesResult.success) {
              const byAccount = (allNursesResult.data || []).find(
                (n) => n.accountID === (user.accountID || user.id)
              );
              if (byAccount?.nursingID) {
                console.log(
                  "WorkScheduleScreen: Found nursingID via account:",
                  byAccount.nursingID
                );
                loadWorkSchedules(byAccount.nursingID);
              } else {
                console.log(
                  "WorkScheduleScreen: Could not resolve nursingID via account; aborting load"
                );
                setWorkSchedules([]);
              }
            } else {
              console.log(
                "WorkScheduleScreen: Failed to fetch nurses to resolve nursingID"
              );
              setWorkSchedules([]);
            }
          } catch (resolveErr) {
            console.log(
              "WorkScheduleScreen: Error resolving nursingID:",
              resolveErr
            );
            setWorkSchedules([]);
          }
        }
      } else {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error(
        "WorkScheduleScreen: Error loading user data:",
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
        "WorkScheduleScreen: Loading work schedules for nursingID:",
        nursingID
      );

      const result =
        await WorkScheduleService.getWorkSchedulesByNursingId(
          nursingID
        );

      if (result.success) {
        console.log(
          "WorkScheduleScreen: Raw filtered schedules:",
          result.data
        );
        setWorkSchedules(result.data);
        processMarkedDates(result.data);
        processTodaySchedules(result.data);
        console.log(
          "WorkScheduleScreen: Loaded",
          result.data.length,
          "work schedules"
        );
      } else {
        console.log(
          "WorkScheduleScreen: Failed to load work schedules:",
          result.error
        );
        Alert.alert("Lỗi", "Không thể tải lịch làm việc");
        setWorkSchedules([]);
      }
    } catch (error) {
      console.error(
        "WorkScheduleScreen: Error loading work schedules:",
        error
      );
      Alert.alert("Lỗi", "Có lỗi xảy ra khi tải lịch làm việc");
      setWorkSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const processMarkedDates = (schedules) => {
    const marked = {};

    // Filter out cancelled schedules first
    const activeSchedules = schedules.filter(
      (schedule) => schedule.status !== "cancelled"
    );

    activeSchedules.forEach((schedule) => {
      const dateKey = schedule.workDate.split("T")[0]; // Extract YYYY-MM-DD

      if (!marked[dateKey]) {
        marked[dateKey] = {
          // Use colored background instead of dots
          customStyles: {
            container: {
              backgroundColor: WorkScheduleService.getStatusColor(
                schedule.status
              ),
              borderRadius: 8,
            },
            text: {
              color: "white",
              fontWeight: "bold",
            },
          },
          schedules: [],
        };
      }

      marked[dateKey].schedules.push(schedule);

      // If multiple schedules on same day, use a mixed gradient color
      if (marked[dateKey].schedules.length > 1) {
        marked[dateKey].customStyles.container.backgroundColor =
          "#4FC3F7"; // Blue for multiple
      }
    });

    setMarkedDates(marked);
  };

  const processTodaySchedules = (schedules) => {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    const todaySchedules = schedules.filter(
      (schedule) =>
        schedule.workDate.split("T")[0] === today &&
        schedule.status !== "cancelled" // Filter out cancelled schedules
    );

    // Sort today's schedules by time
    todaySchedules.sort(
      (a, b) => new Date(a.workDate) - new Date(b.workDate)
    );

    setTodaySchedules(todaySchedules);
  };

  const onDayPress = (day) => {
    const dateKey = day.dateString;
    setSelectedDate(dateKey);

    // Find schedules for selected date (excluding cancelled ones)
    const daySchedules = workSchedules.filter(
      (schedule) =>
        schedule.workDate.split("T")[0] === dateKey &&
        schedule.status !== "cancelled"
    );

    setSelectedSchedules(daySchedules);
  };

  // Format date to Vietnamese format (DD/MM/YYYY)
  const formatVietnameseDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get today's date in Vietnamese format
  const getTodayVietnameseDate = () => {
    const today = new Date();
    return formatVietnameseDate(today.toISOString());
  };

  // Format major/specialty for display
  const formatMajor = (major) => {
    return getMajorDisplayText(major);
  };

  // Format booking status to Vietnamese
  const formatBookingStatus = (status) => {
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
      case "rescheduled":
        return "Đã đổi lịch";
      default:
        return status || "Không xác định";
    }
  };

  const openScheduleDetail = async (schedule) => {
    try {
      setSelectedSchedule(schedule);
      setIsLoadingDetails(true);
      setShowDetailModal(true);

      console.log(
        "WorkScheduleScreen: Loading details for schedule:",
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
        console.log("WorkScheduleScreen: Booking loaded:", booking);

        // Load care profile details
        if (booking.careProfileID) {
          const careProfileResult =
            await CareProfileService.getCareProfileById(
              booking.careProfileID
            );
          if (careProfileResult.success) {
            careProfile = careProfileResult.data;
            console.log(
              "WorkScheduleScreen: Care profile loaded:",
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
                "WorkScheduleScreen: Relatives loaded:",
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
        console.log("WorkScheduleScreen: Service loaded:", service);
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
          "WorkScheduleScreen: CustomizeTask loaded:",
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

      // Load medical notes cho schedule này sau khi đã có customizeTask
      if (customizeTask) {
        await loadMedicalNotes(schedule, customizeTask);
      }
    } catch (error) {
      console.error(
        "WorkScheduleScreen: Error loading schedule details:",
        error
      );
      Alert.alert("Lỗi", "Không thể tải chi tiết lịch làm việc");
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

  // Reset medical note form
  const resetMedicalNoteForm = () => {
    setNewNote({
      note: "",
      advice: "",
    });
    setShowAddNoteModal(false);
  };

  // Open Add Note modal immediately (avoid stacking lag with detail modal)
  const openAddNoteModal = () => {
    setShowDetailModal(false);
    setShowAddNoteModal(true);
  };

  // Medical notes functions
  const openMedicalNotesModal = async () => {
    setShowMedicalNotesModal(true);
    await loadMedicalNotesForService();
  };

  const closeMedicalNotesModal = () => {
    setShowMedicalNotesModal(false);
    setMedicalNotes([]);
  };

  const loadMedicalNotesForService = async () => {
    try {
      setIsLoadingMedicalNotes(true);

      if (
        !scheduleDetails.careProfile ||
        !scheduleDetails.customizeTask
      ) {
        console.log("Missing care profile or customize task data");
        setMedicalNotes([]);
        return;
      }

      const careProfileId = scheduleDetails.careProfile.careProfileID;
      const serviceId = scheduleDetails.customizeTask.serviceID;

      console.log(
        "Loading medical notes for care profile:",
        careProfileId,
        "service:",
        serviceId
      );

      // Fetch medical notes by care profile
      const response = await fetch(
        `https://phamlequyanh.name.vn/api/MedicalNote/by-careprofile-service?careProfileId=${careProfileId}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Raw medical notes data:", data);

        // Filter notes by service ID
        const filteredNotes = data.filter((note) => {
          // Get customize task to check service ID
          return (
            note.customizeTaskID ===
            scheduleDetails.customizeTask.customizeTaskID
          );
        });

        console.log(
          "Filtered medical notes for service:",
          filteredNotes
        );

        // Enhance notes with additional information
        const enhancedNotes = await Promise.all(
          filteredNotes.map(async (note) => {
            const enhancedNote = { ...note };

            // Fetch nursing specialist name
            try {
              const nursingResponse = await fetch(
                `https://phamlequyanh.name.vn/api/nursingspecialists/get/${note.nursingID}`,
                { headers: { accept: "*/*" } }
              );
              if (nursingResponse.ok) {
                const nursingData = await nursingResponse.json();
                enhancedNote.nursingName =
                  nursingData.fullName ||
                  nursingData.nursingFullName ||
                  nursingData.name;
              }
            } catch (error) {
              console.log("Could not fetch nursing name:", error);
            }

            // Fetch relative name if relativeID exists
            if (note.relativeID) {
              try {
                const relativeResponse = await fetch(
                  `https://phamlequyanh.name.vn/api/relatives/get/${note.relativeID}`,
                  { headers: { accept: "*/*" } }
                );
                if (relativeResponse.ok) {
                  const relativeData = await relativeResponse.json();
                  enhancedNote.relativeName =
                    relativeData.relativeName || relativeData.name;
                }
              } catch (error) {
                console.log("Could not fetch relative name:", error);
              }
            }

            // Fetch service name via customize task
            try {
              // First get the customize task to find the serviceID
              const customizeTaskResponse = await fetch(
                `https://phamlequyanh.name.vn/api/CustomizeTask/${note.customizeTaskID}`,
                { headers: { accept: "*/*" } }
              );
              if (customizeTaskResponse.ok) {
                const customizeTaskData =
                  await customizeTaskResponse.json();
                const serviceID = customizeTaskData.serviceID;

                if (serviceID) {
                  // Now fetch the service type using the serviceID
                  const serviceResponse = await fetch(
                    `https://phamlequyanh.name.vn/api/servicetypes/get/${serviceID}`,
                    { headers: { accept: "*/*" } }
                  );
                  if (serviceResponse.ok) {
                    const serviceData = await serviceResponse.json();
                    enhancedNote.serviceName =
                      serviceData.serviceName || serviceData.name;
                    console.log(
                      "Fetched service name:",
                      enhancedNote.serviceName
                    );
                  } else {
                    console.log(
                      "Failed to fetch service name, status:",
                      serviceResponse.status
                    );
                  }
                } else {
                  console.log("No serviceID found in customize task");
                }
              } else {
                console.log(
                  "Failed to fetch customize task, status:",
                  customizeTaskResponse.status
                );
              }
            } catch (error) {
              console.log("Could not fetch service name:", error);
            }

            return enhancedNote;
          })
        );

        setMedicalNotes(enhancedNotes);
      } else {
        // Gracefully handle not found or error responses without spamming errors
        if (response.status !== 404) {
          console.log(
            "Medical notes request returned status:",
            response.status
          );
        }
        setMedicalNotes([]);
      }
    } catch (error) {
      // Avoid noisy redbox; log minimally in dev and continue with empty list
      console.log(
        "Medical notes request failed:",
        error?.message || error
      );
      setMedicalNotes([]);
    } finally {
      setIsLoadingMedicalNotes(false);
    }
  };

  const renderScheduleItem = (schedule, isToday = false) => {
    return (
      <TouchableOpacity
        key={schedule.workScheduleID}
        style={[
          styles.scheduleItem,
          isToday && styles.todayScheduleItem,
        ]}
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
              <Text style={styles.scheduleTime}>
                {WorkScheduleService.formatTime(schedule.workDate)} -{" "}
                {WorkScheduleService.formatTime(schedule.endTime)}
              </Text>
              <Text style={styles.bookingId}>
                Đặt lịch #{schedule.bookingID}
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

          <View style={styles.scheduleDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>
                Dịch vụ ID: {schedule.serviceID}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailText}>
                {schedule.isAttended
                  ? "Đã tham gia"
                  : "Chưa tham gia"}
              </Text>
            </View>

            {/* Nút "Đã đến" - hiện khi chưa điểm danh "đã đến" và trong khoảng thời gian cho phép */}
            {schedule.status !== "arrived" && isToday && (
              <View style={styles.attendanceRow}>
                <TouchableOpacity
                  style={styles.attendanceButton}
                  onPress={() => handleMarkArrived(schedule)}
                  disabled={!canMarkArrived(schedule)}>
                  <Ionicons
                    name="location"
                    size={18}
                    color={
                      canMarkArrived(schedule) ? "#2196F3" : "#999"
                    }
                  />
                  <Text
                    style={[
                      styles.attendanceButtonText,
                      {
                        color: canMarkArrived(schedule)
                          ? "#2196F3"
                          : "#999",
                      },
                    ]}>
                    Đã đến
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Nút "Điểm danh" - chỉ hiện khi đã "Đã đến" và chưa điểm danh tham gia */}
            {schedule.status === "arrived" &&
              !schedule.isAttended &&
              isToday && (
                <View style={styles.attendanceRow}>
                  <TouchableOpacity
                    style={styles.attendanceButton}
                    onPress={() => handleMarkAttendance(schedule)}
                    disabled={!canMarkAttendance(schedule)}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={
                        canMarkAttendance(schedule)
                          ? "#4CAF50"
                          : "#999"
                      }
                    />
                    <Text
                      style={[
                        styles.attendanceButtonText,
                        {
                          color: canMarkAttendance(schedule)
                            ? "#4CAF50"
                            : "#999",
                        },
                      ]}>
                      Điểm danh
                    </Text>
                  </TouchableOpacity>
                  {!canMarkAttendance(schedule) && (
                    <Text style={styles.attendanceNote}>
                      Chỉ điểm danh sau khi đã điểm danh "đã đến"
                    </Text>
                  )}
                </View>
              )}

            {isToday && (
              <View style={styles.detailRow}>
                <Text
                  style={[
                    styles.detailText,
                    { color: "#4FC3F7", fontWeight: "600" },
                  ]}>
                  Nhấn để xem thông tin khách hàng
                </Text>
              </View>
            )}
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
                Chi tiết lịch làm việc
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

                    {/* Nút Điểm danh trong modal - chỉ bật khi đã 'Đã đến' */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        style={styles.modalActionButton}
                        onPress={() =>
                          handleMarkAttendance(selectedSchedule)
                        }
                        disabled={
                          !canMarkAttendance(selectedSchedule)
                        }>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={
                            canMarkAttendance(selectedSchedule)
                              ? "#4CAF50"
                              : "#999"
                          }
                        />
                        <Text
                          style={[
                            styles.modalActionButtonText,
                            {
                              color: canMarkAttendance(
                                selectedSchedule
                              )
                                ? "#4CAF50"
                                : "#999",
                            },
                          ]}>
                          Điểm danh
                        </Text>
                      </TouchableOpacity>

                      {/* Xem ghi chú: chỉ mở khi đã completed */}
                      <TouchableOpacity
                        style={styles.viewNotesButton}
                        onPress={openMedicalNotesModal}
                        disabled={
                          selectedSchedule.status !== "completed"
                        }>
                        <Ionicons
                          name="document-text"
                          size={20}
                          color={
                            selectedSchedule.status === "completed"
                              ? "#2196F3"
                              : "#999"
                          }
                        />
                        <Text
                          style={[
                            styles.viewNotesButtonText,
                            {
                              color:
                                selectedSchedule.status ===
                                "completed"
                                  ? "#2196F3"
                                  : "#999",
                            },
                          ]}>
                          Xem ghi chú
                        </Text>
                      </TouchableOpacity>
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

                {/* Relatives Info */}
                {scheduleDetails.relatives &&
                  scheduleDetails.relatives.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>
                        Thông tin con (
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
                              Người con thứ #{index + 1}
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

                {/* Medical Notes Section */}
                <View style={styles.detailSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      Ghi chú ({medicalNotes.length})
                    </Text>
                    {scheduleDetails.customizeTask &&
                      medicalNotes.length === 0 &&
                      selectedSchedule?.status === "completed" && (
                        <TouchableOpacity
                          style={styles.addNoteButton}
                          onPress={openAddNoteModal}>
                          <Ionicons
                            name="add-circle"
                            size={20}
                            color="#4CAF50"
                          />
                          <Text style={styles.addNoteButtonText}>
                            Thêm ghi chú
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>

                  {/* Debug info */}
                  {/* Removed debug info since auto-load is working */}

                  {medicalNotes.length > 0 ? (
                    <>
                      <View style={styles.existingNotesInfo}>
                        <Text style={styles.existingNotesText}>
                          Đã có ghi chú cho lịch hẹn này. Không thể
                          thêm ghi chú mới.
                        </Text>
                      </View>
                      {medicalNotes.map((note, index) => (
                        <View
                          key={note.medicalNoteID}
                          style={styles.medicalNoteItem}>
                          <View style={styles.medicalNoteHeader}>
                            <Text style={styles.medicalNoteTitle}>
                              Ghi chú #{index + 1}
                            </Text>
                            <Text style={styles.medicalNoteDate}>
                              {MedicalNoteService.formatDate(
                                note.createdAt
                              )}
                            </Text>
                          </View>

                          {note.note && (
                            <View style={styles.noteContent}>
                              <Text style={styles.noteLabel}>
                                Nội dung:
                              </Text>
                              <Text style={styles.noteText}>
                                {note.note}
                              </Text>
                            </View>
                          )}

                          {/* Thông tin bổ sung */}
                          <View style={styles.noteFooter}>
                            <Text style={styles.noteFooterText}>
                              Tạo lúc:{" "}
                              {MedicalNoteService.formatDateTime(
                                note.createdAt
                              )}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : (
                    <View style={styles.noMedicalNotesContainer}>
                      <Text style={styles.noMedicalNotesText}>
                        {scheduleDetails.customizeTask
                          ? "Chưa có ghi chú nào cho lịch hẹn này."
                          : "Không thể thêm ghi chú vì chưa có thông tin công việc"}
                      </Text>
                      {selectedSchedule?.status !== "completed" &&
                        scheduleDetails.customizeTask && (
                          <Text style={styles.attendanceRequiredText}>
                            Cần điểm danh để thêm ghi chú.
                          </Text>
                        )}
                    </View>
                  )}
                </View>

                {/* Feedback Section */}
                {/* Removed feedback section - nurses don't need to evaluate their work */}
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
            Đang tải lịch làm việc...
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
        <Text style={styles.headerTitle}>Lịch làm việc</Text>
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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={new Date().toISOString().split("T")[0]}
            onDayPress={onDayPress}
            markingType={"custom"}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...markedDates[selectedDate],
                customStyles: {
                  container: {
                    backgroundColor: "#4FC3F7",
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: "#ffffff",
                  },
                  text: {
                    color: "white",
                    fontWeight: "bold",
                  },
                },
              },
            }}
            theme={{
              backgroundColor: "transparent",
              calendarBackground: "rgba(255, 255, 255, 0.95)",
              textSectionTitleColor: "#333",
              selectedDayBackgroundColor: "#4FC3F7",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#4FC3F7",
              dayTextColor: "#333",
              textDisabledColor: "#d9e1e8",
              arrowColor: "#4FC3F7",
              monthTextColor: "#333",
              indicatorColor: "#4FC3F7",
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              textDayHeaderFontFamily: "System",
              textDayFontWeight: "400",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "500",
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
          />
        </View>

        {/* Today's Schedule Section - Only show if there are schedules */}
        {todaySchedules.length > 0 && (
          <View style={styles.todaySection}>
            <Text style={styles.todaySectionTitle}>
              Lịch Hôm nay - {getTodayVietnameseDate()} (
              {todaySchedules.length})
            </Text>
            <View style={styles.todaySchedulesList}>
              {todaySchedules.map((schedule) =>
                renderScheduleItem(schedule, true)
              )}
            </View>
          </View>
        )}

        {/* Schedule List for Selected Date */}
        {selectedDate && (
          <View style={styles.selectedDateSection}>
            <Text style={styles.selectedDateTitle}>
              Lịch làm việc ngày {formatVietnameseDate(selectedDate)}{" "}
              ({selectedSchedules.length})
            </Text>
            {selectedSchedules.length === 0 ? (
              <View style={styles.emptySchedule}>
                <Text style={styles.emptyScheduleText}>
                  Không có lịch làm việc trong ngày này
                </Text>
              </View>
            ) : (
              <View style={styles.schedulesList}>
                {selectedSchedules.map((schedule) =>
                  renderScheduleItem(schedule)
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Add Medical Note Modal */}
      <Modal
        visible={Boolean(showAddNoteModal)}
        transparent={true}
        animationType="fade"
        onRequestClose={resetMedicalNoteForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm ghi chú </Text>
              <TouchableOpacity onPress={resetMedicalNoteForm}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>
                  Nội dung ghi chú
                </Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ghi chú:</Text>
                    <TextInput
                      style={styles.feedbackInput}
                      multiline
                      numberOfLines={4}
                      value={newNote.note}
                      onChangeText={(text) =>
                        setNewNote({ ...newNote, note: text })
                      }
                      placeholder="Nhập nội dung ghi chú..."
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Lời khuyên:
                    </Text>
                    <TextInput
                      style={styles.feedbackInput}
                      multiline
                      numberOfLines={3}
                      value={newNote.advice}
                      onChangeText={(text) =>
                        setNewNote({ ...newNote, advice: text })
                      }
                      placeholder="Nhập lời khuyên (tuỳ chọn)"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: "#CCC", marginRight: 10 },
                ]}
                onPress={resetMedicalNoteForm}>
                <Text style={styles.closeButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: "#4CAF50" },
                ]}
                onPress={handleAddMedicalNote}>
                <Text style={styles.closeButtonText}>
                  Thêm ghi chú
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Medical Notes Modal */}
      <Modal
        visible={showMedicalNotesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeMedicalNotesModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Ghi chú y tế -{" "}
                {scheduleDetails.careProfile?.profileName ||
                  "Khách hàng"}
              </Text>
              <TouchableOpacity onPress={closeMedicalNotesModal}>
                <Ionicons name="close" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={true}
              bounces={true}
              contentContainerStyle={styles.scrollContentContainer}>
              {isLoadingMedicalNotes ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>
                    Đang tải ghi chú y tế...
                  </Text>
                </View>
              ) : medicalNotes.length > 0 ? (
                <View style={styles.medicalNotesList}>
                  {medicalNotes.map((note, index) => (
                    <View
                      key={note.medicalNoteID || index}
                      style={styles.medicalNoteItem}>
                      <View style={styles.medicalNoteHeader}>
                        <Text style={styles.medicalNoteTitle}>
                          Ghi chú #{note.medicalNoteID}
                        </Text>
                        <Text style={styles.medicalNoteDate}>
                          {new Date(
                            note.createdAt
                          ).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          {new Date(
                            note.createdAt
                          ).toLocaleDateString("vi-VN")}
                        </Text>
                      </View>

                      <View style={styles.medicalNoteContent}>
                        <View style={styles.medicalNoteField}>
                          <Text style={styles.medicalNoteFieldLabel}>
                            Chuyên viên:
                          </Text>
                          <Text style={styles.medicalNoteFieldValue}>
                            {note.nursingName ||
                              `Chuyên viên #${note.nursingID}`}
                          </Text>
                        </View>

                        <View style={styles.medicalNoteField}>
                          <Text style={styles.medicalNoteFieldLabel}>
                            Họ và tên:
                          </Text>
                          <Text style={styles.medicalNoteFieldValue}>
                            {note.relativeName ||
                              (note.relativeID
                                ? `Người nhận #${note.relativeID}`
                                : scheduleDetails.careProfile
                                    ?.profileName || "Mẹ")}
                          </Text>
                        </View>

                        <View style={styles.medicalNoteField}>
                          <Text style={styles.medicalNoteFieldLabel}>
                            Dịch vụ:
                          </Text>
                          <Text style={styles.medicalNoteFieldValue}>
                            {note.serviceName ||
                              `Dịch vụ #${note.customizeTaskID}`}
                          </Text>
                        </View>

                        <View style={styles.medicalNoteField}>
                          <Text style={styles.medicalNoteFieldLabel}>
                            Ghi chú:
                          </Text>
                          <View style={styles.noteContentContainer}>
                            <Text style={styles.medicalNoteText}>
                              {note.note}
                            </Text>
                          </View>
                        </View>

                        {note.advice && (
                          <View style={styles.medicalNoteField}>
                            <Text
                              style={styles.medicalNoteFieldLabel}>
                              Lời khuyên:
                            </Text>
                            <Text
                              style={styles.medicalNoteAdviceText}>
                              {note.advice}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Chưa có ghi chú y tế nào cho dịch vụ này
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeMedicalNotesModal}>
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
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
  calendarContainer: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  calendar: {
    borderRadius: 15,
    paddingBottom: 10,
  },
  todaySection: {
    marginBottom: 20,
  },
  todaySectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  todaySchedulesList: {
    marginBottom: 10,
  },
  selectedDateSection: {
    marginBottom: 20,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  schedulesList: {
    marginBottom: 10,
  },
  scheduleItem: {
    marginBottom: 12,
  },
  todayScheduleItem: {
    shadowColor: "#4FC3F7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
    alignItems: "center",
    marginBottom: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: "flex-end",
    marginLeft: "auto",
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  scheduleDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  emptySchedule: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  emptyScheduleText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  viewNotesButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  viewNotesButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#2196F3",
  },
  medicalNotesList: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  medicalNoteItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  medicalNoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F5E8",
  },
  medicalNoteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  medicalNoteDate: {
    fontSize: 12,
    color: "#666",
  },
  medicalNoteContent: {
    marginBottom: 10,
  },
  medicalNoteField: {
    marginBottom: 14,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 10,
  },
  medicalNoteFieldLabel: {
    fontSize: 12,
    color: "#6C757D",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  medicalNoteFieldValue: {
    fontSize: 15,
    color: "#2C3E50",
    fontWeight: "700",
  },
  noteContentContainer: {
    marginTop: 8,
  },
  medicalNoteText: {
    fontSize: 16,
    color: "#2196F3",
    lineHeight: 22,
    fontWeight: "600",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  medicalNoteAdviceText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  highlightedCard: {
    backgroundColor: "#e3f2fd",
    borderWidth: 2,
    borderColor: "#4FC3F7",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 0,
    width: 80,
    marginRight: 10,
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
    flexDirection: "row",
    justifyContent: "space-around",
  },
  closeButton: {
    backgroundColor: "#4FC3F7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    width: "45%",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  attendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  attendanceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#2196F3",
    minHeight: 44,
  },
  attendanceButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
  },
  attendanceNote: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  modalActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginTop: 10,
  },
  modalActionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  addNoteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  addNoteButtonText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "600",
    color: "#4CAF50",
  },
  attendanceRequiredText: {
    fontSize: 12,
    color: "#FF9800",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  medicalNoteItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicalNoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  medicalNoteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  medicalNoteDate: {
    fontSize: 12,
    color: "#666",
  },
  noteContent: {
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  noteText: {
    fontSize: 14,
    color: "#333",
    fontStyle: "italic",
  },
  noMedicalNotesContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  noMedicalNotesText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  existingNotesInfo: {
    backgroundColor: "#e8f5e8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  existingNotesText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
    textAlign: "center",
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
    flex: 1,
  },
  noteFooter: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  noteFooterText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
});
