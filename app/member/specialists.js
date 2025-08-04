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
  TouchableOpacity,
  View,
} from "react-native";
import Avatar from "../../components/Avatar";
import NursingSpecialistService from "../../services/nursingSpecialistService";

export default function SpecialistsScreen() {
  const router = useRouter();
  const [specialists, setSpecialists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const result = await NursingSpecialistService.getAllDetailedSpecialists();
      
      if (result.success) {
        setSpecialists(result.data);
      } else {
        Alert.alert("Lỗi", "Không thể tải danh sách tư vấn viên");
      }
      
    } catch (error) {
      Alert.alert("Lỗi", "Không thể kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };

  const getGenderText = (gender) => {
    if (gender === "nam") return "Nam";
    if (gender === "nữ") return "Nữ";
    return gender || "N/A";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch (error) {
      return "N/A";
    }
  };

  const handleSpecialistPress = (specialist) => {
    setSelectedSpecialist(specialist);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSpecialist(null);
  };

  const renderDetailModal = () => {
    if (!selectedSpecialist) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetailModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông tin chi tiết</Text>
              <TouchableOpacity onPress={closeDetailModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.modalAvatarContainer}>
                <Avatar
                  source={{ uri: selectedSpecialist.avatarUrl }}
                  size={80}
                  name={selectedSpecialist.fullName}
                  fallbackType="initials"
                />
                <Text style={styles.modalName}>{selectedSpecialist.fullName}</Text>
                <View style={styles.modalGenderBadge}>
                  <Text style={styles.modalGenderText}>
                    {getGenderText(selectedSpecialist.gender)}
                  </Text>
                </View>
              </View>

              <View style={styles.modalInfoSection}>
                <Text style={styles.modalSectionTitle}>Thông tin liên hệ</Text>
                
                <View style={styles.modalInfoRow}>
                  <Ionicons name="mail-outline" size={20} color="#4FC3F7" />
                  <Text style={styles.modalInfoLabel}>Email:</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedSpecialist.email || "Chưa cập nhật"}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="call-outline" size={20} color="#4FC3F7" />
                  <Text style={styles.modalInfoLabel}>Số điện thoại:</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedSpecialist.phoneNumber || "Chưa cập nhật"}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="home-outline" size={20} color="#4FC3F7" />
                  <Text style={styles.modalInfoLabel}>Địa chỉ:</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedSpecialist.address || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>

              <View style={styles.modalInfoSection}>
                <Text style={styles.modalSectionTitle}>Thông tin chuyên môn</Text>
                
                <View style={styles.modalInfoRow}>
                  <Ionicons name="person-outline" size={20} color="#4FC3F7" />
                  <Text style={styles.modalInfoLabel}>Chuyên môn:</Text>
                  <Text style={styles.modalInfoValue}>Tư vấn viên</Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="briefcase-outline" size={20} color="#4FC3F7" />
                  <Text style={styles.modalInfoLabel}>Kinh nghiệm:</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedSpecialist.experience || "Chưa cập nhật"}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#4FC3F7" />
                  <Text style={styles.modalInfoLabel}>Ngày sinh:</Text>
                  <Text style={styles.modalInfoValue}>
                    {formatDate(selectedSpecialist.dateOfBirth)}
                  </Text>
                </View>

                {selectedSpecialist.createAt && (
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="time-outline" size={20} color="#4FC3F7" />
                    <Text style={styles.modalInfoLabel}>Tham gia:</Text>
                    <Text style={styles.modalInfoValue}>
                      {formatDate(selectedSpecialist.createAt)}
                    </Text>
                  </View>
                )}
              </View>

              {selectedSpecialist.slogan && (
                <View style={styles.modalInfoSection}>
                  <Text style={styles.modalSectionTitle}>Slogan</Text>
                  <View style={styles.modalSloganContainer}>
                    <Ionicons name="chatbubble-outline" size={20} color="#4FC3F7" />
                    <Text style={styles.modalSloganText}>{selectedSpecialist.slogan}</Text>
                  </View>
                </View>
              )}

              <View style={styles.modalInfoSection}>
                <Text style={styles.modalSectionTitle}>Trạng thái</Text>
                <View style={[
                  styles.modalStatusBadge,
                  { backgroundColor: selectedSpecialist.status === "active" ? "#4CAF50" : "#FF6B6B" }
                ]}>
                  <Text style={styles.modalStatusText}>
                    {selectedSpecialist.status === "active" ? "Hoạt động" : "Không hoạt động"}
                  </Text>
                </View>
              </View>
            </ScrollView>
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
        style={styles.gradientBg}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải danh sách tư vấn viên...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}>
      <View style={styles.headerWrapper}>
        <TouchableOpacity
          style={styles.backBtnOuter}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#4FC3F7" />
        </TouchableOpacity>
        <LinearGradient
          colors={["#F8F9FA", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBox}>
          <Text style={styles.headerText}>Tư Vấn Viên</Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>
          Danh sách tư vấn viên ({specialists.length})
        </Text>

        {specialists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có tư vấn viên nào</Text>
            <Text style={styles.emptySubtext}>
              Vui lòng thử lại sau hoặc liên hệ admin
            </Text>
          </View>
        ) : (
          specialists.map((specialist) => (
            <TouchableOpacity
              key={specialist.nursingID}
              style={styles.specialistCard}
              onPress={() => handleSpecialistPress(specialist)}>
              <View style={styles.avatarContainer}>
                <Avatar
                  source={{ uri: specialist.avatarUrl }}
                  size={60}
                  name={specialist.fullName}
                  fallbackType="initials"
                />
              </View>

              <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.fullName}>{specialist.fullName}</Text>
                  <View style={styles.genderBadge}>
                    <Text style={styles.genderText}>
                      {getGenderText(specialist.gender)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.detailText}>
                    {specialist.email || "Chưa cập nhật"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.detailText}>
                    {specialist.phoneNumber || "Chưa cập nhật"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.detailText}>
                    Tư vấn viên
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.detailText}>
                    {formatDate(specialist.dateOfBirth)}
                  </Text>
                </View>

                {specialist.address && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="home-outline"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.detailText}>
                      {specialist.address}
                    </Text>
                  </View>
                )}

                {specialist.experience && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="briefcase-outline"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.detailText}>
                      {specialist.experience}
                    </Text>
                  </View>
                )}

                {specialist.slogan && (
                  <View style={styles.sloganContainer}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color="#4FC3F7"
                    />
                    <Text style={styles.sloganText}>
                      {specialist.slogan}
                    </Text>
                  </View>
                )}

                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: specialist.status === "active" ? "#4CAF50" : "#FF6B6B" }
                  ]}>
                    <Text style={styles.statusText}>
                      {specialist.status === "active" ? "Hoạt động" : "Không hoạt động"}
                    </Text>
                  </View>
                </View>

                {specialist.createAt && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.detailText}>
                      Tham gia: {formatDate(specialist.createAt)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        {renderDetailModal()}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 10,
    textAlign: "center",
  },
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtnOuter: {
    marginRight: 15,
  },
  headerBox: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#333333",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  specialistCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fullName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  genderBadge: {
    backgroundColor: "#4FC3F7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  genderText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  sloganContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  sloganText: {
    fontSize: 13,
    color: "#4FC3F7",
    fontStyle: "italic",
    marginLeft: 8,
    flex: 1,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    color: "white",
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
  modalBody: {
    padding: 20,
  },
  modalAvatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  modalGenderBadge: {
    backgroundColor: "#4FC3F7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  modalGenderText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  modalInfoSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 10,
    width: 100,
  },
  modalInfoValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  modalSloganContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  modalSloganText: {
    fontSize: 14,
    color: "#4FC3F7",
    fontStyle: "italic",
    marginLeft: 10,
    flex: 1,
  },
  modalStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalStatusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
