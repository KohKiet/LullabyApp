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
import AuthService from "../../services/authService";
import FeedbackService from "../../services/feedbackService";
import NursingSpecialistService from "../../services/nursingSpecialistService";
import WishlistService from "../../services/wishlistService";

export default function NursesScreen() {
  const router = useRouter();
  const [nurses, setNurses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [ratingsMap, setRatingsMap] = useState({}); // nursingID -> avg rating
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [wishlistMap, setWishlistMap] = useState({}); // nursingID -> {isFavorite: boolean, wishlistID: number}
  const [customerID, setCustomerID] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedZone, setSelectedZone] = useState("ALL");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (customerID) {
      loadWishlistData();
    }
  }, [customerID]);

  useEffect(() => {
    loadUserData();
    checkUnreadNotifications();
  }, []);

  const loadUserData = async () => {
    try {
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
      console.error("Error loading user data:", error);
      // Fallback to default customer ID for testing
      setCustomerID(2);
    }
  };

  const checkUnreadNotifications = async () => {
    try {
      // For now, we'll skip notification checking in this screen to avoid the useInsertionEffect error
      // This can be re-enabled later when the React 19 compatibility issue is resolved
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      const result =
        await NursingSpecialistService.getAllDetailedNurses();

      if (result.success) {
        const nursesData = result.data || [];
        setNurses(nursesData);

        // Load average ratings in parallel
        const pairs = await Promise.all(
          nursesData.map(async (n) => {
            const r = await FeedbackService.getAverageRatingByNursing(
              n.nursingID
            );
            return [n.nursingID, r.success ? r.data : 0];
          })
        );
        const map = Object.fromEntries(pairs);
        setRatingsMap(map);
      } else {
        Alert.alert(
          "Thông báo",
          "Không thể tải danh sách điều dưỡng viên"
        );
      }
    } catch (error) {
      Alert.alert("Thông báo", "Không thể kết nối đến server");
    } finally {
      setIsLoading(false);
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

      // Test basic connectivity first
      console.log("🔍 Testing basic connectivity...");
      try {
        const testResponse = await fetch(
          "https://phamlequyanh.name.vn/api/servicetypes/getall"
        );
        console.log(
          "🔍 Health check response status:",
          testResponse.status
        );
      } catch (testError) {
        console.error("🔍 Health check failed:", testError);
      }

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
        // Show user-friendly error message
        Alert.alert(
          "Lỗi kết nối",
          `Không thể tải danh sách yêu thích: ${result.error}. Vui lòng kiểm tra kết nối mạng và thử lại.`
        );
      }
    } catch (error) {
      console.error("Error loading wishlist:", error);
      Alert.alert(
        "Lỗi kết nối",
        `Có lỗi xảy ra khi tải danh sách yêu thích: ${error.message}. Vui lòng kiểm tra kết nối mạng và thử lại.`
      );
    }
  };

  const getGenderText = (gender) => {
    const g = (gender || "").toString().trim().toLowerCase();
    if (["male", "nam", "man", "m"].includes(g)) return "Nam";
    if (["female", "nữ", "nu", "woman", "f"].includes(g)) return "Nữ";
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

  const handleNursePress = (nurse) => {
    setSelectedNurse(nurse);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedNurse(null);
  };

  const handleHeartPress = async (nurse) => {
    if (!customerID) {
      Alert.alert(
        "Lỗi",
        "Chưa đăng nhập. Vui lòng đăng nhập để sử dụng tính năng này."
      );
      return;
    }

    try {
      const nursingID = nurse.nursingID;
      const currentWishlistItem = wishlistMap[nursingID];

      console.log(
        "🔍 Heart press - nursingID:",
        nursingID,
        "customerID:",
        customerID
      );
      console.log("🔍 Current wishlist item:", currentWishlistItem);

      if (currentWishlistItem && currentWishlistItem.isFavorite) {
        // Remove from wishlist
        console.log(
          "🔍 Removing from wishlist, wishlistID:",
          currentWishlistItem.wishlistID
        );
        const result = await WishlistService.removeFromWishlist(
          currentWishlistItem.wishlistID
        );
        console.log("🔍 Remove result:", result);

        if (result.success) {
          setWishlistMap((prev) => ({
            ...prev,
            [nursingID]: { isFavorite: false, wishlistID: null },
          }));
          Alert.alert(
            "Thành công",
            "Đã xóa khỏi danh sách yêu thích"
          );
        } else {
          Alert.alert(
            "Lỗi",
            `Không thể xóa khỏi danh sách yêu thích: ${result.error}`
          );
        }
      } else {
        // Add to wishlist
        console.log(
          "🔍 Adding to wishlist - nursingID:",
          nursingID,
          "customerID:",
          customerID
        );
        const result = await WishlistService.addToWishlist(
          nursingID,
          customerID
        );
        console.log("🔍 Add result:", result);

        if (result.success) {
          setWishlistMap((prev) => ({
            ...prev,
            [nursingID]: {
              isFavorite: true,
              wishlistID: result.data.wishlistID,
            },
          }));
          Alert.alert(
            "Thành công",
            "Đã thêm vào danh sách yêu thích"
          );
        } else {
          Alert.alert(
            "Lỗi",
            `Không thể thêm vào danh sách yêu thích: ${result.error}`
          );
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      Alert.alert(
        "Lỗi",
        `Có lỗi xảy ra khi cập nhật danh sách yêu thích: ${error.message}`
      );
    }
  };

  const renderDetailModal = () => {
    if (!selectedNurse) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetailModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Thông tin chi tiết
              </Text>
              <TouchableOpacity onPress={closeDetailModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalAvatarContainer}>
                <Avatar
                  source={{ uri: selectedNurse.avatarUrl }}
                  size={80}
                  name={selectedNurse.fullName}
                  fallbackType="initials"
                />
                <Text style={styles.modalName}>
                  {selectedNurse.fullName}
                </Text>
                <View style={styles.modalGenderBadge}>
                  <Text style={styles.modalGenderText}>
                    {getGenderText(selectedNurse.gender)}
                  </Text>
                </View>
              </View>

              <View style={styles.modalInfoSection}>
                <Text style={styles.modalSectionTitle}>
                  Thông tin liên hệ
                </Text>

                <View style={styles.modalInfoRow}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#FF8AB3"
                  />
                  <Text style={styles.modalInfoLabel}>Email:</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedNurse.email || "Chưa cập nhật"}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color="#FF8AB3"
                  />
                  <Text style={styles.modalInfoLabel}>
                    Số điện thoại:
                  </Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedNurse.phoneNumber || "Chưa cập nhật"}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons
                    name="home-outline"
                    size={20}
                    color="#FF8AB3"
                  />
                  <Text style={styles.modalInfoLabel}>Địa chỉ:</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedNurse.address || "Chưa cập nhật"}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#FF8AB3"
                  />
                  <Text style={styles.modalInfoLabel}>Khu vực:</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedNurse.zoneName ||
                      `Khu vực ${selectedNurse.zoneID}`}
                    {selectedNurse.city && `, ${selectedNurse.city}`}
                  </Text>
                </View>
              </View>

              <View style={styles.modalInfoSection}>
                <Text style={styles.modalSectionTitle}>
                  Thông tin chuyên môn
                </Text>

                <View style={styles.modalInfoRow}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#FF8AB3"
                  />
                  <Text style={styles.modalInfoLabel}>
                    Chuyên môn:
                  </Text>
                  <Text style={styles.modalInfoValue}>
                    Chuyên viên chăm sóc
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons
                    name="briefcase-outline"
                    size={20}
                    color="#FF8AB3"
                  />
                  <Text style={styles.modalInfoLabel}>
                    Kinh nghiệm:
                  </Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedNurse.experience || "Chưa cập nhật"}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#FF8AB3"
                  />
                  <Text style={styles.modalInfoLabel}>
                    Ngày sinh:
                  </Text>
                  <Text style={styles.modalInfoValue}>
                    {formatDate(selectedNurse.dateOfBirth)}
                  </Text>
                </View>

                {selectedNurse.createAt && (
                  <View style={styles.modalInfoRow}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color="#FF8AB3"
                    />
                    <Text style={styles.modalInfoLabel}>
                      Tham gia:
                    </Text>
                    <Text style={styles.modalInfoValue}>
                      {formatDate(selectedNurse.createAt)}
                    </Text>
                  </View>
                )}
              </View>

              {selectedNurse.slogan && (
                <View style={styles.modalInfoSection}>
                  <Text style={styles.modalSectionTitle}>Slogan</Text>
                  <View style={styles.modalSloganContainer}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color="#FF8AB3"
                    />
                    <Text style={styles.modalSloganText}>
                      {selectedNurse.slogan}
                    </Text>
                  </View>
                </View>
              )}

              {/* Đánh giá trung bình */}
              <View style={styles.modalInfoSection}>
                <Text style={styles.modalSectionTitle}>Đánh giá</Text>
                <View style={styles.modalRatingRow}>
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const val =
                      ratingsMap[selectedNurse.nursingID] || 0;
                    const filled = val >= idx + 1;
                    const half = !filled && val >= idx + 0.5;
                    return (
                      <Ionicons
                        key={idx}
                        name={
                          filled
                            ? "star"
                            : half
                            ? "star-half"
                            : "star-outline"
                        }
                        size={18}
                        color="#FFC107"
                        style={{ marginRight: 3 }}
                      />
                    );
                  })}
                  <Text style={styles.modalRatingText}>
                    {(
                      ratingsMap[selectedNurse.nursingID] || 0
                    ).toFixed(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.modalInfoSection}>
                <Text style={styles.modalSectionTitle}>
                  Trạng thái
                </Text>
                <View
                  style={[
                    styles.modalStatusBadge,
                    {
                      backgroundColor:
                        selectedNurse.status === "active"
                          ? "#4CAF50"
                          : "#FF6B6B",
                    },
                  ]}>
                  <Text style={styles.modalStatusText}>
                    {selectedNurse.status === "active"
                      ? "Hoạt động"
                      : "Không hoạt động"}
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
          <Text style={styles.loadingText}>
            Đang tải danh sách điều dưỡng viên...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  const zoneNameOf = (n) =>
    n.zoneName || (n.zoneID != null ? `Khu vực ${n.zoneID}` : "Khác");
  const zoneOptions = Array.from(
    new Set((nurses || []).map((n) => zoneNameOf(n)))
  );

  const visibleNurses = (
    showFavoritesOnly
      ? nurses.filter((n) => wishlistMap[n.nursingID]?.isFavorite)
      : nurses
  ).filter(
    (n) => selectedZone === "ALL" || zoneNameOf(n) === selectedZone
  );

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
          <Ionicons name="arrow-back" size={28} color="#FF8AB3" />
        </TouchableOpacity>
        <LinearGradient
          colors={["#F8F9FA", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBox}>
          <Text style={styles.headerText}>
            Chuyên Viên Chăm Sóc ({visibleNurses.length})
          </Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Section title removed per request; count is shown in header */}

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              showFavoritesOnly && styles.filterChipActive,
            ]}
            onPress={() => setShowFavoritesOnly((v) => !v)}>
            <Ionicons
              name={showFavoritesOnly ? "heart" : "heart-outline"}
              size={16}
              color={showFavoritesOnly ? "#FF6B6B" : "#666"}
            />
            <Text
              style={[
                styles.filterChipText,
                showFavoritesOnly && styles.filterChipTextActive,
              ]}>
              Yêu thích
            </Text>
          </TouchableOpacity>

          {/* Zone filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.zoneChipsContainer}>
            <TouchableOpacity
              style={[
                styles.zoneChip,
                selectedZone === "ALL" && styles.zoneChipActive,
              ]}
              onPress={() => setSelectedZone("ALL")}>
              <Text
                style={[
                  styles.zoneChipText,
                  selectedZone === "ALL" && styles.zoneChipTextActive,
                ]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            {zoneOptions.map((z) => (
              <TouchableOpacity
                key={z}
                style={[
                  styles.zoneChip,
                  selectedZone === z && styles.zoneChipActive,
                ]}
                onPress={() => setSelectedZone(z)}>
                <Text
                  style={[
                    styles.zoneChipText,
                    selectedZone === z && styles.zoneChipTextActive,
                  ]}>
                  {z}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {nurses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              Chưa có chuyên viên chăm sóc nào
            </Text>
            <Text style={styles.emptySubtext}>
              Vui lòng thử lại sau hoặc liên hệ admin
            </Text>
          </View>
        ) : (
          visibleNurses.map((nurse) => (
            <TouchableOpacity
              key={nurse.nursingID}
              style={styles.nurseCard}
              onPress={() => handleNursePress(nurse)}>
              <View style={styles.avatarContainer}>
                <Avatar
                  source={{ uri: nurse.avatarUrl }}
                  size={60}
                  name={nurse.fullName}
                  fallbackType="initials"
                />
              </View>

              <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.fullName}>
                    {nurse.fullName}
                  </Text>
                  <View style={styles.genderBadge}>
                    <Text style={styles.genderText}>
                      {getGenderText(nurse.gender)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.heartButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleHeartPress(nurse);
                    }}>
                    <Ionicons
                      name={
                        wishlistMap[nurse.nursingID]?.isFavorite
                          ? "heart"
                          : "heart-outline"
                      }
                      size={24}
                      color={
                        wishlistMap[nurse.nursingID]?.isFavorite
                          ? "#FF6B6B"
                          : "#999"
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Hiển thị thông tin khu vực */}
                <View style={styles.detailRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.detailText}>
                    {nurse.zoneName || `Khu vực ${nurse.zoneID}`}
                    {nurse.city && `, ${nurse.city}`}
                  </Text>
                </View>

                {nurse.experience && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="briefcase-outline"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.detailText}>
                      {nurse.experience}
                    </Text>
                  </View>
                )}

                {nurse.slogan && (
                  <View style={styles.sloganContainer}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color="#FF8AB3"
                    />
                    <Text style={styles.sloganText}>
                      {nurse.slogan}
                    </Text>
                  </View>
                )}

                {/* Rating stars */}
                <View style={styles.ratingRow}>
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const filled =
                      (ratingsMap[nurse.nursingID] || 0) >= idx + 1;
                    const half =
                      !filled &&
                      (ratingsMap[nurse.nursingID] || 0) >= idx + 0.5;
                    return (
                      <Ionicons
                        key={idx}
                        name={
                          filled
                            ? "star"
                            : half
                            ? "star-half"
                            : "star-outline"
                        }
                        size={16}
                        color="#FFC107"
                        style={{ marginRight: 2 }}
                      />
                    );
                  })}
                  <Text style={styles.ratingText}>
                    {(ratingsMap[nurse.nursingID] || 0).toFixed(1)}
                  </Text>
                </View>

                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          nurse.status === "active"
                            ? "#4CAF50"
                            : "#FF6B6B",
                      },
                    ]}>
                    <Text style={styles.statusText}>
                      {nurse.status === "active"
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </Text>
                  </View>
                </View>
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
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  zoneChipsContainer: {
    paddingLeft: 10,
    marginLeft: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: "#FFE5E5",
  },
  filterChipText: {
    marginLeft: 6,
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FF6B6B",
  },
  zoneChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  zoneChipActive: {
    backgroundColor: "#E3F2FD",
  },
  zoneChipText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  zoneChipTextActive: {
    color: "#1976D2",
  },
  nurseCard: {
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
  heartButton: {
    padding: 8,
    marginLeft: 8,
  },
  genderBadge: {
    backgroundColor: "#FF8AB3",
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
    color: "#FF8AB3",
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
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#666",
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
    backgroundColor: "#FF8AB3",
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
    color: "#FF8AB3",
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
  modalRatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalRatingText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#666",
  },
});
