import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AuthService from "../../services/authService";
import CareProfileService from "../../services/careProfileService";
import NursingSpecialistService from "../../services/nursingSpecialistService";
import RelativeService from "../../services/relativeService";
import RoleService from "../../services/roleService";
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
    gender: "Nam",
    note: "",
  });
  const [selectedCareProfileId, setSelectedCareProfileId] =
    useState(null);
  const [editingRelative, setEditingRelative] = useState(null);
  const [showEditRelativeForm, setShowEditRelativeForm] =
    useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      loadCareProfiles();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      const user = await AuthService.getUser();

      if (user) {
        // Kiểm tra xem có phải NursingSpecialist không và cần enrich data
        const isNursingSpecialist = RoleService.isNursingSpecialist(
          user.role_id || user.roleID
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

  const loadCareProfiles = async () => {
    if (!userData) return;

    try {
      setIsLoadingCareProfiles(true);

      const result =
        await CareProfileService.getCareProfilesByAccountId(
          userData.accountID || userData.id
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
        userData.role_id || userData.roleID
      );

      if (isNursingSpecialist) {
        // Chuẩn bị data cho NursingSpecialist update
        const nursingUpdateData = {
          zoneID: userData.zoneID || 1,
          gender: userData.gender || "Nữ",
          dateOfBirth:
            userData.dateOfBirth || new Date().toISOString(),
          fullName: userData.fullName || userData.full_name || "",
          address: userData.address || "",
          experience: userData.experience || "",
          slogan: userData.slogan || "",
          major: userData.major || "",
        };

        // Sử dụng NursingSpecialistService để update
        const result =
          await NursingSpecialistService.updateNursingSpecialist(
            userData.nursingID,
            nursingUpdateData
          );

        if (result.success) {
          // Cập nhật user data với response mới
          const updatedUser = {
            ...userData,
            ...result.data,
            // Map lại các field để phù hợp với app
            fullName: result.data.fullName || userData.fullName,
            full_name: result.data.fullName || userData.fullName,
            nursingID: result.data.nursingID,
            accountID: result.data.accountID,
            zoneID: result.data.zoneID,
            gender: result.data.gender,
            dateOfBirth: result.data.dateOfBirth,
            address: result.data.address,
            experience: result.data.experience,
            slogan: result.data.slogan,
            major: result.data.major,
            status: result.data.status,
          };

          setUserData(updatedUser);
          setIsEditing(false);
          Alert.alert("Thành công", "Đã cập nhật thông tin profile!");
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
          Alert.alert("Thành công", "Đã cập nhật thông tin profile!");
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
        Alert.alert(
          "Thành công",
          `Đã tạo hồ sơ chăm sóc: ${result.data.careProfile.profileName}`
        );
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
    });
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
    });
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
      gender: "Nam",
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
      gender: "Nam",
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
      gender: relative.gender || "Nam",
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
      gender: "Nam",
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
        relativeName: relativeForm.relativeName.trim(),
        dateOfBirth: new Date(relativeForm.dateOfBirth).toISOString(),
        gender: relativeForm.gender,
        image: editingRelative.image || "",
        note: relativeForm.note.trim(),
      };

      const result = await RelativeService.updateRelative(
        editingRelative.relativeID,
        updateData
      );

      if (result.success) {
        Alert.alert(
          "Thành công",
          `Đã cập nhật thông tin con: ${result.data.relative.relativeName}`
        );
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

      // Chuẩn bị data cho care profile
      const careProfileData = {
        accountID: userData.accountID || userData.id,
        zoneDetailID: 1, // Default zone detail ID
        profileName: careProfileForm.profileName.trim(),
        dateOfBirth: new Date(
          careProfileForm.dateOfBirth
        ).toISOString(),
        phoneNumber: careProfileForm.phoneNumber.trim(),
        address: careProfileForm.address.trim(),
        image: "string", // Default image
        note: careProfileForm.note.trim(),
      };

      const result = await CareProfileService.createCareProfile(
        careProfileData
      );

      if (result.success) {
        Alert.alert(
          "Thành công",
          `Đã tạo hồ sơ chăm sóc: ${result.data.careProfile.profileName}`
        );
        // Reload care profiles sau khi tạo thành công
        await loadCareProfiles();
        // Đóng form
        closeCareProfileForm();
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
      userData.role_id || userData.roleID
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
            <Text style={styles.fieldValue}>{field.value}</Text>
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
            <Text style={styles.fieldValue}>{field.value}</Text>
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
              Nhấn nút "Thêm hồ sơ chăm sóc" để tạo hồ sơ đầu tiên
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
                          profile.status === "Active"
                            ? "#4CAF50"
                            : "#FF6B6B",
                      },
                    ]}>
                    <Text style={styles.statusText}>
                      {profile.status === "Active"
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
                    style={styles.actionButton}
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
                        styles.actionButtonText,
                        { color: "#2196F3" },
                      ]}>
                      Thêm Con
                    </Text>
                  </TouchableOpacity>
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
                    relativeForm.gender === "Nam" &&
                      styles.selectedGenderOption,
                  ]}
                  onPress={() =>
                    handleRelativeFormChange("gender", "Nam")
                  }>
                  <Text
                    style={[
                      styles.genderOptionText,
                      relativeForm.gender === "Nam" &&
                        styles.selectedGenderOptionText,
                    ]}>
                    Nam
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    relativeForm.gender === "Nữ" &&
                      styles.selectedGenderOption,
                  ]}
                  onPress={() =>
                    handleRelativeFormChange("gender", "Nữ")
                  }>
                  <Text
                    style={[
                      styles.genderOptionText,
                      relativeForm.gender === "Nữ" &&
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
                    relativeForm.gender === "Nam" &&
                      styles.selectedGenderOption,
                  ]}
                  onPress={() =>
                    handleRelativeFormChange("gender", "Nam")
                  }>
                  <Text
                    style={[
                      styles.genderOptionText,
                      relativeForm.gender === "Nam" &&
                        styles.selectedGenderOptionText,
                    ]}>
                    Nam
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    relativeForm.gender === "Nữ" &&
                      styles.selectedGenderOption,
                  ]}
                  onPress={() =>
                    handleRelativeFormChange("gender", "Nữ")
                  }>
                  <Text
                    style={[
                      styles.genderOptionText,
                      relativeForm.gender === "Nữ" &&
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

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}>
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>

          {/* Chỉ hiển thị "Thêm hồ sơ chăm sóc" cho Customer */}
          {!RoleService.isNursingSpecialist(
            userData.role_id || userData.roleID
          ) && (
            <TouchableOpacity
              style={styles.addCareProfileButton}
              onPress={openCareProfileForm}>
              <Text style={styles.addCareProfileButtonText}>
                Thêm hồ sơ chăm sóc
              </Text>
            </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 5,
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
});
