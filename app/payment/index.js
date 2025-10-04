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
import AuthService from "../../services/authService";
import BookingService from "../../services/bookingService";
import CareProfileService from "../../services/careProfileService";
import CustomizeTaskService from "../../services/customizeTaskService";
import InvoiceService from "../../services/invoiceService";
import NotificationService from "../../services/notificationService";
import NursingSpecialistService from "../../services/nursingSpecialistService";
import RelativeService from "../../services/relativeService";
import ServiceTypeService from "../../services/serviceTypeService";
import TransactionHistoryService from "../../services/transactionHistoryService";
import WalletService from "../../services/walletService";
import WishlistService from "../../services/wishlistService";
import ZoneDetailService from "../../services/zoneDetailService";

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
  const [services, setServices] = useState([]); // Thêm state cho services
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Staff selection states
  const [selectionMode, setSelectionMode] = useState(null); // 'user' | 'system'
  const [nurses, setNurses] = useState([]);
  const [nurseServiceLinks, setNurseServiceLinks] = useState([]); // { nursingID, serviceID }
  const [showNursePicker, setShowNursePicker] = useState(false);
  const [pickerSlotIndex, setPickerSlotIndex] = useState(null);
  const [selectedNurseIds, setSelectedNurseIds] = useState([]);
  const [requiredNurseCount, setRequiredNurseCount] = useState(1);
  const [freeNurses, setFreeNurses] = useState([]);
  const [conflictBlacklist, setConflictBlacklist] = useState([]); // nursingIDs to hide due to conflict
  const [nurseSelections, setNurseSelections] = useState({}); // slotIndex -> nursingID
  const [showRelativePicker, setShowRelativePicker] = useState(false);
  const [relativePickerTask, setRelativePickerTask] = useState(null);

  // Relative selection states
  const [relatives, setRelatives] = useState([]); // relatives of care profile
  const [relativeSelections, setRelativeSelections] = useState({}); // customizeTaskID -> relativeID

  // Wishlist states
  const [wishlistMap, setWishlistMap] = useState({}); // nursingID -> {isFavorite: boolean, wishlistID: number}
  const [customerID, setCustomerID] = useState(null);

  // Map each slot to a specific serviceID (for service bookings)
  const slotServiceIds = React.useMemo(() => {
    if (!extraData) {
      return Array(requiredNurseCount).fill(null);
    }

    if (extraData?.serviceType !== "package") {
      // For service bookings, use the original logic
      const ids = [];
      (extraData?.services || []).forEach((s) => {
        const q = s.quantity || 1;
        for (let i = 0; i < q; i++) ids.push(s.serviceID);
      });
      return ids;
    }

    // For package bookings, get service IDs from packageTasks
    if (packageTasks.length > 0) {
      return packageTasks.map((task) => task.child_ServiceID);
    }

    // Fallback to nurseServiceLinks if available
    if (nurseServiceLinks.length > 0) {
      return nurseServiceLinks.map((link) => link.serviceID);
    }

    return Array(requiredNurseCount).fill(null);
  }, [
    extraData,
    requiredNurseCount,
    nurseServiceLinks,
    packageTasks,
  ]);

  // Determine if all customize tasks have a chosen relative
  const allRelativesChosen = React.useMemo(() => {
    if (!customizeTasks || customizeTasks.length === 0) return false;
    return customizeTasks.every((t) => {
      const selected = relativeSelections[t.customizeTaskID];
      const existing = t.relativeID;
      return !!(selected || existing);
    });
  }, [customizeTasks, relativeSelections]);

  const isPayActionEnabled = () => {
    if (isProcessingPayment) return false;
    // Relatives are optional; backend will handle default assignment
    if (selectionMode === "system") return true;
    if (selectionMode === "user") {
      return selectedNurseIds.length >= requiredNurseCount;
    }
    return false; // must choose a mode first
  };

  // Helper: load all required data on screen focus/initial mount
  const loadUserData = async () => {
    try {
      // Load booking, care profile and invoice (loadBookingData handles those and storage fallbacks)
      await loadBookingData();
      // Preload nurses and compatibility links to support manual selection
      await loadNurses();
      await loadNurseServiceLinks();

      // Load customer ID for wishlist
      const userResult = await AuthService.getUser();
      if (userResult.success && userResult.data) {
        setCustomerID(userResult.data.accountID);
        console.log(
          "🔍 Loaded customer ID:",
          userResult.data.accountID
        );
      } else {
        console.error("Error loading user data:", userResult.error);
        // Fallback to default customer ID for testing
        setCustomerID(2);
      }
    } catch (error) {
      console.error("PaymentScreen: loadUserData error:", error);
      // Fallback to default customer ID for testing
      setCustomerID(2);
    }
  };

  const loadWishlistData = async () => {
    if (!customerID) {
      console.log(
        "🔍 Customer ID not available yet, skipping wishlist load"
      );
      return;
    }

    try {
      console.log("🔍 Loading wishlist for customer ID:", customerID);
      const result = await WishlistService.getWishlistByCustomer(
        customerID
      );
      console.log("🔍 Wishlist result:", result);

      if (result.success && result.data) {
        const wishlistData = result.data;
        const wishlistMapData = {};

        wishlistData.forEach((item) => {
          wishlistMapData[item.nursingID] = {
            isFavorite: true,
            wishlistID: item.wishlistID,
          };
        });

        setWishlistMap(wishlistMapData);
        console.log("🔍 Wishlist map updated:", wishlistMapData);
      } else {
        console.error("🔍 Error loading wishlist:", result.error);
      }
    } catch (error) {
      console.error("Error loading wishlist:", error);
    }
  };

  // Check if two time slots conflict (overlap)
  const doTimeSlotsConflict = (start1, end1, start2, end2) => {
    const time1Start = new Date(`2000-01-01T${start1}`);
    const time1End = new Date(`2000-01-01T${end1}`);
    const time2Start = new Date(`2000-01-01T${start2}`);
    const time2End = new Date(`2000-01-01T${end2}`);

    return time1Start < time2End && time2Start < time1End;
  };

  // Get conflicting nurse IDs for a specific slot
  const getConflictingNurseIds = (slotIndex) => {
    const conflictingIds = [];
    const currentSlotTime = customizeTasks[slotIndex];

    if (!currentSlotTime) return conflictingIds;

    // Check all other slots for time conflicts
    customizeTasks.forEach((task, otherSlotIndex) => {
      if (otherSlotIndex === slotIndex) return; // Skip current slot

      const otherSlotTime = task;
      if (!otherSlotTime) return;

      // Check if times overlap
      if (
        doTimeSlotsConflict(
          currentSlotTime.startTime,
          currentSlotTime.endTime,
          otherSlotTime.startTime,
          otherSlotTime.endTime
        )
      ) {
        // If this other slot has a selected nurse, add to conflicts
        const selectedNurseId = nurseSelections[otherSlotIndex];
        if (selectedNurseId) {
          conflictingIds.push(selectedNurseId);
        }
      }
    });

    return conflictingIds;
  };

  useEffect(() => {
    if (bookingId) {
      loadInvoiceData(bookingId);
      loadPackageTasks(bookingId);
      loadServices();
    }
  }, [bookingId]);

  useEffect(() => {
    loadUserData();
    checkUnreadNotifications();
    loadWishlistData();
  }, []);

  useEffect(() => {
    if (customerID) {
      loadWishlistData();
    }
  }, [customerID]);

  const checkUnreadNotifications = async () => {
    try {
      if (careProfileData?.accountID) {
        const result =
          await NotificationService.getNotificationsByAccount(
            careProfileData.accountID
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

  // Update requiredNurseCount when extraData changes
  useEffect(() => {
    if (extraData?.serviceType === "service" && extraData?.services) {
      const total = extraData.services.reduce(
        (sum, s) => sum + (s.quantity || 1),
        0
      );
      setRequiredNurseCount(Math.max(1, total));
    } else {
      // For package or unknown types, keep default value
      // This will be updated by loadNurseServiceLinks
    }
  }, [extraData]);

  const loadNurses = async () => {
    try {
      const result =
        await NursingSpecialistService.getAllNursingSpecialists();
      if (result.success) {
        setNurses(result.data || []);
      } else {
        setNurses([]);
      }
    } catch (error) {
      console.error("PaymentScreen: Error loading nurses:", error);
      setNurses([]);
    }
  };

  const loadNurseServiceLinks = async () => {
    try {
      // Load customize tasks for this booking to determine required nurse count
      const customizeTasksUrl = `${API_CONFIG.BASE_URL}/api/CustomizeTask/GetAllByBooking/${bookingId}`;
      const customizeTasksResponse = await fetch(customizeTasksUrl, {
        headers: { accept: "*/*" },
      });

      if (customizeTasksResponse.ok) {
        const customizeTasks = await customizeTasksResponse.json();
        console.log("Customize tasks loaded:", customizeTasks);

        // keep tasks for relative selection UI
        setCustomizeTasks(customizeTasks || []);
        // Pre-fill relative selections
        const pre = {};
        (customizeTasks || []).forEach((t) => {
          if (t.relativeID) pre[t.customizeTaskID] = t.relativeID;
        });
        if (Object.keys(pre).length > 0) {
          setRelativeSelections((prev) => ({ ...pre, ...prev }));
        }

        // Update required nurse count based on actual tasks
        const actualRequiredCount = customizeTasks.length;
        setRequiredNurseCount(actualRequiredCount);

        // Load nurse-service compatibility for each service
        const nurseServicePromises = customizeTasks.map(
          async (task) => {
            const serviceId = task.serviceID;
            const nurseServiceUrl = `${API_CONFIG.BASE_URL}/api/nursingspecialist-servicetype/getbyservice/${serviceId}`;
            const response = await fetch(nurseServiceUrl, {
              headers: { accept: "text/plain" },
            });

            if (response.ok) {
              const nurseServiceData = await response.json();
              return {
                serviceID: serviceId,
                taskOrder: task.taskOrder,
                nurses: nurseServiceData,
              };
            }
            return {
              serviceID: serviceId,
              taskOrder: task.taskOrder,
              nurses: [],
            };
          }
        );

        const nurseServiceResults = await Promise.all(
          nurseServicePromises
        );
        setNurseServiceLinks(nurseServiceResults);

        console.log(
          "Nurse service links loaded:",
          nurseServiceResults
        );
      } else {
        console.log("Failed to load customize tasks");
        setNurseServiceLinks([]);
        // Fallback: synthesize tasks from extraData if available
        if (
          extraData?.serviceType === "service" &&
          extraData?.services?.length
        ) {
          const synthesized = [];
          extraData.services.forEach((s) => {
            const q = s.quantity || 1;
            for (let i = 0; i < q; i++) {
              synthesized.push({
                customizeTaskID: -(synthesized.length + 1), // temp negative id
                serviceID: s.serviceID,
                taskOrder: i + 1,
                startTime: extraData.workdate,
                endTime: extraData.workdate,
                relativeID: null,
              });
            }
          });
          setCustomizeTasks(synthesized);
          setRequiredNurseCount(synthesized.length);
        }
      }
    } catch (error) {
      console.error("Error loading nurse service links:", error);
      setNurseServiceLinks([]);
      // Fallback: synthesize tasks from extraData
      if (
        extraData?.serviceType === "service" &&
        extraData?.services?.length
      ) {
        const synthesized = [];
        extraData.services.forEach((s) => {
          const q = s.quantity || 1;
          for (let i = 0; i < q; i++) {
            synthesized.push({
              customizeTaskID: -(synthesized.length + 1),
              serviceID: s.serviceID,
              taskOrder: i + 1,
              startTime: extraData.workdate,
              endTime: extraData.workdate,
              relativeID: null,
            });
          }
        });
        setCustomizeTasks(synthesized);
        setRequiredNurseCount(synthesized.length);
      }
    }
  };

  // Debug state changes
  useEffect(() => {
    // Removed debug logging for production
  }, [isLoading, bookingData, extraData]);

  // Build map for quick name lookup
  const relativeNameById = React.useMemo(() => {
    const map = {};
    (relatives || []).forEach((r) => {
      map[r.relativeID] =
        r.relativeName || r.name || `Người #${r.relativeID}`;
    });
    return map;
  }, [relatives]);

  // Load customize tasks for booking to drive relative selection
  const [customizeTasks, setCustomizeTasks] = useState([]);
  useEffect(() => {
    const loadTasks = async () => {
      if (!bookingId) return;
      try {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}/api/CustomizeTask/GetAllByBooking/${bookingId}`,
          { headers: { accept: "*/*" } }
        );
        if (res.ok) {
          const data = await res.json();
          setCustomizeTasks(data || []);
          // Pre-fill selections from server relativeID if present
          const pre = {};
          (data || []).forEach((t) => {
            if (t.relativeID) pre[t.customizeTaskID] = t.relativeID;
          });
          setRelativeSelections((prev) => ({ ...pre, ...prev }));
        } else {
          setCustomizeTasks([]);
        }
      } catch (e) {
        setCustomizeTasks([]);
      }
    };
    loadTasks();
  }, [bookingId]);

  const assignRelative = async (taskId, relativeID) => {
    const result = await CustomizeTaskService.updateRelative(
      taskId,
      relativeID
    );
    if (!result.success) {
      Alert.alert(
        "Lỗi",
        translateRelativeError(result.error, relativeID)
      );
      return false;
    }
    setRelativeSelections((prev) => ({
      ...prev,
      [taskId]: relativeID,
    }));
    return true;
  };

  const translateRelativeError = (message, relativeID) => {
    const name =
      relativeNameById[relativeID] || `Relative ${relativeID}`;
    let text = String(message || "");
    text = text.replace(/Relative\s+with\s+ID\s+\d+/i, name);
    text = text.replace(
      /selected\s+to\s+the\s+same\s+service\s+in\s+booking/i,
      "đã được gán cho dịch vụ này trong booking"
    );
    return (
      text || "Không thể chọn người nhận dịch vụ cho công việc này."
    );
  };

  const openNursePicker = async (slotIndex) => {
    setPickerSlotIndex(slotIndex);
    try {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/nursingspecialists/GetAllFree/${bookingId}`,
        { headers: { accept: "*/*" } }
      );
      let list = [];
      if (res.ok) {
        const data = await res.json();
        list = Array.isArray(data) ? data : [];
      }

      // Filter by service compatibility for this slot (if known)
      const requiredServiceId = slotServiceIds[slotIndex] || null;
      if (requiredServiceId) {
        const link = (nurseServiceLinks || []).find(
          (l) => l.serviceID === requiredServiceId
        );
        if (
          link &&
          Array.isArray(link.nurses) &&
          link.nurses.length > 0
        ) {
          const compatibleIds = link.nurses
            .map((n) => n.nursingID)
            .filter((id) => id != null);
          list = list.filter((n) =>
            compatibleIds.includes(n.nursingID)
          );
        } else {
          // If no compatibility data, show none to avoid listing wrong nurses
          list = [];
        }
      }

      // Remove nurses known to conflict (from previous attempts)
      if (conflictBlacklist.length > 0) {
        list = list.filter(
          (n) => !conflictBlacklist.includes(n.nursingID)
        );
      }

      // NEW: Remove nurses who are already selected for conflicting time slots
      const conflictingNurseIds = getConflictingNurseIds(slotIndex);
      console.log(
        "🔍 Conflicting nurse IDs for slot",
        slotIndex,
        ":",
        conflictingNurseIds
      );
      list = list.filter(
        (n) => !conflictingNurseIds.includes(n.nursingID)
      );

      setFreeNurses(list);
    } catch (e) {
      setFreeNurses([]);
    }
    setShowNursePicker(true);
  };

  const chooseNurseForSlot = (nurseId) => {
    // Validate against current free list
    const isFree = (freeNurses || []).some(
      (n) => n.nursingID === nurseId
    );
    if (!isFree) {
      Alert.alert(
        "Lỗi",
        "Chỉ được chọn chuyên viên có trong danh sách trống hiện tại."
      );
      return;
    }

    // Prevent overlapping assignments for the same nurse within this booking
    const thisTask = customizeTasks[pickerSlotIndex];
    const parseDate = (s) => new Date(s).getTime();
    const isOverlap = (aStart, aEnd, bStart, bEnd) => {
      if (!aStart || !aEnd || !bStart || !bEnd) return false;
      const as = parseDate(aStart);
      const ae = parseDate(aEnd);
      const bs = parseDate(bStart);
      const be = parseDate(bEnd);
      return as < be && bs < ae; // intervals intersect
    };
    if (thisTask) {
      for (let i = 0; i < selectedNurseIds.length; i++) {
        if (i === pickerSlotIndex) continue;
        if (selectedNurseIds[i] === nurseId) {
          const otherTask = customizeTasks[i];
          if (
            otherTask &&
            isOverlap(
              thisTask.startTime,
              thisTask.endTime,
              otherTask.startTime,
              otherTask.endTime
            )
          ) {
            Alert.alert(
              "Trùng chuyên viên",
              "Khung giờ này chuyên viên đã được chọn cho một dịch vụ khác trùng thời gian. Bạn hãy chọn lại nhé."
            );
            return;
          }
        }
      }
    }

    setSelectedNurseIds((prev) => {
      const next = [...prev];
      next[pickerSlotIndex] = nurseId;
      return next.slice(0, requiredNurseCount);
    });

    // Update nurse selections tracking
    setNurseSelections((prev) => ({
      ...prev,
      [pickerSlotIndex]: nurseId,
    }));

    setShowNursePicker(false);
    setPickerSlotIndex(null);
  };

  // Determine if changing relative is allowed for a given task
  const canChangeRelativeForTask = (task) => {
    try {
      if (!task) return false;
      // Disallow if booking is cancelled or completed
      const status = (bookingData?.status || "").toLowerCase();
      if (status === "cancelled" || "completed") return false;

      // Time-based restriction: allow only before startTime and not within 30 minutes window
      const now = new Date();
      const start = task.startTime ? new Date(task.startTime) : null;
      if (!start || Number.isNaN(start.getTime())) return true; // if no start time, allow

      // Do not allow after start (sử dụng giờ local)
      if (now >= start) return false;

      // Do not allow within 30 minutes before start (sử dụng giờ local)
      const THIRTY_MIN_MS = 30 * 60 * 1000;
      if (start.getTime() - now.getTime() <= THIRTY_MIN_MS)
        return false;

      return true;
    } catch (_) {
      return false;
    }
  };

  const openRelativePicker = (task) => {
    // Guard by status/time window
    if (!canChangeRelativeForTask(task)) {
      Alert.alert(
        "Không thể đổi con cho dịch vụ",
        "Bạn chỉ có thể đổi con cho dịch vụ trước giờ bắt đầu và cách ít nhất 30 phút."
      );
      return;
    }
    setRelativePickerTask(task);
    setShowRelativePicker(true);
  };

  const chooseRelative = async (relativeID) => {
    if (!relativePickerTask) return;
    // Guard again right before commit
    if (!canChangeRelativeForTask(relativePickerTask)) {
      Alert.alert(
        "Không thể đổi con cho dịch vụ",
        "Đã quá thời gian cho phép để đổi con cho dịch vụ."
      );
      setShowRelativePicker(false);
      setRelativePickerTask(null);
      return;
    }
    await assignRelative(
      relativePickerTask.customizeTaskID,
      relativeID
    );
    setShowRelativePicker(false);
    setRelativePickerTask(null);
  };

  // Handle nurse selection change - clear previous selection and update tracking
  const handleNurseSelectionChange = (slotIndex, newNurseId) => {
    // Clear previous selection for this slot
    setSelectedNurseIds((prev) => {
      const next = [...prev];
      next[slotIndex] = newNurseId;
      return next;
    });

    // Update nurse selections tracking
    setNurseSelections((prev) => ({
      ...prev,
      [slotIndex]: newNurseId,
    }));

    console.log(
      "🔍 Nurse selection updated for slot",
      slotIndex,
      ":",
      newNurseId
    );
  };

  const loadBookingData = async () => {
    try {
      setIsLoading(true);

      // 1. Gọi API để lấy booking data
      const result = await BookingService.getBookingById(bookingId);

      if (result.success) {
        setBookingData(result.data);

        // 2. Load care profile data từ API
        if (result.data.careProfileID) {
          await loadCareProfileData(result.data.careProfileID);
        }

        // 3. Load invoice data
        await loadInvoiceData(bookingId);

        // 4. Load extra data từ AsyncStorage để bổ sung thông tin
        try {
          const storedData = await AsyncStorage.getItem(
            `booking_${bookingId}`
          );
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setExtraData(parsedData);

            // Nếu là package, load package tasks
            if (
              parsedData.serviceType === "package" &&
              parsedData.packageData?.serviceID
            ) {
              await loadPackageTasks(
                parsedData.packageData.serviceID
              );
              // Load services để có tên service chính xác
              await loadServices();
            }

            // Load services để hiển thị thông tin
            if (parsedData.serviceType === "service") {
              await loadServices();
            }
          }
        } catch (error) {
          console.error(
            "Error loading extra data from storage:",
            error
          );
        }
      } else {
        // Nếu API fail, thử dùng AsyncStorage
        await loadFromAsyncStorage();
      }
    } catch (error) {
      console.error("Error loading booking data:", error);
      // Nếu có lỗi, thử dùng AsyncStorage
      await loadFromAsyncStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromAsyncStorage = async () => {
    try {
      const storedData = await AsyncStorage.getItem(
        `booking_${bookingId}`
      );
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setExtraData(parsedData);

        // Load services nếu là service booking
        if (parsedData.serviceType === "service") {
          await loadServices();
        }

        // Tạo mock booking data từ extra data
        const mockBookingData = {
          bookingID: parsedData.bookingID,
          careProfileID: parsedData.memberData?.careProfileID,
          createdAt:
            parsedData.createdAt ||
            new Date().toLocaleString("sv-SE"), // Sử dụng format ISO local
          status: "pending",
          amount: parsedData.totalAmount || 0,
          workdate:
            parsedData.workdate || new Date().toLocaleString("sv-SE"), // Sử dụng format ISO local
        };
        setBookingData(mockBookingData);

        // Load care profile data từ stored data
        if (parsedData.memberData) {
          setCareProfileData(parsedData.memberData);
        }

        // Nếu là package, load package tasks
        if (
          parsedData.serviceType === "package" &&
          parsedData.packageData?.serviceID
        ) {
          await loadPackageTasks(parsedData.packageData.serviceID);
        }
      } else {
        Alert.alert("Thông báo", "Không tìm thấy thông tin booking");
        router.back();
      }
    } catch (error) {
      console.error("Error loading from AsyncStorage:", error);
      Alert.alert(
        "Thông báo",
        "Có lỗi xảy ra khi tải thông tin booking"
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadCareProfileData = async (careProfileID) => {
    try {
      const result = await CareProfileService.getCareProfileById(
        careProfileID
      );

      if (result.success) {
        setCareProfileData(result.data);
        // Load relatives by careProfile
        try {
          const relRes =
            await RelativeService.getRelativesByCareProfileId(
              result.data.careProfileID
            );
          if (relRes.success) setRelatives(relRes.data || []);
        } catch (_) {}
      } else {
        setCareProfileData(null);
      }
    } catch (error) {
      console.error("Error loading care profile data:", error);
      setCareProfileData(null);
    }
  };

  const loadInvoiceData = async (bookingID) => {
    try {
      const result = await InvoiceService.getInvoiceByBookingId(
        bookingID
      );

      if (result.success) {
        setInvoiceData(result.data);
      } else {
        setInvoiceData(null);
      }
    } catch (error) {
      console.error("Error loading invoice data:", error);
      setInvoiceData(null);
    }
  };

  const loadPackageTasks = async (packageId) => {
    try {
      // Load customize tasks trực tiếp từ booking
      try {
        const customizeTasksUrl = `${API_CONFIG.BASE_URL}/api/CustomizeTask/GetAllByBooking/${bookingId}`;
        const customizeResponse = await fetch(customizeTasksUrl, {
          headers: { accept: "*/*" },
        });

        if (customizeResponse.ok) {
          const customizeTasks = await customizeResponse.json();

          if (customizeTasks && customizeTasks.length > 0) {
            // Load service details cho từng customize task
            const serviceDetailsPromises = customizeTasks.map(
              async (task) => {
                try {
                  const serviceUrl = `${API_CONFIG.BASE_URL}/api/servicetypes/get/${task.serviceID}`;
                  const serviceResponse = await fetch(serviceUrl, {
                    headers: { accept: "*/*" },
                  });

                  if (serviceResponse.ok) {
                    const serviceData = await serviceResponse.json();
                    return {
                      serviceTaskID: task.serviceTaskID,
                      child_ServiceID: task.serviceID,
                      description: serviceData.serviceName,
                      price: serviceData.price,
                      quantity: 1,
                      taskOrder: task.taskOrder,
                      status: task.status,
                    };
                  } else {
                    // Fallback nếu không load được service details
                    return {
                      serviceTaskID: task.serviceTaskID,
                      child_ServiceID: task.serviceID,
                      description: `Dịch vụ ${task.serviceID}`,
                      price: 0,
                      quantity: 1,
                      taskOrder: task.taskOrder,
                      status: task.status,
                    };
                  }
                } catch (error) {
                  console.error(
                    "PaymentScreen: Error loading service details for serviceID:",
                    task.serviceID,
                    error
                  );
                  return {
                    serviceTaskID: task.serviceTaskID,
                    child_ServiceID: task.serviceID,
                    description: `Dịch vụ ${task.serviceID}`,
                    price: 0,
                    quantity: 1,
                    taskOrder: task.taskOrder,
                    status: task.status,
                  };
                }
              }
            );

            const serviceDetails = await Promise.all(
              serviceDetailsPromises
            );
            setPackageTasks(serviceDetails);
          } else {
            setPackageTasks([]);
          }
        } else {
          setPackageTasks([]);
        }
      } catch (customizeError) {
        console.error(
          "PaymentScreen: Error loading customize tasks:",
          customizeError
        );
        setPackageTasks([]);
      }
    } catch (error) {
      console.error("Error loading package tasks:", error);
      setPackageTasks([]);
    }
  };

  const loadServices = async () => {
    try {
      const result = await ServiceTypeService.getAllServiceTypes();
      if (result.success) {
        // Load all service types (including packages) for proper display, but filter out removed/inactive
        const filteredServices = (result.data || []).filter(
          (service) =>
            service.status !== "Remove" &&
            service.status !== "inactive"
        );
        setServices(filteredServices);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]); // Ensure services is always an array
    }
  };

  // Dịch thông báo lỗi UpdateNursing sang tiếng Việt và thay ID bằng tên
  const translateUpdateNursingError = (message) => {
    if (!message) return "";
    let text = String(message);
    // Map ID -> tên từ danh sách nurses nếu có
    const idToName = (nurses || []).reduce((acc, n) => {
      acc[n.nursingID] =
        n.fullName || n.nursingFullName || `ID ${n.nursingID}`;
      return acc;
    }, {});

    // Thay thế "Nursing with ID X" bằng tên
    text = text.replace(/Nursing\s+with\s+ID\s+(\d+)/i, (_, id) => {
      const name = idToName[parseInt(id, 10)] || `ID ${id}`;
      return `Chuyên viên ${name}`;
    });

    // Cụm từ phổ biến
    text = text.replace(/conflict\s+schedule/gi, "bị trùng lịch");
    text = text.replace(/not\s+found/gi, "không tồn tại");
    text = text.replace(/unauthorized/gi, "không có quyền");
    text = text.replace(/nursing/gi, "chuyên viên");

    return text;
  };

  const formatTimeForNotification = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateOnlyForNotification = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const notifyAssignedNurses = async () => {
    try {
      console.log("🔔 Starting to notify assigned nurses...");

      // Lấy danh sách customize tasks để tìm nurses đã được assign
      const tasksResult =
        await CustomizeTaskService.getCustomizeTasksByBookingId(
          bookingId
        );

      if (!tasksResult.success || !tasksResult.data) {
        console.log("🔔 No customize tasks found for notification");
        return;
      }

      const tasks = tasksResult.data;
      const assignedNurses = new Map(); // nursingID -> task info

      // Lọc ra các nurses đã được assign và lưu thông tin task
      for (const task of tasks) {
        if (task.nursingID) {
          assignedNurses.set(task.nursingID, task);
        }
      }

      console.log(
        "🔔 Found assigned nurses:",
        Array.from(assignedNurses.keys())
      );

      if (assignedNurses.size === 0) {
        console.log(
          "🔔 No nurses assigned yet, skipping notifications"
        );
        return;
      }

      // Lấy thông tin khách hàng
      const customerName =
        careProfileData?.fullName ||
        careProfileData?.profileName ||
        "Khách hàng";

      // Tạo thông báo cho từng nurse
      const notificationPromises = Array.from(
        assignedNurses.entries()
      ).map(async ([nursingID, task]) => {
        try {
          // Format thời gian theo yêu cầu
          const startTime = formatTimeForNotification(task.startTime);
          const endTime = formatTimeForNotification(task.endTime);
          const date = formatDateOnlyForNotification(task.startTime);

          // Tạo message theo format yêu cầu
          const message = `Bạn có lịch mới! Booking #${bookingId} - Thời gian: ${startTime} đến ${endTime} vào ngày ${date}. Khách hàng: ${customerName}`;

          console.log(
            `🔔 Sending notification to nurse ${nursingID}:`,
            message
          );

          // Gửi thông báo
          const result = await NotificationService.createNotification(
            nursingID,
            message
          );

          if (result.success) {
            console.log(
              `✅ Notification sent successfully to nurse ${nursingID}`
            );
          } else {
            console.error(
              `❌ Failed to send notification to nurse ${nursingID}:`,
              result.error
            );
          }

          return result;
        } catch (error) {
          console.error(
            `❌ Error sending notification to nurse ${nursingID}:`,
            error
          );
          return { success: false, error: error.message };
        }
      });

      // Chờ tất cả notifications được gửi
      const results = await Promise.all(notificationPromises);

      // Đếm số thành công
      const successCount = results.filter((r) => r.success).length;
      const totalCount = results.length;

      console.log(
        `🔔 Notification summary: ${successCount}/${totalCount} sent successfully`
      );
    } catch (error) {
      console.error("❌ Error in notifyAssignedNurses:", error);
      // KHÔNG throw error để không ảnh hưởng đến flow thanh toán
    }
  };

  const handlePayment = async () => {
    // Enforce selection requirement
    if (!selectionMode) {
      Alert.alert(
        "Chưa chọn phương thức",
        "Vui lòng chọn 'Khách hàng chọn' hoặc 'Hệ thống chọn' trước."
      );
      return;
    }
    if (
      selectionMode === "user" &&
      selectedNurseIds.length < requiredNurseCount
    ) {
      Alert.alert(
        "Chưa đủ điều dưỡng",
        `Bạn phải chọn đủ ${requiredNurseCount} ${
          requiredNurseCount > 1 ? "điều dưỡng" : "điều dưỡng"
        } trước khi thanh toán.`
      );
      return;
    }

    try {
      // If system-selected mode, notify the zone manager to arrange staff
      if (selectionMode === "system") {
        try {
          // Try to infer zoneID from care profile -> zoneDetail -> zone
          let zoneID = null;
          try {
            // Load all zone details and find by care profile's zoneDetailID if present
            const zoneDetailsResult =
              await ZoneDetailService.getAllZoneDetails();
            if (zoneDetailsResult.success) {
              const zoneDetailId =
                careProfileData?.zoneDetailID ||
                careProfileData?.zoneDetailId;
              const zd = (zoneDetailsResult.data || []).find(
                (z) => z.zoneDetailID === zoneDetailId
              );
              if (zd) zoneID = zd.zoneID;
            }
          } catch (_) {}

          // Fallback: try get all zones and match by city/zone name heuristics if needed (no-op if not available)
          if (!zoneID) {
            try {
              const zonesResult =
                await ZoneDetailService.getAllZones();
              if (zonesResult.success) {
                // Heuristic is skipped here; keep null zone if we cannot infer
              }
            } catch (_) {}
          }

          // If we have zoneID, attempt to find manager via zones list
          if (zoneID) {
            try {
              const zonesResult =
                await ZoneDetailService.getAllZones();
              if (zonesResult.success) {
                const zone = (zonesResult.data || []).find(
                  (z) => z.zoneID === zoneID
                );
                const managerAccountID = zone?.managerID;
                if (managerAccountID) {
                  await NotificationService.createNotification({
                    accountID: managerAccountID,
                    message: "Bạn có yêu cầu điều phối nhân viên mới",
                  });
                }
              }
            } catch (_) {}
          }
        } catch (notifyErr) {
          // Silent fail: payment flow should continue
          console.warn(
            "PaymentScreen: Could not notify manager:",
            notifyErr
          );
        }
      }

      // If user selected nurses manually, assign them to customize tasks before payment
      if (selectionMode === "user") {
        const tasksResult =
          await CustomizeTaskService.getCustomizeTasksByBookingId(
            bookingId
          );
        if (tasksResult.success) {
          const tasks = tasksResult.data || [];
          if (tasks.length === 0) {
            // No tasks to assign
          }
          // Group tasks by serviceID and prefer unassigned first
          const tasksByService = tasks.reduce((acc, t) => {
            const key = t.serviceID || "unknown";
            acc[key] = acc[key] || [];
            acc[key].push(t);
            return acc;
          }, {});
          Object.keys(tasksByService).forEach((k) =>
            tasksByService[k].sort(
              (a, b) =>
                (a.nursingID ? 1 : 0) - (b.nursingID ? 1 : 0) ||
                (a.taskOrder || 0) - (b.taskOrder || 0)
            )
          );

          // Build list of unassigned tasks per service
          const unassignedByService = Object.fromEntries(
            Object.entries(tasksByService).map(([k, list]) => [
              k,
              list.filter((t) => !t.nursingID),
            ])
          );
          const totalUnassigned = Object.values(
            unassignedByService
          ).reduce((sum, arr) => sum + arr.length, 0);
          if (totalUnassigned === 0) {
            // All tasks already have nursing assigned. Skipping UpdateNursing calls.
          } else {
            const assignments = selectedNurseIds.slice(
              0,
              requiredNurseCount
            );
            const updatePromises = assignments.map((nurseId, idx) => {
              const targetServiceId = slotServiceIds[idx] || null;
              let task = null;
              if (
                targetServiceId &&
                unassignedByService[targetServiceId] &&
                unassignedByService[targetServiceId].length > 0
              ) {
                task = unassignedByService[targetServiceId].shift();
              } else {
                // Fallback: any unassigned task
                const anyServiceKey = Object.keys(
                  unassignedByService
                ).find((k) => unassignedByService[k].length > 0);
                task = anyServiceKey
                  ? unassignedByService[anyServiceKey].shift()
                  : null;
              }
              if (!task) return Promise.resolve({ success: true });
              return CustomizeTaskService.updateNursing(
                task.customizeTaskID,
                parseInt(nurseId)
              );
            });
            const results = await Promise.all(updatePromises);
            const failed = results.find((r) => !r.success);
            if (failed) {
              Alert.alert(
                "Lỗi",
                `Không thể lưu lựa chọn chuyên viên. ${
                  translateUpdateNursingError(failed.error) ||
                  "Vui lòng thử lại."
                }`
              );
              // Parse nursing ID from error to blacklist in next pickers
              const match = String(failed.error || "").match(
                /ID\s+(\d+)/i
              );
              if (match) {
                const conflictId = parseInt(match[1], 10);
                if (!Number.isNaN(conflictId)) {
                  setConflictBlacklist((prev) =>
                    prev.includes(conflictId)
                      ? prev
                      : [...prev, conflictId]
                  );
                }
              }
              return;
            }
          }
        } else {
          Alert.alert(
            "Lỗi",
            "Không thể tải danh sách công việc để gán điều dưỡng."
          );
          return;
        }
      }
    } catch (assignError) {
      console.error(
        "PaymentScreen: Error when assigning nurses:",
        assignError
      );
      Alert.alert("Thông báo", "Không thể lưu lựa chọn điều dưỡng.");
      return;
    }

    // 1. Lấy số dư ví - sử dụng careProfileID để lấy accountID
    try {
      setIsProcessingPayment(true);

      // Lấy accountID từ careProfileData
      const accountID = careProfileData?.accountID;

      if (!accountID) {
        Alert.alert(
          "Thông báo",
          "Không tìm thấy thông tin tài khoản"
        );
        setIsProcessingPayment(false);
        return;
      }

      const walletResult = await WalletService.getWalletByAccountId(
        accountID
      );

      const walletAmount = walletResult.success
        ? walletResult.data.amount
        : 0;
      const totalAmount = bookingData.amount;

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

      if (
        response.ok &&
        data.message &&
        data.message.includes("success")
      ) {
        // 4. THANH TOÁN THÀNH CÔNG - GỬI THÔNG BÁO CHO NURSES (SILENT)
        try {
          await notifyAssignedNurses();
        } catch (notificationError) {
          // SILENT CATCH - không hiển thị lỗi cho customer
          console.error(
            "❌ Silent error in notification process:",
            notificationError
          );
          // KHÔNG Alert.alert hoặc hiển thị bất kỳ thông báo lỗi nào cho user
        }

        // Reload invoice data để cập nhật trạng thái
        await loadInvoiceData(bookingId);

        // Thay thế message từ server nếu là "Invoice paid successfully."
        const displayMessage =
          data.message === "Invoice paid successfully."
            ? "Thanh toán hóa đơn thành công"
            : data.message;

        // Show success notification
        global.__notify?.({
          title: "Thanh toán thành công!",
          message:
            "Bạn đã đặt lịch thành công, điều dưỡng viên đã được thông báo.",
        });

        Alert.alert("Thành công", displayMessage, [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ]);
      } else {
        Alert.alert(
          "Thông báo",
          data.message || "Thanh toán thất bại"
        );
      }
    } catch (error) {
      console.error("PaymentScreen: handlePayment error:", error);
      Alert.alert("Thông báo", "Có lỗi xảy ra khi thanh toán");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const processPayment = async () => {
    try {
      setIsProcessingPayment(true);

      const result = await TransactionHistoryService.payInvoice(
        null,
        bookingId
      );

      if (result.success) {
        // Reload invoice data để cập nhật status
        loadInvoiceData(bookingId);
      } else {
        Alert.alert(
          "Thông báo",
          `Thanh toán thất bại: ${result.error}`
        );
      }
    } catch (error) {
      console.error("PaymentScreen: Error in processPayment:", error);
      Alert.alert("Thông báo", "Có lỗi xảy ra khi thanh toán");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      // Sử dụng toLocaleString để hiển thị theo múi giờ local
      return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour12: false,
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      // Sử dụng toLocaleDateString để hiển thị theo múi giờ local
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
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

  const formatTimeRange = (startString, endString) => {
    try {
      const s = new Date(startString);
      const e = new Date(endString);

      // Sử dụng toLocaleTimeString và toLocaleDateString để hiển thị theo múi giờ local
      const startTime = s.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const endTime = e.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const date = s.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      return `${startTime} - ${endTime} ${date}`;
    } catch (error) {
      return `${formatDateTime(startString)} - ${formatDateTime(
        endString
      )}`;
    }
  };

  const renderPackageDetails = () => {
    if (!extraData || extraData.serviceType !== "package")
      return null;

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
          onPress={async () => {
            const newExpandedState = !expandedPackage;
            setExpandedPackage(newExpandedState);

            // Nếu đang expand, load package tasks
            if (
              newExpandedState &&
              extraData?.packageData?.serviceID
            ) {
              await loadPackageTasks(extraData.packageData.serviceID);
            }
          }}>
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
            {(() => {
              // Sử dụng packageTasks trực tiếp vì nurseServiceLinks có thể trống
              if (packageTasks.length > 0) {
                return packageTasks.map((task, index) => {
                  // Tìm thông tin service từ child_ServiceID (service thực) thay vì serviceTaskID
                  const serviceInfo = services?.find(
                    (s) => s.serviceID === task.child_ServiceID
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
                          {serviceInfo?.serviceName ||
                            task.description ||
                            `Dịch vụ ${task.child_ServiceID}`}
                        </Text>
                      </View>
                      <View style={styles.taskFooter}>
                        <Text style={styles.taskPrice}>
                          {ServiceTypeService.formatPrice(task.price)}
                        </Text>
                        <Text style={styles.taskQuantity}>
                          Số lượng: {task.quantity}
                        </Text>
                      </View>
                    </View>
                  );
                });
              } else if (nurseServiceLinks.length > 0) {
                // Fallback to nurseServiceLinks if available
                return nurseServiceLinks
                  .filter((link) => link.serviceID)
                  .map((taskLink, index) => {
                    const serviceInfo = services?.find(
                      (s) => s.serviceID === taskLink.serviceID
                    );

                    return (
                      <View
                        key={`customize-task-${index}`}
                        style={styles.taskItem}>
                        <View style={styles.taskHeader}>
                          <Text style={styles.taskOrder}>
                            {taskLink.taskOrder || index + 1}.
                          </Text>
                          <Text style={styles.taskDescription}>
                            {serviceInfo?.serviceName ||
                              `Dịch vụ ${taskLink.serviceID}`}
                          </Text>
                        </View>

                        <View style={styles.taskFooter}>
                          <Text style={styles.taskPrice}>
                            {ServiceTypeService.formatPrice(
                              serviceInfo?.price || 0
                            )}
                          </Text>
                          <Text style={styles.taskQuantity}>
                            Số lượng: 1
                          </Text>
                        </View>
                      </View>
                    );
                  });
              } else {
                return (
                  <Text style={styles.noTasksText}>
                    Không có chi tiết dịch vụ
                  </Text>
                );
              }
            })()}
          </View>
        )}
      </View>
    );
  };

  const renderServiceDetails = () => {
    if (!extraData || extraData.serviceType !== "service")
      return null;

    return (
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Dịch vụ đã chọn</Text>
        {extraData.services &&
          extraData.services.map((service, index) => {
            const serviceData = services?.find(
              (s) => s.serviceID === service.serviceID
            );

            return (
              <View key={index} style={styles.serviceItem}>
                <Text style={styles.serviceName}>
                  {serviceData?.serviceName || `Dịch vụ ${index + 1}`}
                </Text>
                <View style={styles.serviceDetails}>
                  <Text style={styles.servicePrice}>
                    {ServiceTypeService.formatPrice(
                      serviceData?.price || 0
                    )}
                  </Text>
                  <Text style={styles.serviceQuantity}>
                    Số lượng: {service.quantity}
                  </Text>
                </View>
              </View>
            );
          })}
      </View>
    );
  };

  const renderRelativeSelector = () => {
    if (!customizeTasks || customizeTasks.length === 0) return null;
    return (
      <View style={styles.relativeCard}>
        <Text style={styles.relativeTitle}>
          Chọn người nhận dịch vụ
        </Text>
        {customizeTasks.map((task, idx) => {
          // Check if this service is for mom (forMom: true)
          const svc = services.find(
            (s) => s.serviceID === task.serviceID
          );
          const isForMom = svc?.forMom === true;

          return (
            <View
              key={task.customizeTaskID}
              style={styles.relativeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.relativeTaskLabel}>
                  {svc?.serviceName || `Dịch vụ ${task.serviceID}`}
                </Text>
                <Text style={styles.relativeTimeText}>
                  {formatTimeRange(task.startTime, task.endTime)}
                </Text>
                {isForMom && (
                  <Text style={styles.momServiceText}>
                    (Dịch vụ cho mẹ)
                  </Text>
                )}
              </View>
              {!isForMom && (
                <TouchableOpacity
                  style={styles.relativePicker}
                  onPress={() => {
                    if (!relatives || relatives.length === 0) {
                      Alert.alert(
                        "Lỗi",
                        "Chưa có người trong hồ sơ chăm sóc"
                      );
                      return;
                    }
                    openRelativePicker(task);
                  }}>
                  <Text style={styles.relativePickerText}>
                    {relativeSelections[task.customizeTaskID]
                      ? relativeNameById[
                          relativeSelections[task.customizeTaskID]
                        ] ||
                        `ID ${
                          relativeSelections[task.customizeTaskID]
                        }`
                      : "Chọn người"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderRelativeSummary = () => {
    if (!customizeTasks || customizeTasks.length === 0) return null;
    return (
      <View style={styles.relativeSummaryCard}>
        <Text style={styles.relativeTitle}>Người nhận dịch vụ</Text>
        {customizeTasks.map((task, idx) => {
          const rid =
            relativeSelections[task.customizeTaskID] ||
            task.relativeID;
          const name = rid
            ? relativeNameById[rid] || `ID ${rid}`
            : "Chưa chọn";
          const svc = services.find(
            (s) => s.serviceID === task.serviceID
          );
          return (
            <View
              key={`rel-summary-${task.customizeTaskID}`}
              style={styles.relativeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.relativeTaskLabel}>
                  Dịch vụ {task.taskOrder || idx + 1}:{" "}
                  {svc?.serviceName || `Dịch vụ ${task.serviceID}`}
                </Text>
                <Text style={styles.relativeSub}>
                  Thời gian: {formatDateTime(task.startTime)} -{" "}
                  {formatDateTime(task.endTime)}
                </Text>
              </View>
              <Text
                style={[
                  styles.relativePickerText,
                  { backgroundColor: "transparent", color: "#333" },
                ]}>
                {name}
              </Text>
            </View>
          );
        })}
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
              <Text style={styles.detailLabel}>Mã thanh toán:</Text>
              <Text style={styles.detailValue}>
                {(() => {
                  // Sử dụng extraData.bookingID nếu có, fallback về bookingData.bookingID
                  const bookingID =
                    extraData?.bookingID ||
                    bookingData?.bookingID ||
                    "N/A";
                  return `#${bookingID}`;
                })()}
              </Text>
            </View>

            {(() => {
              const profileData =
                extraData?.memberData || careProfileData;
              return profileData ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Hồ sơ chăm sóc:
                  </Text>
                  <Text style={styles.detailValue}>
                    {profileData.profileName}
                  </Text>
                </View>
              ) : null;
            })()}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Thời gian đặt:</Text>
              <Text style={styles.detailValue}>
                {(() => {
                  const workdate =
                    extraData?.workdate || bookingData?.workdate;
                  return formatDateTime(workdate);
                })()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày tạo:</Text>
              <Text style={styles.detailValue}>
                {(() => {
                  const createdAt =
                    extraData?.createdAt || bookingData?.createdAt;
                  return formatDateOnly(createdAt);
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Package/Service Details */}
        {renderPackageDetails()}
        {renderServiceDetails()}

        {/* Staff Selection Box */}
        <View style={styles.staffCard}>
          <Text style={styles.staffTitle}>
            Chọn điều dưỡng/ tư vấn viên
          </Text>
          <View style={styles.staffModeRow}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                selectionMode === "user" && styles.modeButtonActive,
              ]}
              onPress={() => {
                setSelectionMode("user");
                // Reset previous selections to avoid stale, non-free picks
                setSelectedNurseIds([]);
              }}>
              <Text
                style={[
                  styles.modeButtonText,
                  selectionMode === "user" &&
                    styles.modeButtonTextActive,
                ]}>
                Khách hàng chọn
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                selectionMode === "system" && styles.modeButtonActive,
              ]}
              onPress={() => {
                setSelectionMode("system");
                setSelectedNurseIds([]);
              }}>
              <Text
                style={[
                  styles.modeButtonText,
                  selectionMode === "system" &&
                    styles.modeButtonTextActive,
                ]}>
                Hệ thống chọn
              </Text>
            </TouchableOpacity>
          </View>

          {selectionMode === "user" && (
            <View style={styles.manualSelection}>
              <Text style={styles.manualHint}>
                {`Cần chọn: ${requiredNurseCount} ${
                  requiredNurseCount > 1 ? "người" : "người"
                }.`}
              </Text>
              {Array.from({ length: requiredNurseCount }).map(
                (_, idx) => {
                  const chosenId = selectedNurseIds[idx];
                  const chosen = nurses.find(
                    (n) => n.nursingID === chosenId
                  );

                  // Get service info for this slot
                  const serviceId = slotServiceIds[idx];
                  const serviceInfo = services?.find(
                    (s) => s.serviceID === serviceId
                  );
                  // Map to corresponding task (by index fallback)
                  const task = customizeTasks[idx];
                  const rid = task
                    ? relativeSelections[task.customizeTaskID] ||
                      task.relativeID
                    : null;
                  const relName = rid
                    ? relativeNameById[rid] || `ID ${rid}`
                    : "Chưa chọn";

                  return (
                    <View key={idx} style={styles.slotRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.slotLabel}>
                          {serviceInfo
                            ? serviceInfo.serviceName
                            : "(dịch vụ)"}
                        </Text>
                        {task && (
                          <Text style={styles.relativeTimeText}>
                            {serviceInfo?.forMom
                              ? careProfileData?.fullName || "Mẹ"
                              : relName}
                            ,{" "}
                            {formatTimeRange(
                              task.startTime,
                              task.endTime
                            )}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.selectSlotButton}
                        onPress={() => openNursePicker(idx)}>
                        <Text style={styles.selectSlotButtonText}>
                          {chosen
                            ? chosen.fullName ||
                              chosen.nursingFullName
                            : "Chọn điều dưỡng"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }
              )}
            </View>
          )}
        </View>

        {/* Relative Summary */}
        {/* Removed as requested */}
        {/* {renderRelativeSummary()} */}

        {/* Relative Selection */}
        {renderRelativeSelector()}

        {/* Payment Summary */}
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Tổng thanh toán</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Tổng tiền:</Text>
            <Text style={styles.amountValue}>
              {(() => {
                // Logic tính tổng thanh toán theo API response
                let finalAmount = 0;

                if (
                  bookingData?.extra !== null &&
                  bookingData?.extra !== undefined
                ) {
                  // Nếu có extra, tính: amount + (amount * extra)/100
                  const baseAmount = bookingData.amount || 0;
                  const extraPercent = bookingData.extra || 0;
                  finalAmount =
                    baseAmount + (baseAmount * extraPercent) / 100;
                } else {
                  // Nếu extra = null, sử dụng amount trực tiếp
                  finalAmount =
                    bookingData?.amount ||
                    extraData?.totalAmount ||
                    0;
                }

                // Nếu amount vẫn là 0, tính từ packageTasks
                if (finalAmount === 0 && packageTasks.length > 0) {
                  finalAmount = packageTasks.reduce((sum, task) => {
                    return sum + task.price * (task.quantity || 1);
                  }, 0);
                }

                // Nếu vẫn là 0, sử dụng package price từ extraData
                if (
                  finalAmount === 0 &&
                  extraData?.packageData?.price
                ) {
                  finalAmount = extraData.packageData.price;
                }

                return ServiceTypeService.formatPrice(finalAmount);
              })()}
            </Text>
          </View>

          {/* Hiển thị extra nếu có */}
          {bookingData?.extra !== null &&
            bookingData?.extra !== undefined && (
              <View style={styles.extraRow}>
                <Text style={styles.extraLabel}>Phí phát sinh:</Text>
                <Text style={styles.extraValue}>
                  {(() => {
                    // Sử dụng finalAmount đã tính ở trên thay vì bookingData.amount
                    let baseAmount = 0;

                    if (
                      bookingData?.extra !== null &&
                      bookingData?.extra !== undefined
                    ) {
                      baseAmount = bookingData.amount || 0;
                    } else {
                      baseAmount =
                        bookingData?.amount ||
                        extraData?.totalAmount ||
                        0;
                    }

                    // Nếu baseAmount vẫn là 0, tính từ packageTasks
                    if (baseAmount === 0 && packageTasks.length > 0) {
                      baseAmount = packageTasks.reduce(
                        (sum, task) => {
                          return (
                            sum + task.price * (task.quantity || 1)
                          );
                        },
                        0
                      );
                    }

                    // Nếu vẫn là 0, sử dụng package price từ extraData
                    if (
                      baseAmount === 0 &&
                      extraData?.packageData?.price
                    ) {
                      baseAmount = extraData.packageData.price;
                    }

                    const extraPercent = bookingData.extra || 0;
                    const extraAmount =
                      (baseAmount * extraPercent) / 100;
                    return ServiceTypeService.formatPrice(
                      extraAmount
                    );
                  })()}
                  <Text style={styles.extraPercent}>
                    {" "}
                    ({bookingData.extra}%)
                  </Text>
                </Text>
              </View>
            )}

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
              (!isPayActionEnabled() || isProcessingPayment) &&
                styles.disabledButton,
            ]}
            onPress={() => {
              handlePayment();
            }}
            disabled={!isPayActionEnabled()}>
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

      {/* Nurse Picker Modal */}
      {showNursePicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {(() => {
              const requiredServiceId =
                slotServiceIds[pickerSlotIndex] || null;
              const requiredServiceName = services?.find(
                (s) => s.serviceID === requiredServiceId
              )?.serviceName;

              // Intersect free nurses with nurses compatible for the required service (if any)
              let availableNurses = freeNurses || [];
              if (requiredServiceId) {
                const link = (nurseServiceLinks || []).find(
                  (l) => l.serviceID === requiredServiceId
                );
                if (
                  link &&
                  Array.isArray(link.nurses) &&
                  link.nurses.length > 0
                ) {
                  const compatibleIds = link.nurses
                    .map((n) => n.nursingID)
                    .filter((id) => id != null);
                  availableNurses = availableNurses.filter((n) =>
                    compatibleIds.includes(n.nursingID)
                  );
                }
              }

              return (
                <>
                  <Text style={styles.modalTitle}>
                    {requiredServiceName
                      ? `Chọn điều dưỡng cho: ${requiredServiceName}`
                      : "Chọn điều dưỡng"}
                  </Text>
                  <ScrollView style={{ width: "100%" }}>
                    {availableNurses.length === 0 ? (
                      <Text
                        style={{
                          paddingVertical: 12,
                          color: "#666",
                        }}>
                        Không có điều dưỡng trống cho thời gian này
                      </Text>
                    ) : (
                      availableNurses.map((nurse) => {
                        const isInWishlist =
                          wishlistMap[nurse.nursingID]?.isFavorite ||
                          false;

                        return (
                          <TouchableOpacity
                            key={nurse.nursingID}
                            style={styles.nurseRow}
                            onPress={() =>
                              chooseNurseForSlot(nurse.nursingID)
                            }>
                            <View style={styles.nurseInfoContainer}>
                              <Text style={styles.nurseNameText}>
                                {nurse.fullName ||
                                  nurse.nursingFullName}
                              </Text>
                              <Text style={styles.nurseMetaText}>
                                {nurse.experience || ""}
                              </Text>
                            </View>
                            {isInWishlist && (
                              <View
                                style={styles.wishlistIconContainer}>
                                <Ionicons
                                  name="heart"
                                  size={20}
                                  color="#FF6B6B"
                                />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </>
              );
            })()}
            <TouchableOpacity
              style={[styles.cancelButton, { marginTop: 10 }]}
              onPress={() => setShowNursePicker(false)}>
              <Text style={styles.cancelButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Relative Picker Modal */}
      {showRelativePicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Chọn người nhận dịch vụ
            </Text>
            <ScrollView style={{ width: "100%" }}>
              {!relatives || relatives.length === 0 ? (
                <Text style={{ paddingVertical: 12, color: "#666" }}>
                  Chưa có người trong hồ sơ chăm sóc
                </Text>
              ) : (
                relatives.map((rel) => (
                  <TouchableOpacity
                    key={rel.relativeID}
                    style={styles.nurseRow}
                    onPress={() => chooseRelative(rel.relativeID)}>
                    <Text style={styles.nurseNameText}>
                      {rel.relativeName || rel.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.cancelButton, { marginTop: 10 }]}
              onPress={() => setShowRelativePicker(false)}>
              <Text style={styles.cancelButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  extraRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  extraLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  extraValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  extraPercent: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  // Staff selection styles
  staffCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  staffTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  staffModeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  modeButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  modeButtonTextActive: {
    color: "white",
  },
  manualSelection: {
    marginTop: 10,
  },
  manualHint: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  slotLabel: {
    fontSize: 14,
    color: "#333",
  },
  selectSlotButton: {
    backgroundColor: "#4FC3F7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  selectSlotButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#CCC",
    opacity: 0.6,
  },
  // Modal styles for nurse picker
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  nurseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  nurseInfoContainer: {
    flex: 1,
  },
  nurseNameText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  nurseMetaText: {
    fontSize: 12,
    color: "#666",
  },
  wishlistIconContainer: {
    marginLeft: 10,
    padding: 4,
  },
  // Relative selection styles
  relativeCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  relativeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  relativeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  relativeTaskLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  relativeSub: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  relativeTimeText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
    fontWeight: "500",
  },
  momServiceText: {
    fontSize: 12,
    color: "#FF8AB3",
    marginTop: 2,
    fontStyle: "italic",
  },
  relativePicker: {
    backgroundColor: "#4FC3F7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 10,
  },
  relativePickerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  relativeHint: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 8,
  },
  relativeSummaryCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
});
