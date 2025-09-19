import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AuthService from "../../services/authService";
import CareProfileService from "../../services/careProfileService";
import NotificationService from "../../services/notificationService";
import NursingSpecialistService from "../../services/nursingSpecialistService";
import RelativeService from "../../services/relativeService";
import RoleService from "../../services/roleService";
import ZoneDetailService from "../../services/zoneDetailService";
// import AsyncStorageDebugger from "../../components/AsyncStorageDebugger";

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [careProfiles, setCareProfiles] = useState([]);
  const [isLoadingCareProfiles, setIsLoadingCareProfiles] =
    useState(false);
  const [showCareProfileForm, setShowCareProfileForm] =
    useState(false);
  const [careProfileForm, setCareProfileForm] = useState({
    profileName: "",
    dateOfBirth: "",
    phoneNumber: "",
    address: "",
    note: "",
    zoneDetailID: null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingProfile, setEditingProfile] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [relatives, setRelatives] = useState({});
  const [isLoadingRelatives, setIsLoadingRelatives] = useState({});
  const [showRelativeForm, setShowRelativeForm] = useState(false);
  const [relativeForm, setRelativeForm] = useState({
    relativeName: "",
    dateOfBirth: "",
    gender: "nam",
    note: "",
  });
  const [selectedCareProfileId, setSelectedCareProfileId] =
    useState(null);
  const [editingRelative, setEditingRelative] = useState(null);
  const [showEditRelativeForm, setShowEditRelativeForm] =
    useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Zone selection states
  const [zones, setZones] = useState([]);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  // Medical notes states
  const [showMedicalNotesModal, setShowMedicalNotesModal] =
    useState(false);
  const [
    selectedCareProfileForNotes,
    setSelectedCareProfileForNotes,
  ] = useState(null);
  const [medicalNotes, setMedicalNotes] = useState([]);
  const [isLoadingMedicalNotes, setIsLoadingMedicalNotes] =
    useState(false);

  useEffect(() => {
    if (userData) {
      loadCareProfiles(userData.accountID || userData.id);
      loadRelatives(userData.accountID || userData.id);
      loadZones();
    }
  }, [userData]);

  useEffect(() => {
    loadUserData();
    checkUnreadNotifications();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      const user = await AuthService.getUserData();

      if (user) {
        // Kiểm tra xem có phải NursingSpecialist không và cần enrich data
        const isNursingSpecialist = RoleService.isNursingSpecialist(
          user.roleID
        );

        if (isNursingSpecialist) {
          console.log("Loading nursing specialist data from API...");
          const enrichedUser =
            await NursingSpecialistService.enrichUserData(user);
          console.log("Enriched user data:", enrichedUser);
          setUserData(enrichedUser);
        } else {
          setUserData(user);
        }
      } else {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
        router.replace("/auth/login");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCareProfiles = async (accountID) => {
    if (!userData) return;

    try {
      setIsLoadingCareProfiles(true);

      const result =
        await CareProfileService.getCareProfilesByAccountId(
          accountID
        );

      if (result.success) {
        setCareProfiles(result.data);

        // Load relatives for each care profile
        result.data.forEach((profile) => {
          loadRelatives(profile.careProfileID);
        });
      } else {
        setCareProfiles([]);
      }
    } catch (error) {
      setCareProfiles([]);
    } finally {
      setIsLoadingCareProfiles(false);
    }
  };

  const loadZones = async () => {
    try {
      console.log("ProfileScreen: Loading zones...");
      const result =
        await ZoneDetailService.getZoneDetailsWithZoneInfo();

      if (result.success) {
        setZones(result.data);
        console.log(
          "ProfileScreen: Zones loaded:",
          result.data.length,
          "items"
        );
      } else {
        console.log(
          "ProfileScreen: Failed to load zones:",
          result.error
        );
        Alert.alert("Lỗi", "Không thể tải danh sách khu vực");
      }
    } catch (error) {
      console.error("ProfileScreen: Error loading zones:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi tải danh sách khu vực");
    }
  };

  const loadRelatives = async (careProfileID) => {
    try {
      setIsLoadingRelatives((prev) => ({
        ...prev,
        [careProfileID]: true,
      }));

      const result =
        await RelativeService.getRelativesByCareProfileId(
          careProfileID
        );

      if (result.success) {
        setRelatives((prev) => ({
          ...prev,
          [careProfileID]: result.data,
        }));
      } else {
        setRelatives((prev) => ({ ...prev, [careProfileID]: [] }));
      }
    } catch (error) {
      setRelatives((prev) => ({ ...prev, [careProfileID]: [] }));
    } finally {
      setIsLoadingRelatives((prev) => ({
        ...prev,
        [careProfileID]: false,
      }));
    }
  };

  const handleFieldChange = (key, value) => {
    setUserData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveUserData = async () => {
    try {
      // Kiểm tra xem có phải NursingSpecialist không
      const isNursingSpecialist = RoleService.isNursingSpecialist(
        userData.roleID
      );

      if (isNursingSpecialist) {
        // Chuẩn bị data cho NursingSpecialist update - chỉ gửi fields có giá trị
        const nursingUpdateData = {};

        if (userData.zoneID)
          nursingUpdateData.zoneID = userData.zoneID;
        if (userData.gender)
          nursingUpdateData.gender = userData.gender;
        if (userData.dateOfBirth)
          nursingUpdateData.dateOfBirth = userData.dateOfBirth;
        if (userData.fullName || userData.full_name)
          nursingUpdateData.fullName =
            userData.fullName || userData.full_name;
        if (userData.address)
          nursingUpdateData.address = userData.address;
        if (userData.experience)
          nursingUpdateData.experience = userData.experience;
        if (userData.slogan)
          nursingUpdateData.slogan = userData.slogan;
        if (userData.major) nursingUpdateData.major = userData.major;

        // Sử dụng NursingSpecialistService để update
        const result =
          await NursingSpecialistService.updateNursingSpecialist(
            userData.nursingID,
            nursingUpdateData
          );

        if (result.success) {
          // Cập nhật user data với response mới, nhưng preserve data hiện tại
          const updatedUser = {
            ...userData, // Giữ lại tất cả data hiện tại
            // Chỉ update các field được trả về từ API
            ...(result.data.fullName && {
              fullName: result.data.fullName,
              full_name: result.data.fullName,
            }),
            ...(result.data.nursingID && {
              nursingID: result.data.nursingID,
            }),
            ...(result.data.accountID && {
              accountID: result.data.accountID,
            }),
            ...(result.data.zoneID && { zoneID: result.data.zoneID }),
            ...(result.data.gender && { gender: result.data.gender }),
            ...(result.data.dateOfBirth && {
              dateOfBirth: result.data.dateOfBirth,
            }),
            ...(result.data.address && {
              address: result.data.address,
            }),
            ...(result.data.experience && {
              experience: result.data.experience,
            }),
            ...(result.data.slogan && { slogan: result.data.slogan }),
            ...(result.data.major && { major: result.data.major }),
            ...(result.data.status && { status: result.data.status }),
          };

          setUserData(updatedUser);
          setIsEditing(false);
          // Không hiển thị thông báo thành công
        } else {
          Alert.alert(
            "Lỗi",
            result.error || "Không thể cập nhật thông tin"
          );
        }
      } else {
        // Customer hoặc role khác - sử dụng AuthService
        const result = await AuthService.updateUser(
          userData.id || userData.accountID,
          userData
        );

        if (result.success) {
          setUserData(result.user);
          setIsEditing(false);
          // Không hiển thị thông báo thành công
        } else {
          Alert.alert(
            "Lỗi",
            result.error || "Không thể cập nhật thông tin"
          );
        }
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu thông tin");
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      router.replace("/auth/login");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể đăng xuất");
    }
  };

  const createCareProfile = async () => {
    try {
      // Chuẩn bị data cho care profile
      const careProfileData = {
        accountID: userData.accountID || userData.id,
        zoneDetailID: 1, // Default zone detail ID
        profileName: userData.fullName || userData.full_name || "",
        dateOfBirth: userData.dateOfBirth || new Date().toISOString(),
        phoneNumber:
          userData.phoneNumber || userData.phone_number || "",
        address: userData.address || "",
        image: "string", // Default image
        note: "Hồ sơ chăm sóc được tạo từ profile",
      };

      const result = await CareProfileService.createCareProfile(
        careProfileData
      );

      if (result.success) {
        // Không hiển thị thông báo thành công
        // Reload care profiles sau khi tạo thành công
        await loadCareProfiles();
      } else {
        Alert.alert(
          "Lỗi",
          result.error || "Không thể tạo hồ sơ chăm sóc"
        );
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo hồ sơ chăm sóc");
    }
  };

  const openCareProfileForm = () => {
    // Pre-fill form với thông tin từ user data
    const userDateOfBirth = userData.dateOfBirth
      ? new Date(userData.dateOfBirth)
      : new Date();
    setSelectedDate(userDateOfBirth);

    setCareProfileForm({
      profileName: userData.fullName || userData.full_name || "",
      dateOfBirth: userData.dateOfBirth
        ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
        : "",
      phoneNumber:
        userData.phoneNumber || userData.phone_number || "",
      address: userData.address || "",
      note: "",
      zoneDetailID: null,
    });
    setSelectedZone(null);
    setShowCareProfileForm(true);
  };

  const closeCareProfileForm = () => {
    setShowCareProfileForm(false);
    setCareProfileForm({
      profileName: "",
      dateOfBirth: "",
      phoneNumber: "",
      address: "",
      note: "",
      zoneDetailID: null,
    });
    setSelectedZone(null);
  };

  const handleCareProfileFormChange = (field, value) => {
    setCareProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const hideDatePickerModal = () => {
    setShowDatePicker(false);
  };

  const handleDateChange = (event, date) => {
    hideDatePickerModal();
    if (date) {
      setSelectedDate(date);
      const dateString = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD

      // Update the appropriate form based on which modal is open
      if (showCareProfileForm || showEditForm) {
        handleCareProfileFormChange("dateOfBirth", dateString);
      } else if (showRelativeForm || showEditRelativeForm) {
        handleRelativeFormChange("dateOfBirth", dateString);
      }
    }
  };

  const openZoneModal = () => {
    if (zones.length === 0) {
      loadZones();
    }
    setShowZoneModal(true);
  };

  const closeZoneModal = () => {
    setShowZoneModal(false);
  };

  // Medical notes functions
  const openMedicalNotesModal = (careProfileId) => {
    setSelectedCareProfileForNotes(careProfileId);
    setShowMedicalNotesModal(true);
    loadMedicalNotes(careProfileId);
  };

  const closeMedicalNotesModal = () => {
    setShowMedicalNotesModal(false);
    setSelectedCareProfileForNotes(null);
    setMedicalNotes([]);
  };

  const loadMedicalNotes = async (careProfileId) => {
    try {
      setIsLoadingMedicalNotes(true);
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

        // Enhance notes with additional information
        const enhancedNotes = await Promise.all(
          data.map(async (note) => {
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
                console.log(
                  "Fetched nursing name:",
                  enhancedNote.nursingName
                );
              } else {
                console.log(
                  "Failed to fetch nursing name, status:",
                  nursingResponse.status
                );
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
                  console.log(
                    "Fetched relative name:",
                    enhancedNote.relativeName
                  );
                } else {
                  console.log(
                    "Failed to fetch relative name, status:",
                    relativeResponse.status
                  );
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
        console.error(
          "Failed to load medical notes:",
          response.status
        );
        setMedicalNotes([]);
      }
    } catch (error) {
      console.error("Error loading medical notes:", error);
      setMedicalNotes([]);
    } finally {
      setIsLoadingMedicalNotes(false);
    }
  };

  const selectZone = (zone) => {
    setSelectedZone(zone);
    handleCareProfileFormChange("zoneDetailID", zone.zoneDetailID);
    closeZoneModal();
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch (error) {
      return dateString;
    }
  };

  const openEditForm = (profile) => {
    setEditingProfile(profile);
    const profileDate = profile.dateOfBirth
      ? new Date(profile.dateOfBirth)
      : new Date();
    setSelectedDate(profileDate);

    setCareProfileForm({
      profileName: profile.profileName || "",
      dateOfBirth: profile.dateOfBirth
        ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
        : "",
      phoneNumber: profile.phoneNumber || "",
      address: profile.address || "",
      note: profile.note || "",
    });
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingProfile(null);
    setCareProfileForm({
      profileName: "",
      dateOfBirth: "",
      phoneNumber: "",
      address: "",
      note: "",
    });
  };

  const submitEditForm = async () => {
    try {
      // Validate form
      if (!careProfileForm.profileName.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập tên hồ sơ");
        return;
      }

      if (!careProfileForm.dateOfBirth) {
        Alert.alert("Lỗi", "Vui lòng chọn ngày sinh");
        return;
      }

      if (!careProfileForm.phoneNumber.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
        return;
      }

      // Chuẩn bị data cho care profile update
      const updateData = {
        zoneDetailID: editingProfile.zoneDetailID || 1,
        profileName: careProfileForm.profileName.trim(),
        dateOfBirth: new Date(
          careProfileForm.dateOfBirth
        ).toISOString(),
        phoneNumber: careProfileForm.phoneNumber.trim(),
        address: careProfileForm.address.trim(),
        image: editingProfile.image || "string",
        note: careProfileForm.note.trim(),
        status: editingProfile.status || "Active",
      };

      const result = await CareProfileService.updateCareProfile(
        editingProfile.careProfileID,
        updateData
      );

      if (result.success) {
        Alert.alert(
          "Thành công",
          `Đã cập nhật hồ sơ chăm sóc: ${result.data.careProfile.profileName}`
        );
        // Reload care profiles sau khi update thành công
        await loadCareProfiles();
        // Đóng form
        closeEditForm();
      } else {
        Alert.alert(
          "Lỗi",
          result.error || "Không thể cập nhật hồ sơ chăm sóc"
        );
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật hồ sơ chăm sóc");
    }
  };

  const deleteCareProfile = async (profile) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa hồ sơ "${profile.profileName}"?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const result =
                await CareProfileService.deleteCareProfile(
                  profile.careProfileID
                );

              if (result.success) {
                Alert.alert(
                  "Thành công",
                  `Đã xóa hồ sơ chăm sóc: ${profile.profileName}`
                );
                // Reload care profiles sau khi xóa thành công
                await loadCareProfiles();
              } else {
                Alert.alert(
                  "Lỗi",
                  result.error || "Không thể xóa hồ sơ chăm sóc"
                );
              }
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa hồ sơ chăm sóc");
            }
          },
        },
      ]
    );
  };

  // Relative management functions
  const openRelativeForm = (careProfileID) => {
    setSelectedCareProfileId(careProfileID);
    setRelativeForm({
      relativeName: "",
      dateOfBirth: "",
      gender: "nam",
      note: "",
    });
    setSelectedDate(new Date());
    setShowRelativeForm(true);
  };

  const closeRelativeForm = () => {
    setShowRelativeForm(false);
    setSelectedCareProfileId(null);
    setRelativeForm({
      relativeName: "",
      dateOfBirth: "",
      gender: "nam",
      note: "",
    });
  };

  const handleRelativeFormChange = (field, value) => {
    setRelativeForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitRelativeForm = async () => {
    try {
      // Validate form
      if (!relativeForm.relativeName.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập tên con");
        return;
      }

      if (!relativeForm.dateOfBirth) {
        Alert.alert("Lỗi", "Vui lòng chọn ngày sinh");
        return;
      }

      const relativeData = {
        careProfileID: selectedCareProfileId,
        relativeName: relativeForm.relativeName.trim(),
        dateOfBirth: new Date(relativeForm.dateOfBirth).toISOString(),
        gender: relativeForm.gender,
        image: "",
        note: relativeForm.note.trim(),
      };

      const result = await RelativeService.createRelative(
        relativeData
      );

      if (result.success) {
        Alert.alert(
          "Thành công",
          `Đã thêm con: ${result.data.relative.relativeName}`
        );
        // Reload relatives for this care profile
        await loadRelatives(selectedCareProfileId);
        // Close form
        closeRelativeForm();
      } else {
        Alert.alert("Lỗi", result.error || "Không thể thêm con");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể thêm con");
    }
  };

  const openEditRelativeForm = (relative) => {
    setEditingRelative(relative);
    const relativeDate = relative.dateOfBirth
      ? new Date(relative.dateOfBirth)
      : new Date();
    setSelectedDate(relativeDate);

    setRelativeForm({
      relativeName: relative.relativeName || "",
      dateOfBirth: relative.dateOfBirth
        ? new Date(relative.dateOfBirth).toISOString().split("T")[0]
        : "",
      gender: relative.gender || "nam",
      note: relative.note || "",
    });
    setShowEditRelativeForm(true);
  };

  const closeEditRelativeForm = () => {
    setShowEditRelativeForm(false);
    setEditingRelative(null);
    setRelativeForm({
      relativeName: "",
      dateOfBirth: "",
      gender: "nam",
      note: "",
    });
  };

  const submitEditRelativeForm = async () => {
    try {
      // Validate form
      if (!relativeForm.relativeName.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập tên con");
        return;
      }

      if (!relativeForm.dateOfBirth) {
        Alert.alert("Lỗi", "Vui lòng chọn ngày sinh");
        return;
      }

      const updateData = {
        relativeID: editingRelative.relativeID,
        relativeName: relativeForm.relativeName.trim(),
        dateOfBirth: relativeForm.dateOfBirth, // API expects YYYY-MM-DD
        gender:
          relativeForm.gender === "Nam" ||
          relativeForm.gender === "Male"
            ? "Nam"
            : relativeForm.gender === "Nữ" ||
              relativeForm.gender === "Female"
            ? "Nữ"
            : relativeForm.gender,
        image: editingRelative.image || "string",
        note: relativeForm.note.trim() || "",
      };

      const result = await RelativeService.updateRelative(
        editingRelative.relativeID,
        updateData
      );

      if (result.success) {
        const childName = updateData.relativeName;
        let msg =
          (result.data && (result.data.message || result.data.msg)) ||
          "";
        if (msg) {
          // Dịch sang TV và thay ID bằng tên
          msg = msg.replace(
            /Relative\s+with\s+ID\s+\d+\s+updated\s+successfully\.?/i,
            `Đã cập nhật ${childName} thành công.`
          );
        } else {
          msg = `Đã cập nhật ${childName} thành công.`;
        }
        Alert.alert("Thành công", msg);
        // Reload relatives for this care profile
        await loadRelatives(editingRelative.careProfileID);
        // Close form
        closeEditRelativeForm();
      } else {
        Alert.alert(
          "Lỗi",
          result.error || "Không thể cập nhật thông tin con"
        );
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật thông tin con");
    }
  };

  const deleteRelative = async (relative) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa thông tin con "${relative.relativeName}"?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await RelativeService.deleteRelative(
                relative.relativeID
              );

              if (result.success) {
                Alert.alert(
                  "Thành công",
                  `Đã xóa thông tin con: ${relative.relativeName}`
                );
                // Reload relatives for this care profile
                await loadRelatives(relative.careProfileID);
              } else {
                Alert.alert(
                  "Lỗi",
                  result.error || "Không thể xóa thông tin con"
                );
              }
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa thông tin con");
            }
          },
        },
      ]
    );
  };

  const submitCareProfileForm = async () => {
    try {
      // Validate form
      if (!careProfileForm.profileName.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập tên hồ sơ");
        return;
      }

      if (!careProfileForm.dateOfBirth) {
        Alert.alert("Lỗi", "Vui lòng chọn ngày sinh");
        return;
      }

      if (!careProfileForm.phoneNumber.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
        return;
      }

      if (!careProfileForm.zoneDetailID) {
        Alert.alert("Lỗi", "Vui lòng chọn khu vực");
        return;
      }

      // Chuẩn bị data cho care profile
      const careProfileData = {
        accountID: userData.accountID || userData.id,
        zoneDetailID: careProfileForm.zoneDetailID,
        profileName: careProfileForm.profileName.trim(),
        dateOfBirth: new Date(
          careProfileForm.dateOfBirth
        ).toISOString(),
        phoneNumber: careProfileForm.phoneNumber.trim(),
        address: careProfileForm.address.trim(),
        image: "string", // Default image
        note: careProfileForm.note.trim(),
      };

      console.log(
        "ProfileScreen: Creating care profile with data:",
        careProfileData
      );

      const result = await CareProfileService.createCareProfile(
        careProfileData
      );

      if (result.success) {
        // Không hiển thị alert thành công
        // Reload care profiles sau khi tạo thành công
        await loadCareProfiles();
        // Đóng form và reset
        closeCareProfileForm();
        setSelectedZone(null);
      } else {
        Alert.alert(
          "Lỗi",
          result.error || "Không thể tạo hồ sơ chăm sóc"
        );
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo hồ sơ chăm sóc");
    }
  };

  const renderProfileFields = () => {
    if (!userData) return null;

    // Sử dụng NursingSpecialistService để lấy display values
    const displayValues =
      NursingSpecialistService.getDisplayValues(userData);

    // Check if user is NursingSpecialist
    const isNursingSpecialist = RoleService.isNursingSpecialist(
      userData.roleID
    );

    if (isNursingSpecialist) {
      // Fields for NursingSpecialist
      const nursingFields = [
        {
          label: "Họ và tên",
          value: displayValues.fullName,
          key: "fullName",
          editable: isEditing,
        },
        {
          label: "Giới tính",
          value: displayValues.gender,
          key: "gender",
          editable: isEditing,
        },
        {
          label: "Ngày sinh",
          value: displayValues.dateOfBirth,
          key: "dateOfBirth",
          editable: isEditing,
          type: "date",
        },
        {
          label: "Địa chỉ",
          value: displayValues.address,
          key: "address",
          editable: isEditing,
        },
        {
          label: "Chuyên môn",
          value: displayValues.major,
          key: "major",
          editable: isEditing,
        },
        {
          label: "Email",
          value: userData.email || "",
          key: "email",
          editable: false, // Email không được edit
        },
        {
          label: "Số điện thoại",
          value: userData.phoneNumber || userData.phone_number || "",
          key: "phoneNumber",
          editable: false, // Phone không được edit
        },
        {
          label: "Trạng thái",
          value: displayValues.status,
          key: "status",
          editable: false,
        },
      ];

      return nursingFields.map((field, index) => (
        <View key={index} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          {field.editable ? (
            field.type === "date" ? (
              <TextInput
                style={styles.fieldInput}
                value={field.value}
                onChangeText={(text) =>
                  handleFieldChange(field.key, text)
                }
                placeholder={`Nhập ${field.label.toLowerCase()}`}
              />
            ) : (
              <TextInput
                style={styles.fieldInput}
                value={field.value}
                onChangeText={(text) =>
                  handleFieldChange(field.key, text)
                }
                placeholder={`Nhập ${field.label.toLowerCase()}`}
              />
            )
          ) : (
            <Text style={styles.fieldValue}>
              {field.value || "Chưa cập nhật"}
            </Text>
          )}
        </View>
      ));
    } else {
      // Fields for Customer (basic fields only)
      const customerFields = [
        {
          label: "Họ và tên",
          value: displayValues.fullName,
          key: "fullName",
          editable: isEditing,
        },
        {
          label: "Email",
          value: userData.email || "",
          key: "email",
          editable: false, // Email không được edit
        },
        {
          label: "Số điện thoại",
          value: userData.phoneNumber || userData.phone_number || "",
          key: "phoneNumber",
          editable: false, // Phone không được edit
        },
        {
          label: "Vai trò",
          value: RoleService.getDisplayName(
            userData.roleName ||
              RoleService.getRoleName(
                userData.role_id || userData.roleID
              )
          ),
          key: "role_id",
          editable: false,
        },
      ];

      return customerFields.map((field, index) => (
        <View key={index} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          {field.editable ? (
            <TextInput
              style={styles.fieldInput}
              value={field.value}
              onChangeText={(text) =>
                handleFieldChange(field.key, text)
              }
              placeholder={`Nhập ${field.label.toLowerCase()}`}
            />
          ) : (
            <Text style={styles.fieldValue}>
              {field.value || "Chưa cập nhật"}
            </Text>
          )}
        </View>
      ));
    }
  };

  const renderMajorSelection = () => {
    // Major đã được thêm vào profile fields chính
    return null;
  };

  const renderNursingSpecialistFields = () => {
    if (
      !userData ||
      !RoleService.isNursingSpecialist(
        userData.role_id || userData.roleID
      )
    )
      return null;

    const displayValues =
      NursingSpecialistService.getDisplayValues(userData);

    const fields = [
      {
        label: "Kinh nghiệm",
        value: displayValues.experience,
        key: "experience",
        editable: isEditing,
        multiline: true,
        placeholder:
          "Ví dụ: 5 năm kinh nghiệm trong lĩnh vực điều dưỡng",
      },
      {
        label: "Slogan",
        value: displayValues.slogan,
        key: "slogan",
        editable: isEditing,
        multiline: true,
        placeholder: "Ví dụ: Chăm sóc sức khỏe với tình yêu thương",
      },
    ];

    return (
      <View style={styles.specialistSection}>
        <Text style={styles.sectionTitle}>Thông tin chuyên môn</Text>
        {fields.map((field, index) => (
          <View key={index} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            {field.editable ? (
              <TextInput
                style={[
                  styles.fieldInput,
                  field.multiline && styles.multilineInput,
                ]}
                value={field.value}
                onChangeText={(text) =>
                  handleFieldChange(field.key, text)
                }
                placeholder={field.placeholder}
                multiline={field.multiline}
                numberOfLines={field.multiline ? 3 : 1}
              />
            ) : (
              <Text style={styles.fieldValue}>
                {field.value || "Chưa cập nhật"}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCareProfiles = () => {
    if (isLoadingCareProfiles) {
      return (
        <View style={styles.careProfileCard}>
          <Text style={styles.sectionTitle}>Hồ sơ chăm sóc</Text>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              Đang tải hồ sơ chăm sóc...
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.careProfileCard}>
        <Text style={styles.sectionTitle}>Hồ sơ chăm sóc</Text>

        {careProfiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Chưa có hồ sơ chăm sóc nào
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Nhấn nút &quot;Thêm hồ sơ chăm sóc&quot; để tạo hồ sơ
              đầu tiên
            </Text>
          </View>
        ) : (
          <View style={styles.careProfileList}>
            {careProfiles.map((profile, index) => (
              <LinearGradient
                key={profile.careProfileID || index}
                colors={[
                  "rgba(194, 245, 233, 0.6)",
                  "rgba(179, 229, 252, 0.6)",
                  "rgba(255, 217, 230, 0.6)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.careProfileItem}>
                <View style={styles.careProfileHeader}>
                  <Text style={styles.careProfileName}>
                    {profile.profileName}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          profile.status === "active"
                            ? "#4CAF50"
                            : "#FF6B6B",
                      },
                    ]}>
                    <Text style={styles.statusText}>
                      {profile.status === "active"
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </Text>
                  </View>
                </View>

                <View style={styles.careProfileDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ngày sinh:</Text>
                    <Text style={styles.detailValue}>
                      {CareProfileService.formatDate(
                        profile.dateOfBirth
                      )}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Số điện thoại:
                    </Text>
                    <Text style={styles.detailValue}>
                      {profile.phoneNumber}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Địa chỉ:</Text>
                    <Text style={styles.detailValue}>
                      {profile.address}
                    </Text>
                  </View>

                  {profile.note && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ghi chú:</Text>
                      <Text style={styles.detailValue}>
                        {profile.note}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ngày tạo:</Text>
                    <Text style={styles.detailValue}>
                      {CareProfileService.formatDate(
                        profile.createdAt
                      )}
                    </Text>
                  </View>
                </View>

                {/* Relatives Section */}
                <View style={styles.relativesSection}>
                  <Text style={styles.relativesTitle}>
                    Danh sách con:
                  </Text>
                  {isLoadingRelatives[profile.careProfileID] ? (
                    <Text style={styles.loadingText}>
                      Đang tải...
                    </Text>
                  ) : relatives[profile.careProfileID] &&
                    relatives[profile.careProfileID].length > 0 ? (
                    <View style={styles.relativesList}>
                      {relatives[profile.careProfileID].map(
                        (relative, relativeIndex) => (
                          <View
                            key={relative.relativeID || relativeIndex}
                            style={styles.relativeItem}>
                            <View style={styles.relativeHeader}>
                              <Text style={styles.relativeName}>
                                {relative.relativeName}
                              </Text>
                              <View style={styles.relativeActions}>
                                <TouchableOpacity
                                  style={styles.relativeActionButton}
                                  onPress={() =>
                                    openEditRelativeForm(relative)
                                  }>
                                  <Ionicons
                                    name="pencil"
                                    size={16}
                                    color="#4CAF50"
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.relativeActionButton}
                                  onPress={() =>
                                    deleteRelative(relative)
                                  }>
                                  <Ionicons
                                    name="trash"
                                    size={16}
                                    color="#FF6B6B"
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>
                            <View style={styles.relativeDetails}>
                              <Text style={styles.relativeDetail}>
                                Ngày sinh:{" "}
                                {RelativeService.formatDate(
                                  relative.dateOfBirth
                                )}
                              </Text>
                              <Text style={styles.relativeDetail}>
                                Giới tính:{" "}
                                {RelativeService.formatGenderDisplay(
                                  relative.gender
                                )}
                              </Text>
                              {relative.note && (
                                <Text style={styles.relativeDetail}>
                                  Ghi chú: {relative.note}
                                </Text>
                              )}
                            </View>
                          </View>
                        )
                      )}
                    </View>
                  ) : (
                    <Text style={styles.emptyRelativesText}>
                      Chưa có thông tin con nào
                    </Text>
                  )}
                </View>

                <View style={styles.careProfileActions}>
                  <TouchableOpacity
                    style={styles.addRelativeButton}
                    onPress={() =>
                      openRelativeForm(profile.careProfileID)
                    }>
                    <Ionicons
                      name="add-circle"
                      size={20}
                      color="#2196F3"
                    />
                    <Text
                      style={[
                        styles.addRelativeButtonText,
                        { color: "#2196F3" },
                      ]}>
                      Thêm thông tin con
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewNotesButton}
                    onPress={() =>
                      openMedicalNotesModal(profile.careProfileID)
                    }>
                    <Ionicons
                      name="document-text"
                      size={20}
                      color="#FF9800"
                    />
                    <Text
                      style={[
                        styles.viewNotesButtonText,
                        { color: "#FF9800" },
                      ]}>
                      Xem ghi chú
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.editDeleteContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openEditForm(profile)}>
                      <Ionicons
                        name="pencil"
                        size={20}
                        color="#4CAF50"
                      />
                      <Text
                        style={[
                          styles.actionButtonText,
                          { color: "#4CAF50" },
                        ]}>
                        Chỉnh Sửa
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteCareProfile(profile)}>
                      <Ionicons
                        name="trash"
                        size={20}
                        color="#FF6B6B"
                      />
                      <Text
                        style={[
                          styles.actionButtonText,
                          { color: "#FF6B6B" },
                        ]}>
                        Xóa
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderCareProfileForm = () => {
    if (!showCareProfileForm) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm hồ sơ chăm sóc</Text>
            <TouchableOpacity onPress={closeCareProfileForm}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Tên hồ sơ *</Text>
              <TextInput
                style={styles.formInput}
                value={careProfileForm.profileName}
                onChangeText={(text) =>
                  handleCareProfileFormChange("profileName", text)
                }
                placeholder="Nhập tên hồ sơ"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Ngày sinh *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={showDatePickerModal}>
                <Text
                  style={[
                    styles.datePickerText,
                    !careProfileForm.dateOfBirth &&
                      styles.placeholderText,
                  ]}>
                  {careProfileForm.dateOfBirth
                    ? formatDateForDisplay(
                        careProfileForm.dateOfBirth
                      )
                    : "Chọn ngày sinh"}
                </Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Số điện thoại *</Text>
              <TextInput
                style={styles.formInput}
                value={careProfileForm.phoneNumber}
                onChangeText={(text) =>
                  handleCareProfileFormChange("phoneNumber", text)
                }
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Khu vực *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={openZoneModal}>
                <Text
                  style={[
                    styles.datePickerText,
                    !selectedZone && styles.placeholderText,
                  ]}>
                  {selectedZone
                    ? selectedZone.displayName
                    : "Chọn khu vực"}
                </Text>
                <Ionicons name="location" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Địa chỉ</Text>
              <TextInput
                style={styles.formInput}
                value={careProfileForm.address}
                onChangeText={(text) =>
                  handleCareProfileFormChange("address", text)
                }
                placeholder="Nhập địa chỉ"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Ghi chú</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                value={careProfileForm.note}
                onChangeText={(text) =>
                  handleCareProfileFormChange("note", text)
                }
                placeholder="Nhập ghi chú (nếu có)"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeCareProfileForm}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitCareProfileForm}>
              <Text style={styles.submitButtonText}>Tạo hồ sơ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEditCareProfileForm = () => {
    if (!showEditForm) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Chỉnh sửa hồ sơ chăm sóc
            </Text>
            <TouchableOpacity onPress={closeEditForm}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Tên hồ sơ *</Text>
              <TextInput
                style={styles.formInput}
                value={careProfileForm.profileName}
                onChangeText={(text) =>
                  handleCareProfileFormChange("profileName", text)
                }
                placeholder="Nhập tên hồ sơ"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Ngày sinh *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={showDatePickerModal}>
                <Text
                  style={[
                    styles.datePickerText,
                    !careProfileForm.dateOfBirth &&
                      styles.placeholderText,
                  ]}>
                  {careProfileForm.dateOfBirth
                    ? formatDateForDisplay(
                        careProfileForm.dateOfBirth
                      )
                    : "Chọn ngày sinh"}
                </Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Số điện thoại *</Text>
              <TextInput
                style={styles.formInput}
                value={careProfileForm.phoneNumber}
                onChangeText={(text) =>
                  handleCareProfileFormChange("phoneNumber", text)
                }
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Khu vực *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={openZoneModal}>
                <Text
                  style={[
                    styles.datePickerText,
                    !selectedZone && styles.placeholderText,
                  ]}>
                  {selectedZone
                    ? selectedZone.displayName
                    : "Chọn khu vực"}
                </Text>
                <Ionicons name="location" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Địa chỉ</Text>
              <TextInput
                style={styles.formInput}
                value={careProfileForm.address}
                onChangeText={(text) =>
                  handleCareProfileFormChange("address", text)
                }
                placeholder="Nhập địa chỉ"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Ghi chú</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                value={careProfileForm.note}
                onChangeText={(text) =>
                  handleCareProfileFormChange("note", text)
                }
                placeholder="Nhập ghi chú (nếu có)"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeEditForm}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitEditForm}>
              <Text style={styles.submitButtonText}>
                Lưu thay đổi
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderRelativeForm = () => {
    if (!showRelativeForm) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm con</Text>
            <TouchableOpacity onPress={closeRelativeForm}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Tên con *</Text>
              <TextInput
                style={styles.formInput}
                value={relativeForm.relativeName}
                onChangeText={(text) =>
                  handleRelativeFormChange("relativeName", text)
                }
                placeholder="Nhập tên con"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Ngày sinh *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={showDatePickerModal}>
                <Text
                  style={[
                    styles.datePickerText,
                    !relativeForm.dateOfBirth &&
                      styles.placeholderText,
                  ]}>
                  {relativeForm.dateOfBirth
                    ? formatDateForDisplay(relativeForm.dateOfBirth)
                    : "Chọn ngày sinh"}
                </Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Giới tính *</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    relativeForm.gender === "nam" &&
                      styles.selectedGenderOption,
                  ]}
                  onPress={() =>
                    handleRelativeFormChange("gender", "nam")
                  }>
                  <Text
                    style={[
                      styles.genderOptionText,
                      relativeForm.gender === "nam" &&
                        styles.selectedGenderOptionText,
                    ]}>
                    Nam
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    relativeForm.gender === "nữ" &&
                      styles.selectedGenderOption,
                  ]}
                  onPress={() =>
                    handleRelativeFormChange("gender", "nữ")
                  }>
                  <Text
                    style={[
                      styles.genderOptionText,
                      relativeForm.gender === "nữ" &&
                        styles.selectedGenderOptionText,
                    ]}>
                    Nữ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Ghi chú</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                value={relativeForm.note}
                onChangeText={(text) =>
                  handleRelativeFormChange("note", text)
                }
                placeholder="Nhập ghi chú (nếu có)"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeRelativeForm}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitRelativeForm}>
              <Text style={styles.submitButtonText}>Thêm con</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEditRelativeForm = () => {
    if (!showEditRelativeForm) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Chỉnh sửa thông tin con
            </Text>
            <TouchableOpacity onPress={closeEditRelativeForm}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Tên con *</Text>
              <TextInput
                style={styles.formInput}
                value={relativeForm.relativeName}
                onChangeText={(text) =>
                  handleRelativeFormChange("relativeName", text)
                }
                placeholder="Nhập tên con"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Ngày sinh *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={showDatePickerModal}>
                <Text
                  style={[
                    styles.datePickerText,
                    !relativeForm.dateOfBirth &&
                      styles.placeholderText,
                  ]}>
                  {relativeForm.dateOfBirth
                    ? formatDateForDisplay(relativeForm.dateOfBirth)
                    : "Chọn ngày sinh"}
                </Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Giới tính *</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    relativeForm.gender === "nam" &&
                      styles.selectedGenderOption,
                  ]}
                  onPress={() =>
                    handleRelativeFormChange("gender", "nam")
                  }>
                  <Text
                    style={[
                      styles.genderOptionText,
                      relativeForm.gender === "nam" &&
                        styles.selectedGenderOptionText,
                    ]}>
                    Nam
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    relativeForm.gender === "nữ" &&
                      styles.selectedGenderOption,
                  ]}
                  onPress={() =>
                    handleRelativeFormChange("gender", "nữ")
                  }>
                  <Text
                    style={[
                      styles.genderOptionText,
                      relativeForm.gender === "nữ" &&
                        styles.selectedGenderOptionText,
                    ]}>
                    Nữ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Ghi chú</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                value={relativeForm.note}
                onChangeText={(text) =>
                  handleRelativeFormChange("note", text)
                }
                placeholder="Nhập ghi chú (nếu có)"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeEditRelativeForm}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitEditRelativeForm}>
              <Text style={styles.submitButtonText}>
                Lưu thay đổi
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderDatePicker = () => {
    if (!showDatePicker) return null;

    return (
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display="default"
        onChange={handleDateChange}
        maximumDate={new Date()} // Không cho chọn ngày trong tương lai
        minimumDate={new Date(1900, 0, 1)} // Giới hạn từ năm 1900
      />
    );
  };

  const renderMedicalNotesModal = () => {
    if (!showMedicalNotesModal) return null;

    const selectedProfile = careProfiles.find(
      (profile) =>
        profile.careProfileID === selectedCareProfileForNotes
    );

    return (
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
                {selectedProfile?.profileName || "Hồ sơ"}
              </Text>
              <TouchableOpacity
                style={styles.closeIconButton}
                onPress={closeMedicalNotesModal}>
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
                                : selectedProfile?.profileName ||
                                  "Mẹ")}
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
                    Chưa có ghi chú y tế nào cho hồ sơ này
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
    );
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
        style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Đang tải thông tin...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (!userData) {
    return (
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Không tìm thấy thông tin người dùng
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadUserData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Ionicons
            name={isEditing ? "close" : "create"}
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

          {renderProfileFields()}

          {isEditing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveUserData}>
              <Text style={styles.saveButtonText}>Lưu thông tin</Text>
            </TouchableOpacity>
          )}

          <LinearGradient
            colors={["#ec1c3f", "#FFD9E6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutButton}>
            <TouchableOpacity
              style={styles.logoutButtonContent}
              onPress={logout}>
              <Text style={styles.logoutButtonText}>Đăng xuất</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Chỉ hiển thị "Thêm hồ sơ chăm sóc" cho Customer */}
          {!RoleService.isNursingSpecialist(
            userData.role_id || userData.roleID
          ) && (
            <LinearGradient
              colors={["#0e78ad", "#63c2f2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addCareProfileButton}>
              <TouchableOpacity
                style={styles.addCareProfileButtonContent}
                onPress={openCareProfileForm}>
                <Text style={styles.addCareProfileButtonText}>
                  Thêm hồ sơ chăm sóc
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          )}
        </View>

        {renderNursingSpecialistFields()}

        {/* Chỉ hiển thị "Hồ sơ chăm sóc" cho Customer */}
        {!RoleService.isNursingSpecialist(
          userData.role_id || userData.roleID
        ) && renderCareProfiles()}

        {renderCareProfileForm()}
        {renderEditCareProfileForm()}
        {renderRelativeForm()}
        {renderEditRelativeForm()}
        {renderDatePicker()}
        {renderMedicalNotesModal()}

        {/* Zone Selection Modal */}
        <Modal
          visible={showZoneModal}
          transparent={true}
          animationType="slide"
          onRequestClose={closeZoneModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn khu vực</Text>
                <TouchableOpacity onPress={closeZoneModal}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <FlatList
                style={styles.zoneList}
                data={zones}
                keyExtractor={(item) => item.zoneDetailID.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.zoneItem,
                      selectedZone?.zoneDetailID ===
                        item.zoneDetailID && styles.selectedZoneItem,
                    ]}
                    onPress={() => selectZone(item)}>
                    <View style={styles.zoneInfo}>
                      <Text style={styles.zoneName}>
                        {item.displayName}
                      </Text>
                      <Text style={styles.zoneCity}>{item.city}</Text>
                    </View>
                    {selectedZone?.zoneDetailID ===
                      item.zoneDetailID && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color="#4FC3F7"
                      />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.separator} />
                )}
                showsVerticalScrollIndicator={false}
              />

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeZoneModal}>
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Debug component - chỉ hiển thị trong development */}
        {/* {__DEV__ && <UserDataDebugger userData={userData} />} */}

        {/* Debug section - chỉ hiển thị trong development */}
        {/* {__DEV__ && (
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>🔍 Debug Info</Text>
            <Text style={styles.debugText}>
              ID: {userData?.accountID || "N/A"}
            </Text>
            <Text style={styles.debugText}>
              Full Name: {userData?.fullName || "N/A"}
            </Text>
            <Text style={styles.debugText}>
              Phone: {userData?.phoneNumber || "N/A"}
            </Text>
            <Text style={styles.debugText}>
              Email: {userData?.email || "N/A"}
            </Text>
            <Text style={styles.debugText}>
              Role ID: {userData?.roleID || "N/A"}
            </Text>
            <Text style={styles.debugText}>
              Role Name: {userData?.roleName || "N/A"}
            </Text>
            <Text style={styles.debugText}>
              Role:{" "}
              {RoleService.getDisplayName(
                userData?.roleName ||
                  RoleService.getRoleName(
                    userData?.role_id || userData?.roleID
                  )
              )}
            </Text>
            <Text style={styles.debugText}>
              Status: {userData?.status || "N/A"}
            </Text>

            {RoleService.isNursingSpecialist(
              userData?.role_id || userData?.roleID
            ) && (
              <>
                <Text style={styles.debugText}>
                  Nursing ID: {userData?.nursingID || "N/A"}
                </Text>
                <Text style={styles.debugText}>
                  Zone ID: {userData?.zoneID || "N/A"}
                </Text>
                <Text style={styles.debugText}>
                  Gender: {userData?.gender || "N/A"}
                </Text>
                <Text style={styles.debugText}>
                  Date of Birth: {userData?.dateOfBirth || "N/A"}
                </Text>
                <Text style={styles.debugText}>
                  Address: {userData?.address || "N/A"}
                </Text>
                <Text style={styles.debugText}>
                  Experience: {userData?.experience || "N/A"}
                </Text>
                <Text style={styles.debugText}>
                  Slogan: {userData?.slogan || "N/A"}
                </Text>
                <Text style={styles.debugText}>
                  Major: {userData?.major || "N/A"}
                </Text>
              </>
            )}

            <View style={styles.debugButtonContainer}>
              <TouchableOpacity
                style={styles.debugButton}
                onPress={loadUserData}>
                <Text style={styles.debugButtonText}>
                  Reload Data
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.debugButton, styles.clearButton]}
                onPress={async () => {
                  try {
                    // console.log(
                    //   "🔍 ===== FORCE REFRESH FROM API ====="
                    // );
                    await AsyncStorage.clear();
                    // console.log("🔍 AsyncStorage cleared");
                    Alert.alert(
                      "Debug",
                      "AsyncStorage cleared. Please login again."
                    );
                    router.replace("/auth/login");
                  } catch (error) {
                    // console.error(
                    //   "Error clearing AsyncStorage:",
                    //   error
                    // );
                  }
                }}>
                <Text style={styles.debugButtonText}>
                  Clear Storage
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.debugButton,
                  { backgroundColor: "#9C27B0" },
                ]}
                onPress={async () => {
                  try {
                    // console.log("🔍 ===== FORCE ENRICH DATA =====");
                    const user = await AuthService.getUser();
                    if (user) {
                      // console.log("🔍 Current user data:", user);
                      const enrichedUser =
                        await NursingSpecialistService.enrichUserData(
                          user
                        );
                      // console.log(
                      //   "🔍 Enriched user data:",
                      //   enrichedUser
                      // );
                      setUserData(enrichedUser);
                      Alert.alert(
                        "Debug",
                        "Data enriched successfully!"
                      );
                    }
                  } catch (error) {
                    // console.error("🔍 Error force enriching:", error);
                    Alert.alert("Error", "Failed to enrich data");
                  }
                }}>
                <Text style={styles.debugButtonText}>
                  Force Enrich
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )} */}

        {/* AsyncStorage Debugger - chỉ hiển thị trong development */}
        {/* {__DEV__ && <AsyncStorageDebugger />} */}
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
  profileCard: {
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    marginTop: 10,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    fontWeight: "500",
  },
  fieldValue: {
    fontSize: 16,
    color: "#333",
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  textInput: {
    fontSize: 16,
    color: "#333",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#4FC3F7",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  fieldInput: {
    fontSize: 16,
    color: "#333",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  specialistSection: {
    marginTop: 20,
  },
  dropdownContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 5,
  },
  dropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOption: {
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
  },
  selectedOptionText: {
    color: "#4FC3F7",
    fontWeight: "bold",
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
  retryButton: {
    backgroundColor: "#4FC3F7",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  addCareProfileButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  addCareProfileButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  careProfileCard: {
    backgroundColor: "white",
    borderRadius: 15,
    paddingBottom: 5,
    paddingRight: 20,
    paddingLeft: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  careProfileList: {
    marginTop: 5,
  },
  careProfileItem: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 1,
  },
  careProfileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  careProfileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  careProfileDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
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
  careProfileActions: {
    flexDirection: "column", // Thay đổi thành column để xếp dọc
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8, // Giảm padding horizontal
    borderRadius: 6,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 2, // Giảm margin
    flex: 1, // Để các nút có kích thước bằng nhau
    justifyContent: "center", // Căn giữa nội dung
  },
  actionButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    width: "90%",
    maxHeight: "80%",
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
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  formContainer: {
    padding: 20,
  },
  formField: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    fontWeight: "500",
  },
  formInput: {
    fontSize: 16,
    color: "#333",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  cancelButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  relativesSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  relativesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  relativesList: {
    marginTop: 5,
  },
  relativeItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  relativeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  relativeName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  relativeActions: {
    flexDirection: "row",
  },
  relativeActionButton: {
    marginLeft: 10,
  },
  relativeDetails: {
    marginTop: 5,
  },
  relativeDetail: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  emptyRelativesText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 10,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 5,
    marginBottom: 10,
  },
  genderOption: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedGenderOption: {
    backgroundColor: "#e0f7fa",
    borderColor: "#4FC3F7",
  },
  genderOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedGenderOptionText: {
    color: "#4FC3F7",
    fontWeight: "bold",
  },
  addCareProfileButtonContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addRelativeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8, // Giảm padding horizontal
    borderRadius: 6,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 2, // Giảm margin
    flex: 1, // Để các nút có kích thước bằng nhau
    justifyContent: "center", // Căn giữa nội dung
  },
  addRelativeButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  viewNotesButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FF9800",
  },
  viewNotesButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
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
  medicalNoteAdvice: {
    backgroundColor: "#e8f5e8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  medicalNoteAdviceLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 5,
  },
  medicalNoteAdviceText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  medicalNoteDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  medicalNoteDetail: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#e9ecef",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  editDeleteContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingHorizontal: 0, // Đảm bảo không có padding thừa
  },
  zoneList: {
    padding: 20,
  },
  zoneItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedZoneItem: {
    backgroundColor: "#e0f7fa",
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    color: "#333",
  },
  zoneCity: {
    fontSize: 14,
    color: "#666",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
  },
  closeButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  closeIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#FFF5F5",
  },
});
